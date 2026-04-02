import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'

export interface Project {
  id: string
  name: string
  created_at: string
  user_id: string
}

export function useProjects(user: User | null) {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)

  const loadProjects = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setProjects(data || [])
    setLoading(false)
  }, [user])

  const createProject = useCallback(async (name: string) => {
    if (!user) return null
    const { data, error } = await supabase
      .from('projects')
      .insert({ name, user_id: user.id })
      .select()
      .single()
    if (error) return null
    setProjects(prev => [data, ...prev])
    return data as Project
  }, [user])

  const deleteProject = useCallback(async (id: string) => {
    await supabase.from('projects').delete().eq('id', id)
    setProjects(prev => prev.filter(p => p.id !== id))
  }, [])

  const renameProject = useCallback(async (id: string, name: string) => {
    await supabase.from('projects').update({ name }).eq('id', id)
    setProjects(prev => prev.map(p => p.id === id ? { ...p, name } : p))
  }, [])

  return { projects, loading, loadProjects, createProject, deleteProject, renameProject }
}
