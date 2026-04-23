import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

// Single shared Gemini API key for the Studs workspace. Stored in a
// one-row app_settings table (id = 1) with RLS allowing any authenticated
// user to read and update. Internal tool — trusted team, no per-user split.
const SETTINGS_ROW_ID = 1

export function useApiKey() {
  const [apiKey, setApiKey] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    supabase
      .from('app_settings')
      .select('gemini_api_key')
      .eq('id', SETTINGS_ROW_ID)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return
        if (data?.gemini_api_key) setApiKey(data.gemini_api_key)
        setLoaded(true)
      })
    return () => { cancelled = true }
  }, [])

  const saveApiKey = useCallback(async (key: string) => {
    setSaving(true)
    const { error } = await supabase
      .from('app_settings')
      .upsert({ id: SETTINGS_ROW_ID, gemini_api_key: key, updated_at: new Date().toISOString() })
    if (!error) setApiKey(key)
    setSaving(false)
    return error
  }, [])

  return { apiKey, setApiKey, saveApiKey, saving, loaded }
}
