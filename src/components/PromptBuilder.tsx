import { useState, useMemo, useRef } from 'react'
import { GoogleGenAI } from '@google/genai'
import { supabase } from '../lib/supabase'
import type { Upload, Generation } from '../types'

interface Props {
  contentImages: Upload[]
  referenceImages: Upload[]
  apiKey: string
  projectId: string
  onGenerated: (gen: Generation) => void
}

const METALS = ['silver', 'gold', 'rose gold', 'platinum']
const STONES = ['round cut gemstone', 'teardrop gemstone', 'princess cut gemstone', 'emerald cut gemstone', 'oval gemstone', 'marquise gemstone', 'pear gemstone', 'cushion cut gemstone']
const BACKGROUNDS = ['light grey', 'white', 'light pink', 'cream']
const ANGLES = [
  { label: 'Straight-on', value: 'straight-on, front-facing orthographic view (no side angle, no perspective tilt). The camera should be positioned directly in front of the objects at eye level, with zero rotation on the X and Y axis' },
  { label: 'Angled', value: 'angled, centered' },
  { label: '3/4 view', value: 'three-quarter angle, slightly elevated' },
]
const TIMEOUT_MS = 90000

function buildPrompt(metal: string, stone: string, bg: string, angle: string, contentCount: number, refCount: number): string {
  const refDesc = refCount === 1 ? 'the last image' : `the last ${refCount} reference images`
  return `Take the stud earring from the first ${contentCount} images (${metal}, ${stone}) and recreate it in the exact composition, angle, and layout of ${refDesc}. The earring should be shown in two separated parts (front stud and backing), horizontally aligned and floating against a clean ${bg} background. Match the ${angle}, product photography style with soft shadows beneath each piece.
Keep the original earring design (${stone.replace('gemstone', 'stone').replace('cut ', 'cut ')} and setting), but render it with the same polished, high-end, minimal aesthetic as the reference. Ensure the circular backing should appear as a full circle (not an ellipse), and the post should extend directly toward the viewer in a straight line, matching the reference layout. The output should be photorealistic, with accurate metallic reflections and gemstone refraction.`
}

