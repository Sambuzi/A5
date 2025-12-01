import React, {useState, useEffect, useRef} from 'react'
import { supabase } from '../lib/supabaseClient'
import BottomNav from '../components/BottomNav'
import AppBar from '../components/AppBar'
import ProfileHeader from '../components/profile/ProfileHeader'
import NotificationsSwitch from '../components/profile/NotificationsSwitch'
import ProfileDetails from '../components/profile/ProfileDetails'
import ProfilePreferences from '../components/profile/ProfilePreferences'
import useProfile from '../hooks/useProfile'
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

  // use centralized hook for profile data
  const { profile: loadedProfile, loading: profileLoading, error: profileError, updateField, saveProfile } = useProfile()

  useEffect(()=>{
    // sync hook-provided profile into local state when loaded
    if(loadedProfile){
      setProfile(loadedProfile)
      setNameEdit(loadedProfile.name)
      setLevelEdit(loadedProfile.level)
      setGoalEdit(loadedProfile.goal)
      setNotificationsEnabled(loadedProfile.notifications ?? true)
      setBioEdit(loadedProfile.bio || '')
      setPrefDurationEdit(loadedProfile.preferred_duration || 30)
      setPreferredCategoriesEdit(loadedProfile.preferred_categories || '')
      setIsPublic(Boolean(loadedProfile.is_public))
    }
  }, [loadedProfile])

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
      // use hook to save and update cache
      const merged = await saveProfile({
        full_name: nameEdit,
        level: levelEdit,
        goal: goalEdit,
        bio: bioEdit,
        preferred_duration: Number(prefDurationEdit) || 30,
        preferred_categories: preferredCategoriesEdit || '',
        is_public: Boolean(isPublic),
        notifications: notificationsEnabled,
        ...(uploadedUrl ? { avatar_url: uploadedUrl } : {})
      })

      // reflect saved profile in UI
      setProfile(merged)
      setAvatarFile(null)
      if(previewUrl){ URL.revokeObjectURL(previewUrl); setPreviewUrl(null) }
      setEditing(false)
    }catch(e){
      console.error('Save error', e)
      setError(e.message || String(e))
    }finally{ setSaving(false) }
  }

  // single-field updates are handled by the `useProfile` hook (updateField)

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
        <ProfileDetails
          profile={profile}
          editingField={editingField}
          setEditingField={setEditingField}
          levelEdit={levelEdit}
          setLevelEdit={setLevelEdit}
          goalEdit={goalEdit}
          setGoalEdit={setGoalEdit}
          updateProfileField={updateField}
          notificationsEnabled={notificationsEnabled}
          setNotificationsEnabled={setNotificationsEnabled}
        />

        <ProfilePreferences
          profile={profile}
          editing={editing}
          bioEdit={bioEdit}
          setBioEdit={setBioEdit}
          prefDurationEdit={prefDurationEdit}
          setPrefDurationEdit={setPrefDurationEdit}
          preferredCategoriesEdit={preferredCategoriesEdit}
          setPreferredCategoriesEdit={setPreferredCategoriesEdit}
          isPublic={isPublic}
          setIsPublic={setIsPublic}
          editingField={editingField}
          setEditingField={setEditingField}
          updateProfileField={updateField}
        />
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
