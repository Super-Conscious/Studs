import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useProjects } from '../hooks/useProjects'
import { useApiKey } from '../hooks/useApiKey'

export default function ProjectsPage() {
  const { user, signOut } = useAuth()
  const { projects, loading, loadProjects, createProject, deleteProject, renameProject } = useProjects(user)
  const { apiKey } = useApiKey()
  const navigate = useNavigate()
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  useEffect(() => { document.title = 'Studs — Projects'; loadProjects() }, [loadProjects])

  const handleCreate = async () => {
    if (!newName.trim()) return
    setCreating(true)
    const p = await createProject(newName.trim())
    if (p) navigate(`/project/${p.id}`)
    setCreating(false)
    setNewName('')
  }

  const handleRename = async (id: string) => {
    if (!editName.trim()) { setEditingId(null); return }
    await renameProject(id, editName.trim())
    setEditingId(null)
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-[var(--border)] px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-black tracking-tight uppercase">Studs</h1>
        <div className="flex items-center gap-4">
          {!apiKey && (
            <span className="text-xs text-amber-700 bg-amber-100 px-3 py-1 font-medium">
              API key not set
            </span>
          )}
          <button onClick={() => navigate('/settings')} className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition">
            Settings
          </button>
          <button onClick={signOut} className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition">
            Sign Out
          </button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-bold mb-8">Projects</h2>

        <div className="flex gap-3 mb-8">
          <input
            type="text"
            placeholder="New project name..."
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            className="flex-1 px-5 py-3 bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--text)] text-sm transition"
          />
          <button
            onClick={handleCreate}
            disabled={creating || !newName.trim()}
            className="px-8 py-3 bg-[var(--accent)] text-[var(--accent-text)] font-bold hover:bg-[var(--accent-hover)] transition disabled:opacity-50 text-sm uppercase tracking-wider"
          >
            {creating ? '...' : 'Create'}
          </button>
        </div>

        {loading ? (
          <p className="text-[var(--text-muted)] text-sm">Loading...</p>
        ) : projects.length === 0 ? (
          <div className="text-center py-20 text-[var(--text-muted)]">
            <p className="text-lg mb-2">No projects yet</p>
            <p className="text-sm">Create a project to start generating earring mockups.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {projects.map(p => (
              <div
                key={p.id}
                className="flex items-center justify-between bg-[var(--surface)] border border-[var(--border)] px-6 py-5 cursor-pointer hover:border-[var(--text)] transition group"
                onClick={() => editingId !== p.id && navigate(`/project/${p.id}`)}
              >
                <div className="flex-1 min-w-0">
                  {editingId === p.id ? (
                    <input
                      autoFocus
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleRename(p.id); if (e.key === 'Escape') setEditingId(null) }}
                      onBlur={() => handleRename(p.id)}
                      onClick={e => e.stopPropagation()}
                      className="font-semibold bg-white border border-[var(--border)] px-2 py-1 text-sm outline-none focus:border-[var(--text)] w-full"
                    />
                  ) : (
                    <>
                      <div className="font-semibold">{p.name}</div>
                      <div className="text-xs text-[var(--text-muted)] mt-1">{new Date(p.created_at).toLocaleDateString()}</div>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition shrink-0 ml-4">
                  <button
                    onClick={e => { e.stopPropagation(); setEditingId(p.id); setEditName(p.name) }}
                    className="text-sm text-[var(--text-muted)] hover:text-[var(--text)]"
                  >
                    Rename
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); if (confirm(`Delete "${p.name}"?`)) deleteProject(p.id) }}
                    className="text-sm text-[var(--text-muted)] hover:text-red-500"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
