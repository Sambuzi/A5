import React, {useState, useEffect, useRef} from 'react'
import { supabase } from '../lib/supabaseClient'
import BottomNav from '../components/BottomNav'
import AppBar from '../components/AppBar'
import ProfileHeader from '../components/profile/ProfileHeader'
import NotificationsSwitch from '../components/profile/NotificationsSwitch'
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
  const [notificationsEnabled, setNotificationsEnabled] = useState(()=>{
    try{
      const raw = sessionStorage.getItem(PROFILE_CACHE_KEY)
      if(raw){
        const cached = JSON.parse(raw)
        return cached.notifications ?? true
      }
    }catch(e){}
    return true
  })
  const [avatarFile, setAvatarFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [nameEdit, setNameEdit] = useState('')
  const [levelEdit, setLevelEdit] = useState('Neofita')
  const [goalEdit, setGoalEdit] = useState('30 min/die')
  const [bioEdit, setBioEdit] = useState('')
  const [prefDurationEdit, setPrefDurationEdit] = useState(30)
  const [preferredCategoriesEdit, setPreferredCategoriesEdit] = useState('')
  const [isPublic, setIsPublic] = useState(true)
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

        if(mounted) {
          setProfile(p)
          setNameEdit(p.name)
          setLevelEdit(p.level)
          setGoalEdit(p.goal)
          setNotificationsEnabled(p.notifications)
          setBioEdit(p.bio || '')
          setPrefDurationEdit(p.preferred_duration || 30)
          setPreferredCategoriesEdit(p.preferred_categories || '')
          setIsPublic(Boolean(p.is_public))
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
        bio: bioEdit,
        preferred_duration: Number(prefDurationEdit) || 30,
        preferred_categories: preferredCategoriesEdit || '',
        is_public: Boolean(isPublic),
      }
      if(uploadedUrl) payload.avatar_url = uploadedUrl

      const { error } = await supabase.from('profiles').upsert(payload)
      if(error) throw error

      // update local profile (guard prev when null)
      setProfile(prev => ({ ...(prev || {}), name: nameEdit, level: levelEdit, goal: goalEdit, bio: bioEdit, preferred_duration: Number(prefDurationEdit) || 30, preferred_categories: preferredCategoriesEdit || '', is_public: Boolean(isPublic), avatar_url: uploadedUrl || prev?.avatar_url || null }))
      setAvatarFile(null)
      if(previewUrl){ URL.revokeObjectURL(previewUrl); setPreviewUrl(null) }
      setEditing(false)
      // update session cache after a full save
      try{
        const cachedRaw = sessionStorage.getItem(PROFILE_CACHE_KEY)
        const cached = cachedRaw ? JSON.parse(cachedRaw) : {}
        const updated = { 
          ...(cached || {}),
          name: nameEdit,
          level: levelEdit,
          goal: goalEdit,
          bio: bioEdit,
          preferred_duration: Number(prefDurationEdit) || 30,
          preferred_categories: preferredCategoriesEdit || '',
          is_public: Boolean(isPublic),
          notifications: notificationsEnabled,
          avatar_url: uploadedUrl || cached?.avatar_url || null
        }
        sessionStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(updated))
      }catch(e){ /* ignore */ }
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
      // if notifications changed, sync the toggle state immediately
      if(field === 'notifications') setNotificationsEnabled(Boolean(value))
      // update session cache so the change persists across navigations
      try{
        const cachedRaw = sessionStorage.getItem(PROFILE_CACHE_KEY)
        const cached = cachedRaw ? JSON.parse(cachedRaw) : {}
        const updated = { ...(cached || {}), [field]: value }
        sessionStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(updated))
      }catch(e){ /* ignore storage errors */ }
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
      <div className="p-4 pb-24">
      <h1 className="text-xl font-semibold mb-3">Profilo</h1>

      {isLoading && (
        <div className="p-3 mb-4 bg-yellow-50 text-yellow-800 rounded">Caricamento profilo…</div>
      )}
      {hasError && (
        <div className="p-3 mb-4 bg-red-50 text-red-700 rounded">Errore: {error}</div>
      )}

      <ProfileHeader
        profile={profile}
        editing={editing}
        nameEdit={nameEdit}
        setNameEdit={setNameEdit}
        onAvatarClick={onAvatarClick}
        fileInputRef={fileInputRef}
        previewUrl={previewUrl}
        onFileChange={onFileChange}
        onSave={onSave}
        saving={saving}
        onCancelEdit={()=>{ 
          setEditing(false);
          setNameEdit(profile?.name ?? nameEdit);
          setLevelEdit(profile?.level ?? levelEdit);
          setGoalEdit(profile?.goal ?? goalEdit);
          setBioEdit(profile?.bio || '');
          setPrefDurationEdit(profile?.preferred_duration || 30);
          setPreferredCategoriesEdit(profile?.preferred_categories || '');
          setIsPublic(Boolean(profile?.is_public));
          setAvatarFile(null);
          if(previewUrl){ URL.revokeObjectURL(previewUrl); setPreviewUrl(null) }
        }}
        onEdit={()=>{ 
          setEditing(true);
          setNameEdit(profile?.name ?? nameEdit);
          setLevelEdit(profile?.level ?? levelEdit);
          setGoalEdit(profile?.goal ?? goalEdit);
          setBioEdit(profile?.bio || '');
          setPrefDurationEdit(profile?.preferred_duration || 30);
          setPreferredCategoriesEdit(profile?.preferred_categories || '');
          setIsPublic(Boolean(profile?.is_public));
        }}
      />

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

        <NotificationsSwitch
          notificationsEnabled={notificationsEnabled}
          onToggle={async (val) => {
            setNotificationsEnabled(val)
            try{ await updateProfileField('notifications', val) }catch(e){ /* handled in updateProfileField */ }
          }}
        />

          {/* Bio */}
          <div className="bg-white p-3 rounded-md">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined">person</span>
              <div className="flex-1">
                <div className="text-sm text-gray-500">Bio</div>
                {editing ? (
                  <textarea value={bioEdit} onChange={e=>setBioEdit(e.target.value)} rows={3} className="w-full mt-2 p-2 border rounded text-sm" />
                ) : (
                  <div className="mt-2 text-sm text-gray-700">{profile?.bio || 'Aggiungi una breve presentazione.'}</div>
                )}
              </div>
            </div>
          </div>

          {/* Preferred duration */}
          <div className="bg-white p-3 rounded-md flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined">timer</span>
              <div>
                <div className="text-sm text-gray-500">Durata preferita</div>
                {editing ? (
                  <input type="number" min={5} value={prefDurationEdit} onChange={e=>setPrefDurationEdit(Number(e.target.value))} className="mt-1 font-medium w-24" />
                ) : (
                  <div className="font-medium">{profile?.preferred_duration ?? 30} min/die</div>
                )}
              </div>
            </div>
            <div className="text-gray-400">{editing ? '' : '>'}</div>
          </div>

          {/* Preferred categories */}
          <div className="bg-white p-3 rounded-md">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined">category</span>
              <div className="flex-1">
                <div className="text-sm text-gray-500">Categorie preferite</div>
                {editing ? (
                  <input value={preferredCategoriesEdit} onChange={e=>setPreferredCategoriesEdit(e.target.value)} className="w-full mt-2 p-2 border rounded text-sm" placeholder="es. Cardio, Forza, Mobilità" />
                ) : (
                  <div className="mt-2 text-sm text-gray-700">{profile?.preferred_categories || '—'}</div>
                )}
              </div>
            </div>
          </div>

          {/* Public profile */}
          <div className="bg-white p-3 rounded-md flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined">visibility</span>
              <div>
                <div className="text-sm text-gray-500">Visibilità profilo</div>
                <div className="font-medium">{(profile?.is_public ?? isPublic) ? 'Pubblico' : 'Privato'}</div>
              </div>
            </div>
            {editing ? (
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={isPublic} onChange={e=>setIsPublic(Boolean(e.target.checked))} />
                <span className="text-sm text-gray-600">Visibile agli altri</span>
              </label>
            ) : (
              <div className="text-gray-400">{(profile?.is_public ?? isPublic) ? ' ' : ' '}</div>
            )}
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
