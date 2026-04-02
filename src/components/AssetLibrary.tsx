import type { Generation } from '../types'

interface Props {
  generations: Generation[]
  onToggleSave: (gen: Generation) => void
  onDelete: (gen: Generation) => void
}

export default function AssetLibrary({ generations, onToggleSave, onDelete }: Props) {
  const handleDownloadAll = () => {
    generations.forEach(gen => {
      const a = document.createElement('a')
      a.href = gen.image_url
      a.download = `studs-${gen.id}.png`
      a.click()
    })
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
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
          Saved Assets ({generations.length})
        </h3>
        <button onClick={handleDownloadAll} className="px-5 py-2 bg-[var(--accent)] text-[var(--accent-text)] font-bold rounded-full text-sm hover:bg-[var(--accent-hover)] transition uppercase tracking-wider">
          Download All
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {generations.map(gen => (
          <div key={gen.id} className="group relative bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden">
            <img src={gen.image_url} alt="Saved earring" className="w-full aspect-square object-contain bg-neutral-50" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-end justify-center opacity-0 group-hover:opacity-100">
              <div className="flex gap-2 p-3">
                <a href={gen.image_url} download className="px-3 py-1.5 bg-white text-black rounded-full text-xs font-bold hover:bg-neutral-100 transition">Download</a>
                <button onClick={() => onToggleSave(gen)} className="px-3 py-1.5 bg-[var(--accent)] text-[var(--accent-text)] rounded-full text-xs font-bold transition">Unsave</button>
                <button onClick={() => onDelete(gen)} className="px-3 py-1.5 bg-red-500 text-white rounded-full text-xs font-bold hover:bg-red-600 transition">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
