import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

export default function CompletedWorkouts(){
  const [workouts, setWorkouts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    let mounted = true
    async function load(){
      setLoading(true)
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
        if(mounted) setLoading(false)
      }
    }
    load()
    return ()=>{ mounted = false }
  }, [])

  const totalMinutes = Math.round((workouts.reduce((s,w)=>s+(w.duration||0),0))/60)

  return (
    <div className="bg-white p-4 rounded shadow">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-sm text-gray-500">Allenamenti completati</div>
          <div className="font-medium">Storico allenamenti</div>
        </div>
      </div>

      {loading ? (
        <div className="p-3 text-sm text-gray-500">Caricamento allenamenti…</div>
      ) : (
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500">
                <th className="pb-2">Data</th>
                <th className="pb-2">Esercizio</th>
                <th className="pb-2">Minuti</th>
                <th className="pb-2">Rip.</th>
              </tr>
            </thead>
            <tbody>
              {workouts.length === 0 && (
                <tr><td colSpan={4} className="py-3 text-gray-600">Non hai ancora allenamenti registrati.</td></tr>
              )}
              {workouts.map(w => (
                <tr key={w.id} className="border-t border-gray-100">
                  <td className="py-2 text-gray-700">{new Date(w.performed_at).toLocaleString()}</td>
                  <td className="py-2">{w.exercise}</td>
                  <td className="py-2">{Math.round((w.duration || 0) / 60)}</td>
                  <td className="py-2">{w.reps ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {workouts.length > 0 && (
            <div className="mt-3 text-sm text-gray-700">
              <strong>{workouts.length}</strong> allenamenti — <strong>{totalMinutes}</strong> minuti totali
            </div>
          )}
        </div>
      )}
    </div>
  )
}
