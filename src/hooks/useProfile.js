import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useNavigate } from 'react-router-dom'

const PROFILE_LOADED_KEY = 'wellgym_profile_loaded_v1'
const PROFILE_CACHE_KEY = 'wellgym_profile_cache_v1'

export default function useProfile(){
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(()=>{
    let mounted = true

    // try to read cached profile and render immediately
    try{
      const raw = sessionStorage.getItem(PROFILE_CACHE_KEY)
      if(raw){
        const cached = JSON.parse(raw)
        if(mounted){ setProfile(cached); setLoading(false) }
      }
    }catch(e){ /* ignore */ }

    async function load(){
      setLoading(true)
      try{
        const { data: userData, error: userErr } = await supabase.auth.getUser()
        if(userErr) throw userErr
        const user = userData?.user
        if(!user){ navigate('/login'); return }

        const { data: profileRow } = await supabase
          .from('profiles')
          .select('full_name, avatar_url, level, goal, notifications, bio, preferred_duration, preferred_categories, is_public')
          .eq('id', user.id)
          .single()

        const p = {
          id: user.id,
          email: user.email,
          name: profileRow?.full_name || user.email,
          avatar_url: profileRow?.avatar_url || null,
          level: profileRow?.level || 'Neofita',
          goal: profileRow?.goal || '30 min/die',
          notifications: profileRow?.notifications ?? true,
          bio: profileRow?.bio || '',
          preferred_duration: profileRow?.preferred_duration ?? 30,
          preferred_categories: profileRow?.preferred_categories || '',
          is_public: profileRow?.is_public ?? true,
          joined: user.created_at
        }

        if(mounted){
          setProfile(p)
          try{ sessionStorage.setItem(PROFILE_LOADED_KEY, '1'); sessionStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(p)) }catch(e){}
        }
      }catch(e){
        console.error('useProfile load error', e)
        if(mounted) setError(e.message || String(e))
      }finally{ if(mounted) setLoading(false) }
    }

    load()
    return ()=>{ mounted = false }
  }, [navigate])

  async function updateField(field, value){
    setError(null)
    try{
      const { data: userData, error: userErr } = await supabase.auth.getUser()
      if(userErr) throw userErr
      const user = userData?.user
      if(!user){ navigate('/login'); return }

      const payload = { id: user.id }
      payload[field] = value
      const { error } = await supabase.from('profiles').upsert(payload)
      if(error) throw error

      setProfile(prev => ({ ...(prev || {}), [field]: value }))
      try{
        const cachedRaw = sessionStorage.getItem(PROFILE_CACHE_KEY)
        const cached = cachedRaw ? JSON.parse(cachedRaw) : {}
        const updated = { ...(cached || {}), [field]: value }
        sessionStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(updated))
      }catch(e){ /* ignore */ }
    }catch(e){
      console.error('useProfile updateField error', e)
      setError(e.message || String(e))
      throw e
    }
  }

  async function saveProfile(payload){
    setError(null)
    try{
      const { data: userData, error: userErr } = await supabase.auth.getUser()
      if(userErr) throw userErr
      const user = userData?.user
      if(!user){ navigate('/login'); return }

      payload.id = user.id
      const { error } = await supabase.from('profiles').upsert(payload)
      if(error) throw error

      // merge and persist
      const merged = { ...(profile || {}), ...payload }
      setProfile(merged)
      try{ sessionStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(merged)) }catch(e){}
      return merged
    }catch(e){
      console.error('useProfile saveProfile error', e)
      setError(e.message || String(e))
      throw e
    }
  }

  return { profile, loading, error, updateField, saveProfile }
}
