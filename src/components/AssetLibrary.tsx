import { useState } from 'react'
import JSZip from 'jszip'
import type { Generation } from '../types'

interface Props {
  generations: Generation[]
  onToggleSave: (gen: Generation) => void
  onDelete: (gen: Generation) => void
}

export default function AssetLibrary({ generations, onToggleSave, onDelete }: Props) {
  const [downloading, setDownloading] = useState(false)

  const handleDownloadAll = async () => {
    if (generations.length === 0) return
    setDownloading(true)
    try {
      const zip = new JSZip()
      for (let i = 0; i < generations.length; i++) {
        const res = await fetch(generations[i].image_url)
        const blob = await res.blob()
        const ext = blob.type.includes('png') ? 'png' : 'jpg'
        zip.file(`studs-${i + 1}.${ext}`, blob)
      }
      const content = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(content)
      const a = document.createElement('a')
      a.href = url
      a.download = `studs-assets-${Date.now()}.zip`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('ZIP download failed:', err)
    }
    setDownloading(false)
  }

  if (generations.length === 0) {
    return (
      <div className="text-center py-20 text-[var(--text-muted)]">
        <p className="text-lg mb-2">No saved assets yet</p>
        <p className="text-sm">Generate images and click Save to add them here.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
          Saved Assets ({generations.length})
        </h3>
        <button
          onClick={handleDownloadAll}
          disabled={downloading}
          className="px-5 py-2 bg-[var(--accent)] text-[var(--accent-text)] font-bold text-sm hover:bg-[var(--accent-hover)] transition disabled:opacity-50 uppercase tracking-wider"
        >
          {downloading ? 'Zipping...' : 'Download All (.zip)'}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {generations.map(gen => (
          <div key={gen.id} className="bg-[var(--surface)] border border-[var(--border)] overflow-hidden">
            <img src={gen.image_url} alt="Saved earring" className="w-full aspect-square object-contain bg-neutral-50" />
            <div className="px-3 py-3 flex gap-2">
              <a href={gen.image_url} download className="px-3 py-1.5 bg-[var(--surface2)] text-[var(--text)] text-xs font-medium hover:bg-[var(--border)] transition">
                Download
              </a>
              <button onClick={() => onToggleSave(gen)} className="px-3 py-1.5 bg-[var(--surface2)] text-[var(--text)] text-xs font-medium hover:bg-[var(--border)] transition">
                Unsave
              </button>
              <button onClick={() => { if (confirm('Delete permanently?')) onDelete(gen) }} className="px-3 py-1.5 text-xs text-[var(--text-muted)] hover:text-red-600 transition ml-auto">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
