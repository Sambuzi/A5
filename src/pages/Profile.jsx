import React, {useState, useEffect, useRef} from 'react'
import { supabase } from '../lib/supabaseClient'
import BottomNav from '../components/BottomNav'
import AppBar from '../components/AppBar'
import ProfileHeader from '../components/profile/ProfileHeader'
import ProfileDetails from '../components/profile/ProfileDetails'
import ProfilePreferences from '../components/profile/ProfilePreferences'
import CompletedWorkouts from '../components/profile/CompletedWorkouts'
import useProfile from '../hooks/useProfile'
import { useNavigate } from 'react-router-dom'

export default function Profile(){
  const [error, setError] = useState(null)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingField, setEditingField] = useState(null)
  
  const [avatarFile, setAvatarFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [nameEdit, setNameEdit] = useState('')
  const [levelEdit, setLevelEdit] = useState('Neofita')
  const [goalEdit, setGoalEdit] = useState('30 min')
  const [bioEdit, setBioEdit] = useState('')
  const [workouts, setWorkouts] = useState([])
  const [workoutsLoading, setWorkoutsLoading] = useState(true)
  
  const fileInputRef = useRef(null)
  const levelPopRef = useRef(null)
  const navigate = useNavigate()

  // use centralized hook for profile data
  const { profile: loadedProfile, loading: profileLoading, error: profileError, updateField, saveProfile } = useProfile()

  useEffect(()=>{
    // sync hook-provided profile into local edit fields when loaded
    if(loadedProfile){
      setNameEdit(loadedProfile.name)
      setLevelEdit(loadedProfile.level)
      setGoalEdit(loadedProfile.goal)
      setBioEdit(loadedProfile.bio || '')
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
        setLevelEdit(loadedProfile?.level ?? levelEdit)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return ()=> document.removeEventListener('mousedown', onDocClick)
  }, [editingField, loadedProfile, levelEdit])

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
        
      }
      if(uploadedUrl) payload.avatar_url = uploadedUrl
      // use hook to save and update cache/UI
      await saveProfile({
        full_name: nameEdit,
        level: levelEdit,
        goal: goalEdit,
        bio: bioEdit,
        ...(uploadedUrl ? { avatar_url: uploadedUrl } : {})
      })
      setAvatarFile(null)
      if(previewUrl){ URL.revokeObjectURL(previewUrl); setPreviewUrl(null) }
      setEditing(false)
    }catch(e){
      console.error('Save error', e)
      setError(e.message || String(e))
    }finally{ setSaving(false) }
  }

  // single-field updates are handled by the `useProfile` hook (updateField)

  // load completed workouts for this user and compute totals
  useEffect(()=>{
    let mounted = true
    async function loadWorkouts(){
      setWorkoutsLoading(true)
      try{
        const { data: userData } = await supabase.auth.getUser()
        const user = userData?.user
        if(!user){ if(mounted) setWorkouts([]); return }

        const { data, error } = await supabase.from('workouts')
          .select('id, exercise, duration, reps, performed_at')
          .eq('user_id', user.id)
          .order('performed_at', { ascending: false })

        if(error) throw error
        if(!mounted) return
        setWorkouts(data || [])
      }catch(e){
        console.error('Error loading workouts', e)
        if(mounted) setWorkouts([])
      }finally{
        if(mounted) setWorkoutsLoading(false)
      }
    }
    loadWorkouts()
    return ()=>{ mounted = false }
  }, [])

  async function logout(){
    await supabase.auth.signOut()
    navigate('/login')
  }

  const displayName = loadedProfile?.name ?? 'Utente'
  const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=EDE9FE&color=5B21B6&size=128`

  const isLoading = profileLoading
  const hasError = Boolean(error || profileError)

  return (
    <div className="p-0 flex-1 min-h-0">
      <AppBar title="Profilo" />
      <div className="p-4 pb-24">
      <h1 className="text-xl font-semibold mb-3">Profilo</h1>

      {/* Loading UI removed to avoid persistent 'Caricamento profilo' message */}
      {hasError && (
        <div className="p-3 mb-4 bg-red-50 text-red-700 rounded">Errore: {error}</div>
      )}

      <ProfileHeader
        profile={loadedProfile}
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
          setNameEdit(loadedProfile?.name ?? nameEdit);
          setLevelEdit(loadedProfile?.level ?? levelEdit);
          setGoalEdit(loadedProfile?.goal ?? goalEdit);
          setBioEdit(loadedProfile?.bio || '');
          
          setAvatarFile(null);
          if(previewUrl){ URL.revokeObjectURL(previewUrl); setPreviewUrl(null) }
        }}
        onEdit={()=>{ 
          setEditing(true);
          setNameEdit(loadedProfile?.name ?? nameEdit);
          setLevelEdit(loadedProfile?.level ?? levelEdit);
          setGoalEdit(loadedProfile?.goal ?? goalEdit);
          setBioEdit(loadedProfile?.bio || '');
          
        }}
      />
      <div className="space-y-3">
        <ProfileDetails
          profile={loadedProfile}
          editingField={editingField}
          setEditingField={setEditingField}
          levelEdit={levelEdit}
          setLevelEdit={setLevelEdit}
          goalEdit={goalEdit}
          setGoalEdit={setGoalEdit}
          updateProfileField={updateField}
        />

        <ProfilePreferences
          profile={loadedProfile}
          editing={editing}
          bioEdit={bioEdit}
          setBioEdit={setBioEdit}
          
          editingField={editingField}
          setEditingField={setEditingField}
          updateProfileField={updateField}
        />
        <CompletedWorkouts />
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
