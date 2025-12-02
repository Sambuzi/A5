import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import ExerciseImageUploader from '../components/ExerciseImageUploader'
import AppBar from '../components/AppBar'
import BottomNav from '../components/BottomNav'

export default function AdminExercises(){
  const [exercises, setExercises] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    let mounted = true
    async function load(){
      setLoading(true)
      try{
        const { data, error } = await supabase.from('exercises').select('id, title, category, image_url').order('created_at', { ascending: true })
        if(error) throw error
        if(mounted) setExercises(data || [])
      }catch(e){ console.error('Error loading exercises', e); if(mounted) setExercises([]) }
      finally{ if(mounted) setLoading(false) }
    }
    load()
    return ()=> mounted = false
  },[])

  async function handleUploaded(exId, url){
    // update local state so UI refreshes
    setExercises(prev => prev.map(ex => ex.id === exId ? { ...ex, image_url: url } : ex))
  }

  return (
    <div className="p-0 flex-1 min-h-0 flex flex-col">
      <AppBar title="Admin — Esercizi" />
      <div className="p-4 flex-1 overflow-auto min-h-0 pb-24">
        <h2 className="text-lg font-semibold mb-3">Gestione immagini esercizi</h2>
        {loading ? (
          <div>Caricamento…</div>
        ) : (
          <div className="space-y-4">
            {exercises.map(ex => (
              <div key={ex.id} className="bg-white p-3 rounded shadow flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="font-medium">{ex.title}</div>
                  <div className="text-sm text-gray-500">{ex.category}</div>
                </div>
                <div className="flex items-center gap-4">
                  <div>
                    {ex.image_url ? <img src={ex.image_url} alt={ex.title} className="w-24 h-16 object-cover rounded" /> : <div className="w-24 h-16 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-400">No image</div>}
                  </div>
                  <div style={{ minWidth: 220 }}>
                    <ExerciseImageUploader exerciseId={ex.id} onUpload={(url)=>handleUploaded(ex.id, url)} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  )
}
