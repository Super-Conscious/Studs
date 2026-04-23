import { useRef, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Upload } from '../types'

interface Props {
  title: string
  hint: string
  tooltip?: string
  type: 'content' | 'reference'
  projectId: string
  images: Upload[]
  onUpload: () => void
  onDelete: (upload: Upload) => void
  locked?: boolean
  onToggleLock?: () => void
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE_MB = 5
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024

export default function UploadPanel({ title, hint, tooltip, type, projectId, images, onUpload, onDelete, locked, onToggleLock }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [showTooltip, setShowTooltip] = useState(false)

  // Auto-dismiss errors after 5s
  useEffect(() => {
    if (!error) return
    const t = setTimeout(() => setError(''), 5000)
    return () => clearTimeout(t)
  }, [error])

  const handleFiles = async (files: FileList) => {
    setError('')
    const validFiles: File[] = []
    for (const file of Array.from(files)) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError(`"${file.name}" — use JPEG, PNG, or WebP only.`)
        continue
      }
      if (file.size > MAX_SIZE_BYTES) {
        setError(`"${file.name}" is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max ${MAX_SIZE_MB}MB.`)
        continue
      }
      validFiles.push(file)
    }
    if (validFiles.length === 0) return

    setUploading(true)
    for (const file of validFiles) {
      const ext = file.name.split('.').pop()
      const path = `${projectId}/${type}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: uploadErr } = await supabase.storage.from('Uploads').upload(path, file)
      if (uploadErr) { setError(`Upload failed: ${uploadErr.message}`); continue }
      const { data: { publicUrl } } = supabase.storage.from('Uploads').getPublicUrl(path)
      const { error: dbErr } = await supabase.from('uploads').insert({ project_id: projectId, type, url: publicUrl, filename: file.name, storage_path: path })
      if (dbErr) setError(`Save failed: ${dbErr.message}`)
    }
    setUploading(false)
    onUpload()
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">{title}</h3>
        {onToggleLock && (
          <button
            onClick={onToggleLock}
            title={locked ? 'Unlock' : 'Lock'}
            className={`text-xs font-medium flex items-center gap-1 transition ml-auto ${locked ? 'text-[var(--accent)]' : 'text-[var(--text-muted)] hover:text-[var(--text)]'}`}
          >
            {locked ? '🔒 Locked' : '🔓 Lock'}
          </button>
        )}
        {tooltip && (
          <div className="relative">
            <button
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              onClick={() => setShowTooltip(!showTooltip)}
              className="w-4 h-4 bg-[var(--surface2)] text-[var(--text-muted)] text-[10px] flex items-center justify-center hover:bg-[var(--border)] transition"
            >
              ?
            </button>
            {showTooltip && (
              <div className="absolute left-6 top-0 z-10 bg-[var(--text)] text-white text-xs p-3 w-56 shadow-lg">
                {tooltip}
              </div>
            )}
          </div>
        )}
      </div>
      <p className="text-xs text-[var(--text-muted)] mb-3 opacity-70">{hint}</p>

      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-3">
          {images.map((img, idx) => (
            <div key={img.id} className="relative group aspect-square overflow-hidden bg-white border border-[var(--border)]">
              <img src={img.url} alt={img.filename} className="w-full h-full object-cover" />
              <span className="absolute top-1 left-1 min-w-[20px] h-5 bg-black/70 text-[10px] text-white flex items-center justify-center font-bold px-1">
                {idx + 1}
              </span>
              {!locked && (
                <button
                  onClick={() => onDelete(img)}
                  className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-[10px] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                >
                  x
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {!locked && (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed p-5 text-center cursor-pointer transition ${
            dragOver ? 'border-[var(--accent)] bg-[var(--accent)]/10' : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--text-muted)]'
          }`}
        >
          <div className="text-sm">{uploading ? 'Uploading...' : 'Drag & drop photos here, or click to browse'}</div>
          <div className="text-[10px] text-[var(--text-muted)] mt-1 opacity-60">JPEG, PNG, WebP — max {MAX_SIZE_MB}MB each</div>
          <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.webp" multiple hidden onChange={e => { if (e.target.files) handleFiles(e.target.files); e.target.value = '' }} />
        </div>
      )}
      {error && (
        <div className="flex items-center justify-between mt-2 text-red-600 text-xs bg-red-50 px-3 py-2">
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-2 text-red-400 hover:text-red-600">x</button>
        </div>
      )}
    </div>
  )
}
