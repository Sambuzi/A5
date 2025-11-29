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
  const [selectedCategory, setSelectedCategory] = useState(null) // selected workout type/category
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
        // include `category` so frontend can group exercises by workout type
        const { data, error } = await supabase.from('exercises').select('id, level, category, title, description, demo_url').eq('level', finalLevel).order('created_at', { ascending: true })
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
  // group exercises by category for UI and navigation
  const groups = exercises.reduce((acc, ex) => {
    const cat = ex.category || 'Generale'
    if(!acc[cat]) acc[cat] = []
    acc[cat].push(ex)
    return acc
  }, {})
  const cats = Object.keys(groups)

  return (
    <div className="p-0 flex-1 min-h-0">
      <AppBar title="Allenamento" />
      <div className="p-4 flex-1 flex flex-col">
        <h2 className="text-lg font-semibold mb-3">Esercizi — {level}</h2>

        {loading && <div className="p-3 mb-4 bg-yellow-50 text-yellow-800 rounded">Caricamento esercizi…</div>}

          {!current && (
            <div className="flex-1 overflow-auto">
              {!selectedCategory && (
                <div className="space-y-3">
                  {/* Render categories (workout types) grouped from exercises */}
                  {(() => {
                    if(cats.length === 0) return <div className="p-4 bg-white rounded-md text-center text-gray-600">Nessun esercizio disponibile per questo livello.</div>

                    return cats.map(cat => (
                      <button key={cat} onClick={()=>{
                        // open category and start first exercise immediately
                        const first = groups[cat]?.[0]
                        setSelectedCategory(cat)
                        if(first){ setSelected(first.id); setReps(10); setMessage(null) }
                      }} className="w-full text-left md-card p-4 rounded-xl bg-surface flex items-center justify-between">
                        <div>
                          <div className="font-semibold">{cat}</div>
                          <div className="text-sm text-gray-600 mt-1">{groups[cat].length} esercizi</div>
                        </div>
                        <div className="text-sm text-primary">Apri</div>
                      </button>
                    ))
                  })()}
                </div>
              )}

              {selectedCategory && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold text-lg">{selectedCategory}</div>
                    <button className="text-sm text-primary" onClick={()=>setSelectedCategory(null)}>Indietro</button>
                  </div>

                  {exercises.filter(e => (e.category || 'Generale') === selectedCategory).map(ex => (
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
            </div>
          )}

        {current && (
          <div className="flex-1 overflow-auto">
            <div className="md-card p-4 rounded-xl bg-surface mb-4">
              <h3 className="text-xl font-semibold">{current.title}</h3>
              <p className="text-sm text-gray-600 mt-2">{current.description}</p>
            </div>

            <div className="mb-3">
              {/* remount Timer when selected changes so it resets */}
              <Timer key={selected} initialSeconds={45} onComplete={()=>saveCompleted(45, current)} />
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

              {(() => {
                const list = exercises.filter(e => (e.category || 'Generale') === (selectedCategory || (current.category || 'Generale')))
                const idx = list.findIndex(x => x.id === current.id)
                const isLast = !(idx >= 0 && idx < list.length - 1)

                if(!isLast){
                  return (
                    <button className="px-4 py-2 bg-gray-100 rounded" onClick={()=>{
                      const next = list[idx+1]
                      setSelected(next.id)
                      setReps(10)
                      setMessage(null)
                    }}>Successivo</button>
                  )
                }

                return (
                  <button className="px-4 py-2 bg-red-600 text-white rounded" onClick={()=>{
                    // finish the opened category/workout
                    setSelected(null)
                    setSelectedCategory(null)
                    setMessage('Allenamento completato')
                  }}>Termina allenamento</button>
                )
              })()}

              <button className="px-4 py-2 bg-gray-100 rounded" onClick={()=>setSelected(null)}>Indietro</button>
            </div>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  )
}
