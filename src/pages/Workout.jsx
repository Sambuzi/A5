import React, { useEffect, useState, useRef } from 'react'
import AppBar from '../components/AppBar'
import { supabase } from '../lib/supabaseClient'
import BottomNav from '../components/BottomNav'

function Timer({ initialSeconds = 45, onComplete }){
  const [seconds, setSeconds] = useState(initialSeconds)
  const [running, setRunning] = useState(false)
  const intervalRef = useRef(null)

  useEffect(()=>{
    if(running){
      intervalRef.current = setInterval(()=>{
        setSeconds(s => {
          if(s <= 1){
            clearInterval(intervalRef.current)
            setRunning(false)
            onComplete && onComplete()
            return 0
          }
          return s-1
        })
      }, 1000)
    }
    return ()=> clearInterval(intervalRef.current)
  }, [running, onComplete])

  function reset(){ setSeconds(initialSeconds); setRunning(false); clearInterval(intervalRef.current) }

  return (
    <div className="bg-white p-4 rounded-md flex items-center justify-between">
      <div>
        <div className="text-sm text-gray-500">Timer</div>
        <div className="text-2xl font-mono">{Math.floor(seconds/60)}:{String(seconds%60).padStart(2,'0')}</div>
      </div>
      <div className="flex items-center gap-2">
        {running ? (
          <button className="px-3 py-2 bg-gray-200 rounded" onClick={()=>setRunning(false)}>Pausa</button>
        ) : (
          <button className="px-3 py-2 bg-primary text-white rounded" onClick={()=>setRunning(true)}>Avvia</button>
        )}
        <button className="px-3 py-2 bg-gray-100 rounded" onClick={reset}>Reset</button>
      </div>
    </div>
  )
}

export default function Workout(){
  const [exercises, setExercises] = useState([])
  const [loading, setLoading] = useState(true)
  const [level, setLevel] = useState('Neofita')
  const [selected, setSelected] = useState(null) // selected exercise id
  const [reps, setReps] = useState(10)
  const [message, setMessage] = useState(null)

  useEffect(()=>{
    let mounted = true
    async function load(){
      setLoading(true)
      let finalLevel = 'Neofita'
      try{
        const raw = sessionStorage.getItem('wellgym_profile_cache_v1')
        if(raw){ const cached = JSON.parse(raw); if(cached?.level) finalLevel = cached.level }
      }catch(e){}

      try{
        const { data: userData } = await supabase.auth.getUser()
        const user = userData?.user
        if(user){
          const { data: profileRow, error } = await supabase.from('profiles').select('level').eq('id', user.id).single()
          if(!error && profileRow?.level) finalLevel = profileRow.level
        }
      }catch(e){}

      if(mounted) setLevel(finalLevel)

      try{
        const { data, error } = await supabase.from('exercises').select('id, level, title, description, demo_url').eq('level', finalLevel).order('created_at', { ascending: true })
        if(error) throw error
        if(mounted) setExercises(data || [])
      }catch(e){ console.error('Error loading exercises', e); if(mounted) setExercises([]) }
      finally{ if(mounted) setLoading(false) }
    }
    load()
    return ()=>{ mounted = false }
  }, [])

  async function saveCompleted(durationSec, ex){
    try{
      const user = (await supabase.auth.getUser()).data?.user
      await supabase.from('workouts').insert([{ user_id: user?.id || null, exercise: ex.title, duration: durationSec, reps, performed_at: new Date() }])
      setMessage('Esercizio salvato')
    }catch(e){ setMessage('Errore salvataggio') }
  }

  const current = selected ? exercises.find(e=>e.id===selected) : null

  return (
    <div className="p-0 flex-1 min-h-0">
      <AppBar title="Allenamento" />
      <div className="p-4 flex-1 flex flex-col">
        <h2 className="text-lg font-semibold mb-3">Esercizi — {level}</h2>

        {loading && <div className="p-3 mb-4 bg-yellow-50 text-yellow-800 rounded">Caricamento esercizi…</div>}

        {!current && (
          <div className="space-y-3 overflow-auto">
            {exercises.map(ex => (
              <button key={ex.id} onClick={()=>{ setSelected(ex.id); setReps(10); setMessage(null) }} className="w-full text-left md-card p-4 rounded-xl bg-surface flex items-center justify-between">
                <div>
                  <div className="font-semibold">{ex.title}</div>
                  <div className="text-sm text-gray-600 mt-1">{ex.description}</div>
                </div>
                <div className="text-sm text-primary">Avvia</div>
              </button>
            ))}
          </div>
        )}

        {current && (
          <div className="flex-1 overflow-auto">
            <div className="md-card p-4 rounded-xl bg-surface mb-4">
              <h3 className="text-xl font-semibold">{current.title}</h3>
              <p className="text-sm text-gray-600 mt-2">{current.description}</p>
            </div>

            <div className="mb-3">
              <Timer initialSeconds={45} onComplete={()=>saveCompleted(45, current)} />
            </div>

            <div className="mt-4 bg-white p-3 rounded shadow flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Ripetizioni</div>
                <div className="text-lg font-semibold">{reps}</div>
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-2 bg-gray-200 rounded" onClick={()=>setReps(r=>Math.max(1,r-1))}>-</button>
                <button className="px-3 py-2 bg-gray-200 rounded" onClick={()=>setReps(r=>r+1)}>+</button>
              </div>
            </div>

            {message && <div className="mt-3 text-sm text-green-600">{message}</div>}

            <div className="mt-6 flex gap-2">
              <button className="px-4 py-2 bg-indigo-600 text-white rounded" onClick={()=>saveCompleted(0, current)}>Segna completato</button>
              <button className="px-4 py-2 bg-gray-100 rounded" onClick={()=>setSelected(null)}>Indietro</button>
            </div>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  )
}
