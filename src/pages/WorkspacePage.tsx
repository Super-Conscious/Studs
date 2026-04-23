import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useApiKey } from '../hooks/useApiKey'
import { supabase } from '../lib/supabase'
import UploadPanel from '../components/UploadPanel'
import PromptBuilder from '../components/PromptBuilder'
import ResultsGrid from '../components/ResultsGrid'
import AssetLibrary from '../components/AssetLibrary'
import { showToast } from '../components/Toast'
import type { Upload, Generation } from '../types'

export default function WorkspacePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { apiKey } = useApiKey()

  const [projectName, setProjectName] = useState('')
  const [uploads, setUploads] = useState<Upload[]>([])
  const [generations, setGenerations] = useState<Generation[]>([])
  const [activeTab, setActiveTab] = useState<'generate' | 'library'>('generate')
  const [generating, setGenerating] = useState(false)
  const [referenceLocked, setReferenceLocked] = useState(false)

  // Page title
  useEffect(() => { document.title = projectName ? `Studs — ${projectName}` : 'Studs' }, [projectName])

  const loadProject = useCallback(async () => {
    if (!id) return
    const { data } = await supabase.from('projects').select('name').eq('id', id).single()
    if (data) setProjectName(data.name)
    else navigate('/')
  }, [id, navigate])

  const loadUploads = useCallback(async () => {
    if (!id) return
    const { data } = await supabase.from('uploads').select('*').eq('project_id', id).order('created_at', { ascending: true })
    setUploads(data || [])
  }, [id])

  const loadGenerations = useCallback(async () => {
    if (!id) return
    const { data } = await supabase.from('generations').select('*').eq('project_id', id).order('created_at', { ascending: false })
    setGenerations(data || [])
  }, [id])

  useEffect(() => { loadProject(); loadUploads(); loadGenerations() }, [loadProject, loadUploads, loadGenerations])

  const contentImages = uploads.filter(u => u.type === 'content')
  const referenceImages = uploads.filter(u => u.type === 'reference')
  const handleUploadComplete = () => loadUploads()

  const handleDeleteUpload = async (upload: Upload) => {
    await supabase.storage.from('Uploads').remove([upload.storage_path])
    await supabase.from('uploads').delete().eq('id', upload.id)
    setUploads(prev => prev.filter(u => u.id !== upload.id))
  }

  const handleGenerated = (gen: Generation) => {
    setGenerations(prev => [gen, ...prev])
    setGenerating(false)
  }

  const handleToggleSave = async (gen: Generation) => {
    const saved = !gen.saved
    await supabase.from('generations').update({ saved }).eq('id', gen.id)
    setGenerations(prev => prev.map(g => g.id === gen.id ? { ...g, saved } : g))
    showToast(saved ? 'Added to library' : 'Removed from library')
  }

  const handleDeleteGeneration = async (gen: Generation) => {
    await supabase.from('generations').delete().eq('id', gen.id)
    setGenerations(prev => prev.filter(g => g.id !== gen.id))
    showToast('Image deleted')
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="border-b border-[var(--border)] px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => { document.title = 'Studs'; navigate('/') }} className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition">
            &larr;
          </button>
          <span className="text-[var(--border)]">/</span>
          <h1 className="font-semibold">{projectName}</h1>
        </div>
        <div className="flex items-center gap-1 bg-[var(--surface)] p-1">
          <button
            onClick={() => setActiveTab('generate')}
            className={`px-5 py-1.5 text-sm font-medium transition ${activeTab === 'generate' ? 'bg-white text-[var(--text)] shadow-sm' : 'text-[var(--text-muted)]'}`}
          >
            Generate
          </button>
          <button
            onClick={() => setActiveTab('library')}
            className={`px-5 py-1.5 text-sm font-medium transition ${activeTab === 'library' ? 'bg-white text-[var(--text)] shadow-sm' : 'text-[var(--text-muted)]'}`}
          >
            Library {generations.filter(g => g.saved).length > 0 && <span className="ml-1 text-xs opacity-50">({generations.filter(g => g.saved).length})</span>}
          </button>
        </div>
      </header>

      {activeTab === 'generate' ? (
        <div className="flex flex-1 overflow-hidden flex-col lg:flex-row">
          <div className="w-full lg:w-96 border-b lg:border-b-0 lg:border-r border-[var(--border)] overflow-y-auto p-6 space-y-6 shrink-0 bg-[var(--surface)]">
            <UploadPanel
              title="Earring Photos"
              hint="The earring you want to recreate"
              tooltip="Upload 1-4 photos of the physical earring from different angles. These are the 'content' images that tell the AI what the earring looks like."
              type="content"
              projectId={id!}
              images={contentImages}
              onUpload={handleUploadComplete}
              onDelete={handleDeleteUpload}
            />
            <UploadPanel
              title="Style References"
              hint="How the final image should look"
              tooltip="Upload 1-2 existing product photos that show the composition, angle, background, and aesthetic you want. The AI will recreate your earring in this style."
              type="reference"
              projectId={id!}
              images={referenceImages}
              onUpload={handleUploadComplete}
              onDelete={handleDeleteUpload}
              locked={referenceLocked}
              onToggleLock={() => setReferenceLocked(l => !l)}
            />
          </div>
          <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-8">
            <PromptBuilder contentImages={contentImages} referenceImages={referenceImages} apiKey={apiKey} projectId={id!} onGenerated={handleGenerated} />
            <ResultsGrid generations={generations} generating={generating} onToggleSave={handleToggleSave} onDelete={handleDeleteGeneration} />
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-6 lg:p-8">
          <AssetLibrary generations={generations.filter(g => g.saved)} onToggleSave={handleToggleSave} onDelete={handleDeleteGeneration} />
        </div>
      )}
    </div>
  )
}