export default function PromptBuilder({ contentImages, referenceImages, apiKey, projectId, onGenerated }: Props) {
  const [metal, setMetal] = useState('silver')
  const [stone, setStone] = useState('round cut gemstone')
  const [bg, setBg] = useState('light grey')
  const [angleIdx, setAngleIdx] = useState(0)
  const [customPrompt, setCustomPrompt] = useState('')
  const [useCustom, setUseCustom] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [progress, setProgress] = useState('')
  const cancelledRef = useRef(false)

  const autoPrompt = useMemo(
    () => buildPrompt(metal, stone, bg, ANGLES[angleIdx].value, contentImages.length, referenceImages.length),
    [metal, stone, bg, angleIdx, contentImages.length, referenceImages.length]
  )

  const activePrompt = useCustom ? customPrompt : autoPrompt
  const canGenerate = contentImages.length > 0 && referenceImages.length > 0 && apiKey && activePrompt.trim()

  const handleCancel = () => { cancelledRef.current = true }

  const handleGenerate = async () => {
    if (!canGenerate || generating) return
    setGenerating(true)
    setError('')
    setProgress('Preparing images...')
    cancelledRef.current = false

    try {
      const ai = new GoogleGenAI({ apiKey })
      const imageParts: Array<{ inlineData: { mimeType: string; data: string } } | { text: string }> = []
      const allImages = [...contentImages, ...referenceImages]

      for (let i = 0; i < allImages.length; i++) {
        if (cancelledRef.current) { setGenerating(false); setProgress(''); return }
        setProgress(`Loading image ${i + 1} of ${allImages.length}...`)
        try {
          const res = await fetch(allImages[i].url)
          if (!res.ok) throw new Error(`Failed to load ${allImages[i].filename}`)
          const blob = await res.blob()
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve((reader.result as string).split(',')[1])
            reader.onerror = () => reject(new Error('Failed to read image'))
            reader.readAsDataURL(blob)
          })
          imageParts.push({ inlineData: { mimeType: blob.type || 'image/jpeg', data: base64 } })
        } catch (imgErr: any) {
          setError(`Failed to load image "${allImages[i].filename}": ${imgErr.message}`)
          setGenerating(false)
          setProgress('')
          return
        }
      }

      if (cancelledRef.current) { setGenerating(false); setProgress(''); return }
      setProgress('Generating mockup...')
      imageParts.push({ text: activePrompt })

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Generation timed out after 90 seconds. Try again.')), TIMEOUT_MS)
      )

      const genPromise = ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: [{ role: 'user', parts: imageParts }],
        config: { responseModalities: ['TEXT', 'IMAGE'] },
      })

      const response = await Promise.race([genPromise, timeoutPromise])

      if (cancelledRef.current) { setGenerating(false); setProgress(''); return }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const parts: any[] = response.candidates?.[0]?.content?.parts || []
      const imgPart = parts.find((p: any) =>
        p.inlineData?.mimeType?.startsWith('image/')
      )

      if (!imgPart?.inlineData) {
        const textPart = parts.find((p: any) => typeof p.text === 'string')
        const hint = textPart ? ` Response: ${String(textPart.text).substring(0, 200)}` : ''
        setError('No image in response. Try adjusting the prompt.' + hint)
        setGenerating(false)
        setProgress('')
        return
      }

      setProgress('Saving result...')
      const inlineData = imgPart.inlineData as { data: string; mimeType: string }
      const ext = inlineData.mimeType.includes('png') ? 'png' : 'jpg'
      const path = `${projectId}/generated/${Date.now()}.${ext}`
      const bytes = Uint8Array.from(atob(inlineData.data), c => c.charCodeAt(0))

      const { error: uploadErr } = await supabase.storage.from('generations').upload(path, bytes, { contentType: inlineData.mimeType })
      if (uploadErr) { setError('Failed to save image: ' + uploadErr.message); setGenerating(false); setProgress(''); return }

      const { data: { publicUrl } } = supabase.storage.from('generations').getPublicUrl(path)
      const { data: gen, error: dbErr } = await supabase
        .from('generations')
        .insert({ project_id: projectId, prompt: activePrompt, image_url: publicUrl, saved: false })
        .select()
        .single()

      if (dbErr || !gen) setError('Failed to save record: ' + (dbErr?.message || 'Unknown error'))
      else onGenerated(gen as Generation)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Generation failed'
      if (msg.includes('quota') || msg.includes('429')) {
        setError('API quota exceeded. Check your billing at console.cloud.google.com or wait a minute and retry.')
      } else if (msg.includes('API key')) {
        setError('Invalid API key. Check your key in Settings.')
      } else {
        setError(msg)
      }
    }
    setGenerating(false)
    setProgress('')
  }

  return (
    <div>
      <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-4">Prompt</h3>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {[
          { label: 'Metal', value: metal, onChange: setMetal, options: METALS },
          { label: 'Stone Type', value: stone, onChange: setStone, options: STONES },
          { label: 'Background', value: bg, onChange: setBg, options: BACKGROUNDS },
        ].map(({ label, value, onChange, options }) => (
          <div key={label}>
            <label className="text-xs text-[var(--text-muted)] mb-1 block">{label}</label>
            <select value={value} onChange={e => onChange(e.target.value)} className="w-full px-3 py-2.5 bg-[var(--surface)] border border-[var(--border)] text-sm text-[var(--text)] outline-none focus:border-[var(--text)] transition">
              {options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        ))}
        <div>
          <label className="text-xs text-[var(--text-muted)] mb-1 block">Camera Angle</label>
          <select value={angleIdx} onChange={e => setAngleIdx(Number(e.target.value))} className="w-full px-3 py-2.5 bg-[var(--surface)] border border-[var(--border)] text-sm text-[var(--text)] outline-none focus:border-[var(--text)] transition">
            {ANGLES.map((a, i) => <option key={i} value={i}>{a.label}</option>)}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <label className="text-xs text-[var(--text-muted)]">Prompt preview</label>
        <button onClick={() => { setUseCustom(!useCustom); if (!useCustom) setCustomPrompt(autoPrompt) }} className="text-xs text-[var(--text)] font-medium hover:underline">
          {useCustom ? 'Use template' : 'Edit manually'}
        </button>
      </div>
      <textarea
        value={activePrompt}
        onChange={e => { setUseCustom(true); setCustomPrompt(e.target.value) }}
        readOnly={!useCustom}
        rows={5}
        className={`w-full px-4 py-3 bg-[var(--surface)] border border-[var(--border)] text-sm text-[var(--text)] outline-none resize-y leading-relaxed transition ${!useCustom ? 'opacity-60' : 'focus:border-[var(--text)]'}`}
      />

      <div className="flex items-center gap-4 mt-4">
        {generating ? (
          <>
            <button onClick={handleCancel} className="px-10 py-3 bg-red-100 text-red-700 font-bold hover:bg-red-200 transition text-sm uppercase tracking-wider">
              Cancel
            </button>
            <span className="text-sm text-[var(--text-muted)]">{progress}</span>
          </>
        ) : (
          <>
            <button
              onClick={handleGenerate}
              disabled={!canGenerate}
              className="px-10 py-3 bg-[var(--accent)] text-[var(--accent-text)] font-bold hover:bg-[var(--accent-hover)] transition disabled:opacity-40 text-sm uppercase tracking-wider"
            >
              Generate
            </button>
            {!apiKey && <span className="text-xs text-amber-700">Set your API key in Settings</span>}
            {contentImages.length === 0 && <span className="text-xs text-[var(--text-muted)]">Upload content images</span>}
            {referenceImages.length === 0 && <span className="text-xs text-[var(--text-muted)]">Upload reference images</span>}
          </>
        )}
      </div>
      {error && <p className="text-red-600 text-sm mt-3 bg-red-50 border border-red-200 px-4 py-3">{error}</p>}
    </div>
  )
}
