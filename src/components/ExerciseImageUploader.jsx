import React, { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

// Simple uploader component for exercise images
// Usage: <ExerciseImageUploader exerciseId={ex.id} onUpload={(url)=>{...}} />
export default function ExerciseImageUploader({ exerciseId, onUpload }){
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function upload(){
    if(!file || !exerciseId) return
    setLoading(true)
    setError(null)
    try{
      // ensure you have a bucket named `exercise-images`
      const filename = `${Date.now()}_${file.name}`
      const path = `${exerciseId}/${filename}`
      const { error: upErr } = await supabase.storage.from('exercise-images').upload(path, file, { cacheControl: '3600', upsert: false })
      if(upErr) throw upErr
      // make public url (if bucket is public) or create signed URL
      const { data: urlData, error: urlErr } = await supabase.storage.from('exercise-images').getPublicUrl(path)
      if(urlErr) throw urlErr
      const publicUrl = urlData?.publicUrl

      // update exercises table with image_url
      const { error: dbErr } = await supabase.from('exercises').update({ image_url: publicUrl }).eq('id', exerciseId)
      if(dbErr) throw dbErr

      onUpload && onUpload(publicUrl)
    }catch(e){
      console.error('Upload failed', e)
      setError(e.message || String(e))
    }finally{ setLoading(false) }
  }

  return (
    <div className="space-y-2">
      <input type="file" accept="image/*" onChange={(e)=>setFile(e.target.files?.[0] ?? null)} />
      <div className="flex items-center gap-2">
        <button disabled={loading || !file} onClick={upload} className="px-3 py-1 bg-blue-600 text-white rounded disabled:opacity-50">{loading ? 'Caricamento...' : 'Carica immagine'}</button>
        {file && <div className="text-sm text-gray-600">{file.name}</div>}
      </div>
      {error && <div className="text-sm text-red-600">{error}</div>}
    </div>
  )
}
