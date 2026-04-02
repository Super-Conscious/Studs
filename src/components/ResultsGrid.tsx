import type { Generation } from '../types'

interface Props {
  generations: Generation[]
  generating?: boolean
  onToggleSave: (gen: Generation) => void
  onDelete: (gen: Generation) => void
}

export default function ResultsGrid({ generations, generating, onToggleSave, onDelete }: Props) {
  if (generations.length === 0 && !generating) return null

  return (
    <div>
      <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)] mb-4">Results</h3>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {generating && (
          <div className="bg-[var(--surface)] border border-[var(--border)] overflow-hidden">
            <div className="w-full aspect-square bg-[var(--surface2)] flex items-center justify-center">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs text-[var(--text-muted)]">Generating...</p>
              </div>
            </div>
          </div>
        )}
        {generations.map(gen => (
          <div key={gen.id} className="bg-[var(--surface)] border border-[var(--border)] overflow-hidden">
            <img src={gen.image_url} alt="Generated earring" className="w-full aspect-square object-contain bg-neutral-50" />
            <div className="px-3 py-3 space-y-2">
              <p className="text-[11px] text-[var(--text-muted)] truncate">{gen.prompt.substring(0, 80)}...</p>
              <div className="flex gap-2">
                <button
                  onClick={() => onToggleSave(gen)}
                  className={`px-3 py-1.5 text-xs font-medium transition ${gen.saved ? 'bg-[var(--accent)] text-[var(--accent-text)]' : 'bg-[var(--surface2)] text-[var(--text)] hover:bg-[var(--border)]'}`}
                >
                  {gen.saved ? 'Saved' : 'Save'}
                </button>
                <a
                  href={gen.image_url}
                  download
                  className="px-3 py-1.5 bg-[var(--surface2)] text-[var(--text)] text-xs font-medium hover:bg-[var(--border)] transition"
                >
                  Download
                </a>
                <button
                  onClick={() => { if (confirm('Delete this image?')) onDelete(gen) }}
                  className="px-3 py-1.5 text-xs text-[var(--text-muted)] hover:text-red-600 transition ml-auto"
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
