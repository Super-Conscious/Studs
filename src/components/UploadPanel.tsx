import { useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Upload } from '../types'

interface Props {
  title: string
  hint: string
  type: 'content' | 'reference'
  projectId: string
  images: Upload[]
  onUpload: () => void
  onDelete: (upload: Upload) => void
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE_MB = 5
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024

export default function UploadPanel({ title, hint, type, projectId, images, onUpload, onDelete }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const handleFiles = async (files: FileList) => {
    setError('')
    const validFiles: File[] = []
    for (const file of Array.from(files)) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError(`"${file.name}" is not supported. Use JPEG, PNG, or WebP.`)
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
      const { error: uploadErr } = await supabase.storage.from('uploads').upload(path, file)
      if (uploadErr) {
        setError(`Failed to upload "${file.name}": ${uploadErr.message}`)
        continue
      }
      const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(path)
      const { error: dbErr } = await supabase.from('uploads').insert({ project_id: projectId, type, url: publicUrl, filename: file.name, storage_path: path })
      if (dbErr) {
        setError(`Failed to save "${file.name}": ${dbErr.message}`)
      }
    }
    setUploading(false)
    onUpload()
  }

  return (
    <div>
      <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">{title}</h3>
      <p className="text-xs text-[var(--text-muted)] mb-3 opacity-70">{hint}</p>

      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-3">
          {images.map((img, idx) => (
            <div key={img.id} className="relative group aspect-square overflow-hidden bg-white border border-[var(--border)]">
              <img src={img.url} alt={img.filename} className="w-full h-full object-cover" />
              <span className="absolute top-1 left-1 w-5 h-5 bg-black/70 text-[10px] text-white flex items-center justify-center font-bold">
                {idx + 1}
              </span>
              <button
                onClick={() => onDelete(img)}
                className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-[10px] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
              >
                x
              </button>
            </div>
          ))}
        </div>
      )}

      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed p-4 text-center cursor-pointer transition text-sm ${
          dragOver ? 'border-[var(--accent)] bg-[var(--accent)]/10' : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--text-muted)]'
        }`}
      >
        {uploading ? 'Uploading...' : 'Drop images or click'}
        <div className="text-[10px] text-[var(--text-muted)] mt-1 opacity-60">JPEG, PNG, WebP — max {MAX_SIZE_MB}MB</div>
        <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.webp" multiple hidden onChange={e => { if (e.target.files) handleFiles(e.target.files); e.target.value = '' }} />
      </div>
      {error && <p className="text-red-600 text-xs mt-2">{error}</p>}
    </div>
  )
}
