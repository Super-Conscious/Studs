import type { Generation } from '../types'

interface Props {
  generations: Generation[]
  onToggleSave: (gen: Generation) => void
  onDelete: (gen: Generation) => void
}

export default function ResultsGrid({ generations, onToggleSave, onDelete }: Props) {
  if (generations.length === 0) return null

  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-4">Results</h3>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {generations.map(gen => (
          <div key={gen.id} className="group relative bg-[var(--surface)] border border-[var(--border)] rounded-lg overflow-hidden">
            <img src={gen.image_url} alt="Generated earring" className="w-full aspect-square object-contain bg-neutral-100" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-end justify-center opacity-0 group-hover:opacity-100">
              <div className="flex gap-2 p-3">
                <button
                  onClick={() => onToggleSave(gen)}
                  className={`px-3 py-1.5 rounded text-xs font-semibold transition ${gen.saved ? 'bg-amber-400 text-black' : 'bg-white/90 text-black'}`}
                >
                  {gen.saved ? 'Saved' : 'Save'}
                </button>
                <a
                  href={gen.image_url}
                  download
                  className="px-3 py-1.5 bg-white/90 text-black rounded text-xs font-semibold hover:bg-white transition"
                >
                  Download
                </a>
                <button
                  onClick={() => onDelete(gen)}
                  className="px-3 py-1.5 bg-red-500/80 text-white rounded text-xs font-semibold hover:bg-red-500 transition"
                >
                  Delete
                </button>
              </div>
            </div>
            <div className="px-3 py-2">
              <p className="text-xs text-[var(--text-muted)] truncate">{gen.prompt.substring(0, 80)}...</p>
              <p className="text-xs text-[var(--text-muted)] opacity-50 mt-1">{new Date(gen.created_at).toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
