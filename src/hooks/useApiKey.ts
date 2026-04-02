import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'

const META_KEY = 'gemini_api_key'

export function useApiKey(user: User | null) {
  const [apiKey, setApiKey] = useState<string>('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user?.user_metadata?.[META_KEY]) {
      setApiKey(user.user_metadata[META_KEY])
    }
  }, [user])

  const saveApiKey = useCallback(async (key: string) => {
    setSaving(true)
    const { error } = await supabase.auth.updateUser({
      data: { [META_KEY]: key }
    })
    if (!error) setApiKey(key)
    setSaving(false)
    return error
  }, [])

  return { apiKey, setApiKey, saveApiKey, saving }
}
