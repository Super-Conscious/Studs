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
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          Saved Assets ({generations.length})
        </h3>
        <button
          onClick={handleDownloadAll}
          className="px-4 py-2 bg-[var(--accent)] text-[var(--bg)] font-semibold rounded-lg text-sm hover:opacity-90 transition"
        >
          Download All
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {generations.map(gen => (
          <div key={gen.id} className="group relative bg-[var(--surface)] border border-[var(--border)] rounded-lg overflow-hidden">
            <img src={gen.image_url} alt="Saved earring" className="w-full aspect-square object-contain bg-neutral-100" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-end justify-center opacity-0 group-hover:opacity-100">
              <div className="flex gap-2 p-3">
                <a
                  href={gen.image_url}
                  download
                  className="px-3 py-1.5 bg-white/90 text-black rounded text-xs font-semibold hover:bg-white transition"
                >
                  Download
                </a>
                <button
                  onClick={() => onToggleSave(gen)}
                  className="px-3 py-1.5 bg-amber-400/80 text-black rounded text-xs font-semibold hover:bg-amber-400 transition"
                >
                  Unsave
                </button>
                <button
                  onClick={() => onDelete(gen)}
                  className="px-3 py-1.5 bg-red-500/80 text-white rounded text-xs font-semibold hover:bg-red-500 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
