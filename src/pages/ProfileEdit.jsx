import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useNavigate } from 'react-router-dom'
import useProfile from '../hooks/useProfile'
import AppBar from '../components/AppBar'

export default function ProfileEdit(){
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [fullName, setFullName] = useState('')
  const [level, setLevel] = useState('Neofita')
  const [goal, setGoal] = useState('30 min')
  const [avatarUrl, setAvatarUrl] = useState(null)
  const [avatarFile, setAvatarFile] = useState(null)
  const navigate = useNavigate()
  const { saveProfile } = useProfile()

  useEffect(()=>{
    let mounted = true
    async function load(){
      setLoading(true)
      try{
        const { data: userData, error: userErr } = await supabase.auth.getUser()
        if(userErr) throw userErr
        const user = userData?.user
        if(!user) { navigate('/login'); return }

        const { data: profileRow, error: pErr } = await supabase
          .from('profiles')
          .select('full_name, avatar_url, level, goal')
          .eq('id', user.id)
          .single()

        if(profileRow){
          if(mounted){
            setFullName(profileRow.full_name || user.email)
            setAvatarUrl(profileRow.avatar_url || null)
            setLevel(profileRow.level || 'Neofita')
            setGoal(profileRow.goal || '30 min')
          }
        } else {
          if(mounted) setFullName(user.email)
        }
      }catch(e){
        console.error(e)
        if(mounted) setError(e.message || String(e))
      }finally{ if(mounted) setLoading(false) }
    }
    load()
    return ()=> { mounted = false }
  }, [navigate])

  function onFileChange(e){
    const f = e.target.files?.[0]
    if(!f) return
    setAvatarFile(f)
    const url = URL.createObjectURL(f)
    setAvatarUrl(url)
  }

  async function uploadAvatar(userId){
    if(!avatarFile) return null
    const fileExt = avatarFile.name.split('.').pop()
    const filePath = `${userId}/${Date.now()}.${fileExt}`

    const { data, error } = await supabase.storage.from('avatars').upload(filePath, avatarFile, { upsert: true })
    if(error) throw error

    const { publicURL } = supabase.storage.from('avatars').getPublicUrl(filePath)
    return publicURL
  }

  async function onSave(e){
    e.preventDefault()
    setSaving(true)
    setError(null)
    try{
      const { data: userData, error: userErr } = await supabase.auth.getUser()
      if(userErr) throw userErr
      const user = userData?.user
      if(!user) { navigate('/login'); return }

      let uploadedUrl = null
      if(avatarFile){
        // attempt upload to 'avatars' bucket
        uploadedUrl = await uploadAvatar(user.id)
      }

      const payload = {
        full_name: fullName,
        level,
        goal,
      }
      if(uploadedUrl) payload.avatar_url = uploadedUrl

      // use saveProfile to persist and update sessionStorage cache
      await saveProfile(payload)

      navigate('/profile')
    }catch(e){
      console.error('Save profile error', e)
      setError(e.message || String(e))
    }finally{ setSaving(false) }
  }

  return (
    <div className="p-0 flex-1 min-h-0">
      <AppBar title="Modifica profilo" />
      <div className="p-4">
      {loading ? <div className="p-2">Caricamento...</div> : (
      <>
      <h1 className="text-xl font-semibold mb-4">Modifica profilo</h1>
      {error && <div className="text-red-600 mb-3">Errore: {error}</div>}

      <form onSubmit={onSave} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-600 mb-2">Avatar</label>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center">
              {avatarUrl ? <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" /> : <span className="text-xl text-gray-600">?</span>}
            </div>
            <div>
              <input type="file" accept="image/*" onChange={onFileChange} />
              <div className="text-xs text-gray-500">Max 2MB. Verrà caricato nel bucket `avatars`.</div>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-2">Nome completo</label>
          <input value={fullName} onChange={e=>setFullName(e.target.value)} className="w-full p-2 border rounded" />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-2">Livello</label>
          <select value={level} onChange={e=>setLevel(e.target.value)} className="w-full p-2 border rounded">
            <option>Neofita</option>
            <option>Intermedio</option>
            <option>Avanzato</option>
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-2">Obiettivo giornaliero</label>
          <input value={goal} onChange={e=>setGoal(e.target.value)} className="w-full p-2 border rounded" />
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-white rounded-md">{saving ? 'Salvataggio...' : 'Salva'}</button>
          <button type="button" onClick={()=>navigate('/profile')} className="px-4 py-2 bg-gray-100 rounded-md">Annulla</button>
        </div>
      </form>

      <div className="mt-6 text-xs text-gray-500">
        Nota: Per usare l'upload è necessario creare un bucket pubblico chiamato `avatars` nella sezione Storage di Supabase e abilitare URL pubblici.
      </div>
      </>
      )}
      </div>
    </div>
  )
}
