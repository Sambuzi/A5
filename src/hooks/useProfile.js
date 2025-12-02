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
          .select('full_name, avatar_url, level, goal, notifications, bio, preferred_duration, preferred_categories, is_public, weight, weight_units, protein_goal, carbs_goal, fats_goal, water_goal')
          .eq('id', user.id)
          .single()

        // read cached profile to avoid overwriting with empty/NULL server values
        let cached = null
        try{
          const raw = sessionStorage.getItem(PROFILE_CACHE_KEY)
          if(raw) cached = JSON.parse(raw)
        }catch(e){ cached = null }

        const p = {
          id: user.id,
          email: user.email,
          name: profileRow?.full_name ?? cached?.name ?? user.email,
          avatar_url: profileRow?.avatar_url ?? cached?.avatar_url ?? null,
          level: (profileRow && profileRow.level != null && profileRow.level !== '') ? profileRow.level : (cached?.level ?? 'Neofita'),
          goal: profileRow?.goal ?? cached?.goal ?? '30 min/die',
          notifications: (profileRow && typeof profileRow.notifications === 'boolean') ? profileRow.notifications : (cached?.notifications ?? true),
          bio: profileRow?.bio ?? cached?.bio ?? '',
          preferred_duration: profileRow?.preferred_duration ?? cached?.preferred_duration ?? 30,
          preferred_categories: profileRow?.preferred_categories ?? cached?.preferred_categories ?? '',
          is_public: profileRow?.is_public ?? cached?.is_public ?? true,
          weight: profileRow?.weight ?? cached?.weight ?? 70,
          weight_units: profileRow?.weight_units ?? cached?.weight_units ?? 'kg',
          protein_goal: profileRow?.protein_goal ?? cached?.protein_goal ?? null,
          carbs_goal: profileRow?.carbs_goal ?? cached?.carbs_goal ?? null,
          fats_goal: profileRow?.fats_goal ?? cached?.fats_goal ?? null,
          water_goal: profileRow?.water_goal ?? cached?.water_goal ?? null,
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
      if(!user){
        navigate('/login')
        throw new Error('Not authenticated')
      }
      console.debug('[useProfile] updateField start', field, value)
      const payload = { id: user.id }
      payload[field] = value
      const res = await supabase.from('profiles').upsert(payload)
      if(res.error){
        console.error('[useProfile] updateField upsert error', res.error)
        throw res.error
      }

      // update in-hook profile state
      setProfile(prev => ({ ...(prev || {}), [field]: value }))

      // update session cache and mark loaded
      try{
        const cachedRaw = sessionStorage.getItem(PROFILE_CACHE_KEY)
        const cached = cachedRaw ? JSON.parse(cachedRaw) : {}
        const updated = { ...(cached || {}), [field]: value }
        sessionStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(updated))
        sessionStorage.setItem(PROFILE_LOADED_KEY, '1')
        console.debug('[useProfile] updateField cache updated', updated)
      }catch(e){ console.warn('[useProfile] failed to update cache', e) }

      return { ...(profile || {}), [field]: value }
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
      console.debug('[useProfile] saveProfile upsert payload', payload)
      const res = await supabase.from('profiles').upsert(payload)
      if(res.error){ console.error('[useProfile] saveProfile upsert error', res.error); throw res.error }

      // merge and persist
      const merged = { ...(profile || {}), ...payload }
      setProfile(merged)
      try{ sessionStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(merged)); sessionStorage.setItem(PROFILE_LOADED_KEY, '1') }catch(e){ console.warn('[useProfile] cache write failed', e) }
      console.debug('[useProfile] saveProfile success', merged)
      return merged
    }catch(e){
      console.error('useProfile saveProfile error', e)
      setError(e.message || String(e))
      throw e
    }
  }

  return { profile, loading, error, updateField, saveProfile }
}
