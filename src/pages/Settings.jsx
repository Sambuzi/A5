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
  const [customCategory, setCustomCategory] = useState('')
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
    // initialize selectedCategories from string value if not set
    if(selectedCategories.length === 0){
      const initial = (profile.preferred_categories || cachedProfile?.preferred_categories || '')
      const parts = initial.split(',').map(s=>s.trim()).filter(Boolean)
      if(parts.length) setSelectedCategories(parts)
    }
  }, [profile, notifications, isPublic, preferredDuration, preferredCategories])

  // fetch available categories from exercises table (distinct client-side)
  useEffect(()=>{
    let mounted = true
    async function loadCats(){
      try{
        const { data } = await supabase.from('exercises').select('category')
        if(!mounted) return
        const cats = Array.from(new Set((data || []).map(r=>r.category).filter(Boolean)))
        setAvailableCategories(cats)
      }catch(e){ console.error('Error loading categories', e) }
    }
    loadCats()
    return ()=>{ mounted = false }
  }, [])

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

  async function savePreferences(){
    setStatus('Salvando...')
    try{
      await updateField('preferred_duration', Number(preferredDuration) || 30)
      // prefer selectedCategories if provided, otherwise fall back to text input
      const cats = (selectedCategories && selectedCategories.length) ? selectedCategories.join(', ') : (preferredCategories || '')
      await updateField('preferred_categories', cats)
      setStatus('Salvato')
    }catch(e){ setStatus('Errore') }
    setTimeout(()=>setStatus(''), 1500)
  }

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

            <div className="mt-3 flex gap-2 items-center">
              <input value={customCategory} onChange={e=>setCustomCategory(e.target.value)} className="flex-1 p-2 border rounded" placeholder="Aggiungi categoria personalizzata" />
              <button className="px-3 py-2 bg-primary text-white rounded" onClick={()=>{
                const v = (customCategory || '').trim()
                if(!v) return
                setSelectedCategories(prev => prev.includes(v) ? prev : [...prev, v])
                setCustomCategory('')
              }}>Aggiungi</button>
            </div>

            <div className="text-sm mt-2 text-gray-600">Seleziona le categorie che preferisci; salva per applicarle al workout.</div>

            <div className="mt-3">
              <div className="text-sm text-gray-500">Categorie salvate</div>
              <div className="mt-1 text-sm text-gray-700">{(selectedCategories && selectedCategories.length) ? selectedCategories.join(', ') : (preferredCategories ?? profile?.preferred_categories ?? cachedProfile?.preferred_categories ?? '')}</div>
            </div>
          </div>
          <div className="pt-2">
            <button className="px-4 py-2 bg-primary text-white rounded" onClick={savePreferences}>Salva preferenze</button>
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
