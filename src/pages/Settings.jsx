import React, { useState, useEffect, useRef } from 'react'
import BottomNav from '../components/BottomNav'
import AppBar from '../components/AppBar'
import useProfile from '../hooks/useProfile'
import { supabase } from '../lib/supabaseClient'
import NotificationsSwitch from '../components/profile/NotificationsSwitch'

export default function Settings(){
  const { profile, loading, error, updateField } = useProfile()
  // use `null` as initial sentinel so UI doesn't flash a default value
  // while `profile` is being loaded. We derive the shown value from
  // `profile` when available and only initialize local state once.
  const [notifications, setNotifications] = useState(() => (null))
  const [isPublic, setIsPublic] = useState(() => (null))
  const [preferredDuration, setPreferredDuration] = useState(() => null)
  const [preferredCategories, setPreferredCategories] = useState(() => null)
  const [availableCategories, setAvailableCategories] = useState([])
  const [selectedCategories, setSelectedCategories] = useState([])
  const [status, setStatus] = useState('')
  const [durationOpen, setDurationOpen] = useState(false)
  const durationRef = useRef(null)
  const durationOptions = [5,10,15,20,25,30,35,40,45,60]

  // close duration dropdown on outside click
  useEffect(()=>{
    function onDocClick(e){
      const el = durationRef.current
      if(!el) return
      if(!el.contains(e.target)) setDurationOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return ()=> document.removeEventListener('mousedown', onDocClick)
  }, [])

  // Read cached profile synchronously to avoid UI flash while `useProfile`
  // initializes (its effect runs after first render). This cache is the
  // same key used by `useProfile`.
  let cachedProfile = null
  try{
    const raw = sessionStorage.getItem('wellgym_profile_cache_v1')
    if(raw) cachedProfile = JSON.parse(raw)
  }catch(e){ cachedProfile = null }

  const prefsLoadedRef = useRef(false)

  function getFinalLevel(){
    try{
      const raw = sessionStorage.getItem('wellgym_profile_cache_v1')
      if(raw){ const c = JSON.parse(raw); if(c?.level) return c.level }
    }catch(e){}
    if(profile?.level) return profile.level
    return 'Neofita'
  }

  function parsePreferredByLevel(raw){
    if(!raw) return {}
    try{
      const parsed = JSON.parse(raw)
      if(parsed && typeof parsed === 'object') return parsed
    }catch(e){ /* not JSON */ }
    return { [getFinalLevel()]: (raw || '') }
  }

  useEffect(()=>{
    if(!profile) return
    // Initialize local state only if it's not been set yet (null).
    if(notifications === null && typeof profile.notifications === 'boolean'){
      setNotifications(Boolean(profile.notifications))
    }
    if(isPublic === null && typeof profile.is_public === 'boolean'){
      setIsPublic(Boolean(profile.is_public))
    }
    if(preferredDuration === null){
      setPreferredDuration(profile.preferred_duration ?? 30)
    }
    if(preferredCategories === null){
      setPreferredCategories(profile.preferred_categories || '')
    }
    // initialize selectedCategories from per-level value if not set
    if(selectedCategories.length === 0){
      const raw = profile?.preferred_categories ?? cachedProfile?.preferred_categories ?? ''
      const byLevel = parsePreferredByLevel(raw)
      const lvl = getFinalLevel()
      const initial = byLevel[lvl] || ''
      const parts = (initial || '').split(',').map(s=>s.trim()).filter(Boolean)
      if(parts.length) setSelectedCategories(parts)
    }
    // mark initial prefs as loaded so autosave can start
    if(!prefsLoadedRef.current) prefsLoadedRef.current = true
  }, [profile, notifications, isPublic, preferredDuration, preferredCategories])

  // fetch available categories from exercises table (distinct client-side)
  // filtered by the user's current level so Settings shows level-specific categories
  useEffect(()=>{
    let mounted = true
    async function loadCats(){
      try{
        const lvl = getFinalLevel()
        const { data } = await supabase.from('exercises').select('category').eq('level', lvl)
        if(!mounted) return
        const cats = Array.from(new Set((data || []).map(r=>r.category).filter(Boolean)))
        setAvailableCategories(cats)
      }catch(e){ console.error('Error loading categories', e) }
    }
    loadCats()
    return ()=>{ mounted = false }
  }, [profile])

  async function onToggleNotifications(val){
    setNotifications(val)
    setStatus('Salvando...')
    try{ await updateField('notifications', val); setStatus('Salvato') }catch(e){ setStatus('Errore') }
    setTimeout(()=>setStatus(''), 1500)
  }

  async function onTogglePublic(val){
    setIsPublic(val)
    setStatus('Salvando...')
    try{ await updateField('is_public', val); setStatus('Salvato') }catch(e){ setStatus('Errore') }
    setTimeout(()=>setStatus(''), 1500)
  }

  // Auto-save preferredDuration when user changes it (debounced)
  useEffect(()=>{
    if(preferredDuration === null) return
    if(!prefsLoadedRef.current) return
    const t = setTimeout(async ()=>{
      setStatus('Salvando...')
      try{ await updateField('preferred_duration', Number(preferredDuration) || 30); setStatus('Salvato') }catch(e){ setStatus('Errore') }
      setTimeout(()=>setStatus(''), 1500)
    }, 700)
    return ()=> clearTimeout(t)
  }, [preferredDuration])

  // Auto-save selectedCategories when changed (debounced) and save per-level
  useEffect(()=>{
    if(!prefsLoadedRef.current) return
    const t = setTimeout(async ()=>{
      setStatus('Salvando...')
      try{
        const lvl = getFinalLevel()
        const raw = profile?.preferred_categories ?? cachedProfile?.preferred_categories ?? ''
        const byLevel = parsePreferredByLevel(raw)
        const cats = (selectedCategories && selectedCategories.length) ? selectedCategories.join(', ') : ''
        byLevel[lvl] = cats
        await updateField('preferred_categories', JSON.stringify(byLevel))
        setStatus('Salvato')
      }catch(e){ setStatus('Errore') }
      setTimeout(()=>setStatus(''), 1500)
    }, 700)
    return ()=> clearTimeout(t)
  }, [selectedCategories])

  // preferences autosave handled by effects; explicit save button removed

  return (
    <div className="p-0 flex-1 min-h-0">
      <AppBar title="Impostazioni" />
      <div className="p-4 pb-24 space-y-4">
        <h1 className="text-xl font-semibold">Impostazioni</h1>

        <NotificationsSwitch notificationsEnabled={notifications ?? profile?.notifications ?? cachedProfile?.notifications ?? false} onToggle={onToggleNotifications} />

        <div className="bg-white p-4 rounded shadow">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">Visibilità profilo</div>
              <div className="text-sm">Rendi il tuo profilo visibile agli altri utenti</div>
            </div>
            <div>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={Boolean(isPublic ?? profile?.is_public ?? cachedProfile?.is_public)} onChange={e=>onTogglePublic(Boolean(e.target.checked))} />
              </label>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded shadow space-y-2">
          <div className="text-sm text-gray-500">Preferenze allenamento</div>
          <div className="flex items-center gap-3 relative" ref={durationRef}>
            <label className="text-sm">Durata preferita (min)</label>
            <div>
              <button
                type="button"
                aria-haspopup="listbox"
                aria-expanded={durationOpen}
                onClick={()=>setDurationOpen(o=>!o)}
                onKeyDown={(e)=>{ if(e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setDurationOpen(true) } }}
                className="w-32 p-2 bg-white border rounded-md flex items-center justify-between text-sm shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <span>{preferredDuration ?? profile?.preferred_duration ?? cachedProfile?.preferred_duration ?? 30} min</span>
                <span className="material-symbols-outlined text-base">expand_more</span>
              </button>

              {durationOpen && (
                <ul role="listbox" tabIndex={-1} className="absolute z-50 mt-2 w-32 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 py-1" onKeyDown={(e)=>{ if(e.key === 'Escape') setDurationOpen(false) }}>
                  {durationOptions.map(opt => (
                    <li key={opt} role="option" aria-selected={(preferredDuration ?? profile?.preferred_duration) === opt} className={`px-3 py-2 cursor-pointer text-sm hover:bg-gray-50 flex items-center justify-between ${((preferredDuration ?? profile?.preferred_duration) === opt) ? 'font-medium bg-gray-50' : ''}`} onClick={()=>{ setPreferredDuration(opt); setDurationOpen(false) }}>
                      <span>{opt} min</span>
                      {(preferredDuration ?? profile?.preferred_duration) === opt && <span className="material-symbols-outlined text-primary">check</span>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <div>
            <label className="text-sm">Categorie preferite</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {availableCategories.map(cat => {
                const active = selectedCategories.includes(cat)
                return (
                  <button key={cat} type="button" onClick={()=>{
                    setSelectedCategories(prev => prev.includes(cat) ? prev.filter(x=>x!==cat) : [...prev, cat])
                  }} className={`px-3 py-1 rounded-full text-sm border ${active ? 'bg-primary text-white border-primary' : 'bg-white text-gray-700 border-gray-200'}`}>
                    {cat}
                  </button>
                )
              })}
            </div>

            <div className="text-sm mt-2 text-gray-600">Seleziona le categorie che preferisci; verranno salvate automaticamente e applicate al workout.</div>

            <div className="mt-3">
              <div className="text-sm text-gray-500">Categorie salvate</div>
                <div className="mt-1 text-sm text-gray-700">{(selectedCategories && selectedCategories.length) ? selectedCategories.join(', ') : (()=>{
                  // display per-level saved categories when available
                  try{
                    const raw = profile?.preferred_categories ?? cachedProfile?.preferred_categories ?? ''
                    const parsed = JSON.parse(raw)
                    if(parsed && typeof parsed === 'object'){
                      const lvl = getFinalLevel()
                      return (parsed[lvl] || '')
                    }
                  }catch(e){}
                  return (preferredCategories ?? profile?.preferred_categories ?? cachedProfile?.preferred_categories ?? '')
                })()}</div>
            </div>
          </div>
          <div className="pt-2">
            {status && <span className="ml-3 text-sm text-gray-600">{status}</span>}
          </div>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-gray-500">Account</div>
          <div className="mt-2 flex gap-3">
            <button className="px-4 py-2 bg-gray-100 rounded">Cambia password</button>
            <button className="px-4 py-2 bg-red-500 text-white rounded">Elimina account</button>
          </div>
        </div>

      </div>
      <BottomNav />
    </div>
  )
}
