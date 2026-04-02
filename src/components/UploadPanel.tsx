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

export default function UploadPanel({ title, hint, type, projectId, images, onUpload, onDelete }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)

  const handleFiles = async (files: FileList) => {
    setUploading(true)
    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop()
      const path = `${projectId}/${type}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const { error: uploadErr } = await supabase.storage.from('uploads').upload(path, file)
      if (uploadErr) { console.error(uploadErr); continue }

      const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(path)

      await supabase.from('uploads').insert({
        project_id: projectId,
        type,
        url: publicUrl,
        filename: file.name,
        storage_path: path,
      })
    }
    setUploading(false)
    onUpload()
  }

  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">{title}</h3>
      <p className="text-xs text-[var(--text-muted)] mb-3 opacity-60">{hint}</p>

      {/* Thumbnails */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-3">
          {images.map(img => (
            <div key={img.id} className="relative group aspect-square rounded-lg overflow-hidden bg-[var(--surface2)]">
              <img src={img.url} alt={img.filename} className="w-full h-full object-cover" />
              <button
                onClick={() => onDelete(img)}
                className="absolute top-1 right-1 w-5 h-5 bg-black/70 rounded-full text-xs text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
              >
                x
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition text-sm ${
          dragOver ? 'border-[var(--accent)] bg-white/5' : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--text-muted)]'
        }`}
      >
        {uploading ? 'Uploading...' : 'Drop images or click to browse'}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={e => e.target.files && handleFiles(e.target.files)}
        />
      </div>
    </div>
  )
}
