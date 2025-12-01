import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

function formatDate(dt){
  try{ return new Date(dt).toLocaleString() }catch(e){ return dt }
}

export default function CompletedWorkouts(){
  const [workouts, setWorkouts] = useState([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState({ field: 'performed_at', dir: 'desc' })

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

  function changeSort(field){
    setSort(s => {
      if(s.field === field) return { field, dir: s.dir === 'asc' ? 'desc' : 'asc' }
      return { field, dir: 'asc' }
    })
  }

  const sorted = [...workouts].sort((a,b)=>{
    const f = sort.field
    const av = a[f] ?? ''
    const bv = b[f] ?? ''
    if(av === bv) return 0
    if(sort.dir === 'asc') return av > bv ? 1 : -1
    return av < bv ? 1 : -1
  })

  return (
    <div className="md-card p-4 rounded-xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-sm text-gray-500">Allenamenti completati</div>
          <div className="font-medium text-lg">Storico allenamenti</div>
        </div>
        <div className="text-sm text-gray-600">{workouts.length} allenamenti • {totalMinutes} min</div>
      </div>

      {loading ? (
        <div className="p-3 text-sm text-gray-500">Caricamento allenamenti…</div>
      ) : (
        <div className="overflow-auto">
          {/* Desktop table */}
          <table className="w-full text-sm hidden sm:table">
            <thead>
              <tr className="text-left text-xs text-gray-500">
                <th className="pb-2 cursor-pointer" onClick={()=>changeSort('performed_at')}>Data {sort.field==='performed_at' ? (sort.dir==='asc' ? '↑' : '↓') : ''}</th>
                <th className="pb-2 cursor-pointer" onClick={()=>changeSort('exercise')}>Esercizio {sort.field==='exercise' ? (sort.dir==='asc' ? '↑' : '↓') : ''}</th>
                <th className="pb-2 cursor-pointer" onClick={()=>changeSort('duration')}>Minuti {sort.field==='duration' ? (sort.dir==='asc' ? '↑' : '↓') : ''}</th>
                <th className="pb-2">Rip.</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 && (
                <tr><td colSpan={4} className="py-3 text-gray-600">Non hai ancora allenamenti registrati.</td></tr>
              )}
              {sorted.map(w => (
                <tr key={w.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="py-3 text-gray-700">{formatDate(w.performed_at)}</td>
                  <td className="py-3">{w.exercise}</td>
                  <td className="py-3">{Math.round((w.duration || 0) / 60)}</td>
                  <td className="py-3">{w.reps ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile cards */}
          <div className="sm:hidden space-y-3">
            {sorted.length === 0 && (
              <div className="py-3 text-gray-600">Non hai ancora allenamenti registrati.</div>
            )}
            {sorted.map(w => (
              <div key={w.id} className="p-3 bg-surface rounded-lg border border-gray-100">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm text-gray-500">{formatDate(w.performed_at)}</div>
                    <div className="font-medium mt-1">{w.exercise}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Min</div>
                    <div className="font-semibold">{Math.round((w.duration || 0) / 60)}</div>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500">Rip.: {w.reps ?? '-'}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
