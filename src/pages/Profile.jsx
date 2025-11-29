import React, {useState, useEffect, useRef} from 'react'
import { supabase } from '../lib/supabaseClient'
import BottomNav from '../components/BottomNav'
import AppBar from '../components/AppBar'
import { useNavigate } from 'react-router-dom'

export default function Profile(){
  const PROFILE_LOADED_KEY = 'wellgym_profile_loaded_v1'
  const PROFILE_CACHE_KEY = 'wellgym_profile_cache_v1'

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(()=>{
    try{
      return !sessionStorage.getItem(PROFILE_LOADED_KEY)
    }catch(e){
      return true
    }
  })
  const [error, setError] = useState(null)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingField, setEditingField] = useState(null)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [avatarFile, setAvatarFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [nameEdit, setNameEdit] = useState('')
  const [levelEdit, setLevelEdit] = useState('Neofita')
  const [goalEdit, setGoalEdit] = useState('30 min/die')
  const fileInputRef = useRef(null)
  const levelPopRef = useRef(null)
  const navigate = useNavigate()

  useEffect(()=>{
    let mounted = true

    // try to read cached profile and render immediately to avoid loading flash
    try{
      const raw = sessionStorage.getItem(PROFILE_CACHE_KEY)
      if(raw){
        const cached = JSON.parse(raw)
        if(mounted){
          setProfile(cached)
          setNameEdit(cached.name)
          setLevelEdit(cached.level)
          setGoalEdit(cached.goal)
          setNotificationsEnabled(cached.notifications ?? true)
          // don't show global loading when we have cached data
          setLoading(false)
        }
      }
    }catch(e){/* ignore cache errors */}
    async function load(){
      // Show loading banner only on first load in this session
      const alreadyLoaded = typeof sessionStorage !== 'undefined' && sessionStorage.getItem(PROFILE_LOADED_KEY)
      if(!alreadyLoaded) setLoading(true)
      try{
        const { data: userData, error: userErr } = await supabase.auth.getUser()
        if(userErr) throw userErr

        const user = userData?.user
        if(!user) {
          // no session, redirect to login
          navigate('/login')
          return
        }

        const { data: profileRow } = await supabase
          .from('profiles')
          .select('full_name, avatar_url, level, goal')
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
          joined: user.created_at
        }

        if(mounted) {
          setProfile(p)
          setNameEdit(p.name)
          setLevelEdit(p.level)
          setGoalEdit(p.goal)
          setNotificationsEnabled(p.notifications)
          try{ sessionStorage.setItem(PROFILE_LOADED_KEY, '1'); sessionStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(p)) }catch(e){}
        }
      }catch(e){
        console.error('Profile load error', e)
        if(mounted) setError(e.message || String(e))
      }finally{
        if(mounted) setLoading(false)
      }
    }
    load()
    return ()=> { mounted = false }
  }, [navigate])

  useEffect(()=>{
    return ()=>{ if(previewUrl) URL.revokeObjectURL(previewUrl) }
  }, [previewUrl])

  // click-outside handler to close level popover
  useEffect(()=>{
    if(editingField !== 'level') return
    function onDocClick(e){
      const el = levelPopRef.current
      if(!el) return
      if(!el.contains(e.target)){
        setEditingField(null)
        setLevelEdit(profile?.level ?? levelEdit)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return ()=> document.removeEventListener('mousedown', onDocClick)
  }, [editingField, profile, levelEdit])

  function onAvatarClick(){
    if(fileInputRef.current) fileInputRef.current.click()
  }

  function onFileChange(e){
    const f = e.target.files?.[0]
    if(!f) return
    setAvatarFile(f)
    const url = URL.createObjectURL(f)
    setPreviewUrl(url)
  }

  async function uploadAvatar(userId){
    if(!avatarFile) return null
    const fileExt = avatarFile.name.split('.').pop()
    const filePath = `${userId}/${Date.now()}.${fileExt}`

    const { error } = await supabase.storage.from('avatars').upload(filePath, avatarFile, { upsert: true })
    if(error) throw error

    const { publicURL } = supabase.storage.from('avatars').getPublicUrl(filePath)
    return publicURL
  }

  async function onSave(){
    setSaving(true)
    try{
      const { data: userData, error: userErr } = await supabase.auth.getUser()
      if(userErr) throw userErr
      const user = userData?.user
      if(!user) { navigate('/login'); return }

      let uploadedUrl = null
      if(avatarFile){ uploadedUrl = await uploadAvatar(user.id) }

      const payload = {
        id: user.id,
        full_name: nameEdit,
        level: levelEdit,
        goal: goalEdit,
      }
      if(uploadedUrl) payload.avatar_url = uploadedUrl

      const { error } = await supabase.from('profiles').upsert(payload)
      if(error) throw error

      // update local profile (guard prev when null)
      setProfile(prev => ({ ...(prev || {}), name: nameEdit, level: levelEdit, goal: goalEdit, avatar_url: uploadedUrl || prev?.avatar_url || null }))
      setAvatarFile(null)
      if(previewUrl){ URL.revokeObjectURL(previewUrl); setPreviewUrl(null) }
      setEditing(false)
    }catch(e){
      console.error('Save error', e)
      setError(e.message || String(e))
    }finally{ setSaving(false) }
  }

  async function updateProfileField(field, value){
    setSaving(true)
    setError(null)
    try{
      const { data: userData, error: userErr } = await supabase.auth.getUser()
      if(userErr) throw userErr
      const user = userData?.user
      if(!user) { navigate('/login'); return }

      const payload = { id: user.id }
      payload[field] = value

      const { error } = await supabase.from('profiles').upsert(payload)
      if(error) throw error

      setProfile(prev => ({ ...(prev || {}), [field]: value }))
      setEditingField(null)
    }catch(e){
      console.error('Update field error', e)
      setError(e.message || String(e))
    }finally{ setSaving(false) }
  }

  async function logout(){
    await supabase.auth.signOut()
    navigate('/login')
  }

  const displayName = profile?.name ?? 'Utente'
  const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=EDE9FE&color=5B21B6&size=128`

  const isLoading = loading
  const hasError = Boolean(error)

  return (
    <div className="p-0 flex-1 min-h-0">
      <AppBar title="Profilo" />
      <div className="p-4">
      <h1 className="text-xl font-semibold mb-3">Profilo</h1>

      {isLoading && (
        <div className="p-3 mb-4 bg-yellow-50 text-yellow-800 rounded">Caricamento profilo…</div>
      )}
      {hasError && (
        <div className="p-3 mb-4 bg-red-50 text-red-700 rounded">Errore: {error}</div>
      )}

      <div className="md-card p-4 mb-4 flex flex-wrap items-center gap-4">
          <div className="relative">
          <div onClick={onAvatarClick} className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-2xl text-gray-700 overflow-hidden cursor-pointer">
            <img src={previewUrl || profile?.avatar_url || defaultAvatar} alt="avatar" className="w-full h-full object-cover" />
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
        </div>

        <div className="flex-1">
          {editing ? (
            <input value={nameEdit} onChange={e=>setNameEdit(e.target.value)} className="text-lg font-semibold w-full p-1 border-b" />
          ) : (
            <div className="text-lg font-semibold">{profile?.name ?? displayName}</div>
          )}

          <div className="text-sm text-gray-500 flex items-center gap-2"><span className="material-symbols-outlined text-sm">email</span>{profile?.email ?? ''}</div>
          <div className="text-sm text-gray-500 mt-1">Iscritto: {profile?.joined ? new Date(profile.joined).toLocaleDateString() : '-'}</div>
        </div>

        <div className="w-full sm:w-auto">
          {editing ? (
            <div className="flex flex-col sm:flex-row gap-2 items-end">
              <button onClick={onSave} disabled={saving} className="px-3 py-2 bg-primary text-white rounded-md">{saving ? 'Salvataggio...' : 'Salva'}</button>
              <button onClick={()=>{ setEditing(false); setNameEdit(profile?.name ?? nameEdit); setLevelEdit(profile?.level ?? levelEdit); setGoalEdit(profile?.goal ?? goalEdit); setAvatarFile(null); if(previewUrl){ URL.revokeObjectURL(previewUrl); setPreviewUrl(null) } }} className="px-3 py-2 bg-gray-100 rounded-md">Annulla</button>
            </div>
          ) : (
            <button onClick={()=>setEditing(true)} className="px-3 py-2 bg-gray-100 rounded-md flex items-center gap-2" disabled={isLoading}>
              <span className="material-symbols-outlined">edit</span>
              <span className="text-sm">Modifica</span>
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div role="button" onClick={()=>{ if(!editingField) { setEditingField('level'); setLevelEdit(profile?.level ?? levelEdit) } }} className="bg-white p-3 rounded-md flex items-center justify-between cursor-pointer">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined">fitness_center</span>
            <div>
              <div className="text-sm text-gray-500">Livello</div>
                  {editingField === 'level' ? (
                    <div className="relative" ref={levelPopRef}>
                      <div className="font-medium">{profile?.level ?? 'Neofita'}</div>

                      {/* Material3-style dropdown menu (anchored) */}
                      <div className="absolute left-0 mt-2 w-56 z-50">
                        <div className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden">
                          <div role="menu" aria-label="Seleziona livello" className="py-1">
                            {['Neofita','Intermedio','Avanzato'].map(l => (
                              <button
                                key={l}
                                role="menuitem"
                                onClick={(ev)=>{ ev.stopPropagation(); updateProfileField('level', l) }}
                                className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between hover:bg-gray-50 ${profile?.level === l ? 'bg-gray-50 font-medium' : ''}`}
                              >
                                <span>{l}</span>
                                {profile?.level === l && (
                                  <span className="material-symbols-outlined text-primary">check</span>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    ) : (
                    <div className="font-medium">{profile?.level ?? 'Neofita'}</div>
                  )}
            </div>
          </div>
          <div className="text-gray-400">{editingField === 'level' ? '' : '>'}</div>
        </div>

        <div role="button" onClick={()=>{ if(!editingField) { setEditingField('goal'); setGoalEdit(profile?.goal ?? goalEdit) } }} className="bg-white p-3 rounded-md flex items-center justify-between cursor-pointer">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined">schedule</span>
            <div>
              <div className="text-sm text-gray-500">Obiettivo giornaliero</div>
              {editingField === 'goal' ? (
                <div className="flex items-center gap-2">
                  <input value={goalEdit} onChange={e=>setGoalEdit(e.target.value)} className="font-medium" />
                  <button onClick={(ev)=>{ ev.stopPropagation(); updateProfileField('goal', goalEdit) }} className="px-2 py-1 bg-primary text-white rounded text-sm">Salva</button>
                  <button onClick={(ev)=>{ ev.stopPropagation(); setEditingField(null); setGoalEdit(profile?.goal ?? goalEdit) }} className="px-2 py-1 bg-gray-100 rounded text-sm">Annulla</button>
                </div>
              ) : (
                <div className="font-medium">{profile?.goal ?? '30 min/die'}</div>
              )}
            </div>
          </div>
          <div className="text-gray-400">{editingField === 'goal' ? '' : '>'}</div>
        </div>

        <div role="button" onClick={()=>{ if(!editingField) { setEditingField('notifications') } }} className="bg-white p-3 rounded-md flex items-center justify-between cursor-pointer">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined">notifications</span>
            <div>
              <div className="text-sm text-gray-500">Notifiche</div>
              {editingField === 'notifications' ? (
                <div className="flex items-center gap-3">
                  <div
                    className={`m3-switch ${notificationsEnabled ? 'on' : ''}`}
                    tabIndex={0}
                    role="switch"
                    aria-checked={notificationsEnabled}
                    onClick={(ev)=>{ ev.stopPropagation(); setNotificationsEnabled(v => !v); }}
                    onKeyDown={(ev)=>{ if(ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); setNotificationsEnabled(v => !v); } }}
                  >
                    <span className="thumb" aria-hidden="true"></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={(ev)=>{ ev.stopPropagation(); updateProfileField('notifications', notificationsEnabled) }} className="px-2 py-1 bg-primary text-white rounded text-sm">Salva</button>
                    <button onClick={(ev)=>{ ev.stopPropagation(); setEditingField(null); setNotificationsEnabled(profile?.notifications ?? notificationsEnabled) }} className="px-2 py-1 bg-gray-100 rounded text-sm">Annulla</button>
                  </div>
                </div>
              ) : (
                <div className="font-medium">{(profile?.notifications ?? notificationsEnabled) ? 'Attive' : 'Disattivate'}</div>
              )}
            </div>
          </div>
          <div className="text-gray-400">{editingField === 'notifications' ? '' : '>'}</div>
        </div>

        <div className="bg-white p-3 rounded-md flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined">settings</span>
            <div>
              <div className="text-sm text-gray-500">Impostazioni account</div>
              <div className="font-medium">Password, privacy</div>
            </div>
          </div>
          <div className="text-gray-400">&gt;</div>
        </div>
      </div>

      <div className="mt-6">
        <button className="w-full px-4 py-3 bg-red-500 text-white rounded-md" onClick={logout}>
          <span className="material-symbols-outlined align-middle">logout</span>
          <span className="ml-2">Logout</span>
        </button>
      </div>

      </div>
      <BottomNav />
    </div>
  )
}
