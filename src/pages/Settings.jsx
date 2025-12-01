import React, { useState, useEffect } from 'react'
import BottomNav from '../components/BottomNav'
import AppBar from '../components/AppBar'
import useProfile from '../hooks/useProfile'
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
  const [status, setStatus] = useState('')

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
  }, [profile, notifications, isPublic, preferredDuration, preferredCategories])

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
      await updateField('preferred_categories', preferredCategories || '')
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
          <div className="flex items-center gap-3">
            <label className="text-sm">Durata preferita (min)</label>
            <input type="number" min={5} value={preferredDuration ?? profile?.preferred_duration ?? cachedProfile?.preferred_duration ?? 30} onChange={e=>setPreferredDuration(Number(e.target.value))} className="w-24 p-2 border rounded" />
          </div>
          <div>
            <label className="text-sm">Categorie preferite (separate da virgola)</label>
            <input value={preferredCategories ?? profile?.preferred_categories ?? cachedProfile?.preferred_categories ?? ''} onChange={e=>setPreferredCategories(e.target.value)} className="w-full p-2 border rounded" placeholder="es. Cardio, Forza" />
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
