import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useApiKey } from '../hooks/useApiKey'
import { supabase } from '../lib/supabase'
import UploadPanel from '../components/UploadPanel'
import PromptBuilder from '../components/PromptBuilder'
import ResultsGrid from '../components/ResultsGrid'
import AssetLibrary from '../components/AssetLibrary'
import type { Upload, Generation } from '../types'

export default function WorkspacePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { apiKey } = useApiKey(user)

  const [projectName, setProjectName] = useState('')
  const [uploads, setUploads] = useState<Upload[]>([])
  const [generations, setGenerations] = useState<Generation[]>([])
  const [activeTab, setActiveTab] = useState<'generate' | 'library'>('generate')
  const [generating, setGenerating] = useState(false)

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
    const { error } = await supabase.storage.from('uploads').remove([upload.storage_path])
    if (error) console.error('Storage delete error:', error)
    const { error: dbErr } = await supabase.from('uploads').delete().eq('id', upload.id)
    if (dbErr) console.error('DB delete error:', dbErr)
    setUploads(prev => prev.filter(u => u.id !== upload.id))
  }

  const handleGenerated = (gen: Generation) => {
    setGenerations(prev => [gen, ...prev])
    setGenerating(false)
  }

  const handleToggleSave = async (gen: Generation) => {
    const saved = !gen.saved
    const { error } = await supabase.from('generations').update({ saved }).eq('id', gen.id)
    if (error) console.error('Toggle save error:', error)
    setGenerations(prev => prev.map(g => g.id === gen.id ? { ...g, saved } : g))
  }

  const handleDeleteGeneration = async (gen: Generation) => {
    const { error } = await supabase.from('generations').delete().eq('id', gen.id)
    if (error) console.error('Delete generation error:', error)
    setGenerations(prev => prev.filter(g => g.id !== gen.id))
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="border-b border-[var(--border)] px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition">
            &larr;
          </button>
          <span className="text-[var(--border)]">/</span>
          <h1 className="font-bold">{projectName}</h1>
        </div>
        <div className="flex items-center gap-1 bg-[var(--surface)] p-1">
          <button
            onClick={() => setActiveTab('generate')}
            className={`px-5 py-1.5 text-sm font-semibold transition ${activeTab === 'generate' ? 'bg-white text-[var(--text)] shadow-sm' : 'text-[var(--text-muted)]'}`}
          >
            Generate
          </button>
          <button
            onClick={() => setActiveTab('library')}
            className={`px-5 py-1.5 text-sm font-semibold transition ${activeTab === 'library' ? 'bg-white text-[var(--text)] shadow-sm' : 'text-[var(--text-muted)]'}`}
          >
            Library {generations.filter(g => g.saved).length > 0 && <span className="ml-1 text-xs opacity-50">({generations.filter(g => g.saved).length})</span>}
          </button>
        </div>
      </header>

      {activeTab === 'generate' ? (
        <div className="flex flex-1 overflow-hidden flex-col lg:flex-row">
          <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-[var(--border)] overflow-y-auto p-5 space-y-6 shrink-0 bg-[var(--surface)]">
            <UploadPanel title="Content Images" hint="Photos of the earring to recreate" type="content" projectId={id!} images={contentImages} onUpload={handleUploadComplete} onDelete={handleDeleteUpload} />
            <UploadPanel title="Reference Images" hint="Style & composition targets" type="reference" projectId={id!} images={referenceImages} onUpload={handleUploadComplete} onDelete={handleDeleteUpload} />
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
