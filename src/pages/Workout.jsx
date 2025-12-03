import React, { useEffect, useState, useRef } from 'react'
import AppBar from '../components/AppBar'
import { supabase } from '../lib/supabaseClient'
import { useToasts } from '../components/ToastProvider'
import BottomNav from '../components/BottomNav'
import useProfile from '../hooks/useProfile'

// Utilities for calorie estimation
function kgFrom(weight, units){
  const w = Number(weight) || 0
  return (units === 'lb') ? w * 0.45359237 : w
}

function caloriesFromMET(met, weightKg, durationMin){
  return ((met * weightKg * 3.5) / 200) * durationMin
}

function caloriesFromPerMin(calPerMin, durationMin){
  return (Number(calPerMin) || 0) * durationMin
}

// Lightweight fallback MET map for common exercises (estimates)
const FALLBACK_MET = {
  'Corsa': 9.8,
  'Camminata veloce': 4.5,
  'Squat': 5.0,
  'Push-up': 8.0,
  'Plank': 3.0,
  'Jumping jacks': 8.0,
}

// Sample images used for quick local testing when exercises have no image_url
const SAMPLE_IMAGES = [
  '/exercise-samples/sample1.svg',
  '/exercise-samples/sample2.svg',
  '/exercise-samples/sample3.svg',
  '/exercise-samples/sample4.svg',
  '/exercise-samples/sample5.svg',
  '/exercise-samples/sample6.svg',
]

function sampleForTitle(title){
  if(!title) return SAMPLE_IMAGES[0]
  let sum = 0
  for(let i=0;i<title.length;i++) sum += title.charCodeAt(i)
  return SAMPLE_IMAGES[sum % SAMPLE_IMAGES.length]
}

// Show a browser notification (if permitted) as well as keep in-app messages
function showNotification(title, body){
  try{
    if(typeof window === 'undefined') return
    if('Notification' in window){
      if(Notification.permission === 'granted'){
        new Notification(title, { body })
      }else if(Notification.permission !== 'denied'){
        Notification.requestPermission().then(p => { if(p === 'granted') new Notification(title, { body }) })
      }
    }
  }catch(e){ console.warn('Notification failed', e) }
}
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
            onComplete && onComplete(initialSeconds)
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
          <button className="px-3 py-2 bg-amber-500 text-white font-semibold rounded-md shadow-sm hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-300" onClick={()=>setRunning(false)}>Pausa</button>
        ) : (
          <button className="px-3 py-2 bg-green-600 text-white font-semibold rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-300" onClick={()=>setRunning(true)}>Avvia</button>
        )}
        <button className="px-3 py-2 bg-white border border-gray-200 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200" onClick={reset}>Reset</button>
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
  const [showInstructions, setShowInstructions] = useState(false)
  const [instructionsText, setInstructionsText] = useState('')
  const [showInstructionsInline, setShowInstructionsInline] = useState(false)

  const { profile } = useProfile()
  const toasts = useToasts()
  // read cached profile synchronously to avoid flashes
  let cachedProfile = null
  try{ const raw = sessionStorage.getItem('wellgym_profile_cache_v1'); if(raw) cachedProfile = JSON.parse(raw) }catch(e){ cachedProfile = null }

  const preferredMinutes = (profile?.preferred_duration ?? cachedProfile?.preferred_duration) || 30
  function getPreferredCategoriesForLevel(lvl){
    const raw = profile?.preferred_categories ?? cachedProfile?.preferred_categories ?? ''
    if(!raw) return []
    try{
      const parsed = JSON.parse(raw)
      if(parsed && typeof parsed === 'object'){
        const v = parsed[lvl] || ''
        return (v || '').split(',').map(s=>s.trim()).filter(Boolean)
      }
    }catch(e){ /* not JSON, fall through */ }
    return (raw || '').split(',').map(s=>s.trim()).filter(Boolean)
  }

  // initial seconds for Timer; will be set to exercise/category default when available
  const [initialSeconds, setInitialSeconds] = useState(preferredMinutes * 60)

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
        // include `category` and `default_duration` so frontend can group exercises and compute durations
        const { data, error } = await supabase.from('exercises').select('id, level, category, title, description, demo_url, default_duration, image_url').eq('level', finalLevel).order('created_at', { ascending: true })
        if(error) throw error
        // for quick local demo: ensure every exercise without an image shows a deterministic sample (non-persistent)
        const withSamples = (data || []).map((ex) => ({ ...ex, image_url: ex.image_url || sampleForTitle(ex.title) }))
        if(mounted) setExercises(withSamples)
      }catch(e){ console.error('Error loading exercises', e); if(mounted) setExercises([]) }
      finally{ if(mounted) setLoading(false) }
    }
    load()
    return ()=>{ mounted = false }
  }, [])

  // when exercises load, if user has preferred categories for this level, auto-open that category
  useEffect(()=>{
    if(exercises.length === 0) return
    const prefCats = getPreferredCategoriesForLevel(level)
    if(prefCats.length === 0) return
    const groups = exercises.reduce((acc, ex) => { const cat = ex.category || 'Generale'; if(!acc[cat]) acc[cat]=[]; acc[cat].push(ex); return acc }, {})
    for(const cat of prefCats){
      if(groups[cat] && groups[cat].length>0){
        const first = groups[cat][0]
        setSelectedCategory(cat)
        setSelected(first.id)
        setReps(10)
        // set timer to category/exercise default if available
        const durMin = (first.default_duration ?? preferredMinutes)
        setInitialSeconds(durMin * 60)
        setMessage(null)
        return
      }
    }
  }, [exercises, level])

  async function saveCompleted(durationSec, ex){
    try{
      const user = (await supabase.auth.getUser()).data?.user

      const minutes = (Number(durationSec) || 0) / 60
      // user weight from profile or cached profile
      const raw = sessionStorage.getItem('wellgym_profile_cache_v1')
      let cached = null
      try{ if(raw) cached = JSON.parse(raw) }catch(e){ cached = null }
      const weightVal = profile?.weight ?? cached?.weight ?? 70
      const weightUnits = profile?.weight_units ?? cached?.weight_units ?? 'kg'
      const weightKg = kgFrom(weightVal, weightUnits)

      // pick calorie source: exercise.calories_per_min, exercise.met, fallback map
      let kcal = 0
      if(ex.calories_per_min) kcal = caloriesFromPerMin(ex.calories_per_min, minutes)
      else if(ex.met) kcal = caloriesFromMET(ex.met, weightKg, minutes)
      else if(FALLBACK_MET[ex.title]) kcal = caloriesFromMET(FALLBACK_MET[ex.title], weightKg, minutes)
      else kcal = caloriesFromMET(6, weightKg, minutes) // generic fallback MET

      // try to save calories and weight_used; if DB schema missing, retry without those fields
      const payload = { user_id: user?.id || null, exercise: ex.title, duration: durationSec, reps, performed_at: new Date(), calories: Math.round(kcal), weight_used: Number(weightVal) }
      let res = await supabase.from('workouts').insert([payload])
      const addToast = toasts?.addToast

      if(res.error){
        // try again without calories/weight_used
        console.warn('Saving with calories failed, retrying without extra fields', res.error)
        const { error } = await supabase.from('workouts').insert([{ user_id: user?.id || null, exercise: ex.title, duration: durationSec, reps, performed_at: new Date() }])
        if(error) throw error
        const msg = 'Esercizio salvato (locale)'
        setMessage(msg)
        showNotification('Allenamento salvato', `${ex.title} — salvato localmente`)
        if(addToast) addToast({ title: 'Allenamento salvato', message: `${ex.title} — salvato localmente` })
      }else{
        const kcalRound = Math.round(kcal)
        const msg = `Esercizio salvato — ${kcalRound} kcal`
        setMessage(msg)
        showNotification('Allenamento salvato', `${ex.title} • ${kcalRound} kcal`)
        if(addToast) addToast({ title: 'Allenamento salvato', message: `${ex.title} • ${kcalRound} kcal` })
      }
    }catch(e){ console.error('saveCompleted error', e); setMessage('Errore salvataggio') }
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
  // compute total minutes per category (using default_duration per exercise or preferredMinutes as fallback)
  const totalsByCat = {}
  for(const cat of cats){
    totalsByCat[cat] = groups[cat].reduce((sum, ex) => sum + (ex.default_duration != null ? Number(ex.default_duration) : preferredMinutes), 0)
  }
  const filteredCats = cats.filter(cat => totalsByCat[cat] >= (preferredMinutes || 0))
  const anyMatch = filteredCats.length > 0

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

                    {
                      // decide which categories to display based on preferredMinutes
                      const displayCats = anyMatch ? filteredCats : cats
                      return (
                        <>
                          {!anyMatch && (
                            <div className="text-xs text-gray-400">(Nessuna tipologia raggiunge i {preferredMinutes} min, vengono mostrati tutti i risultati)</div>
                          )}
                          {displayCats.map(cat => {
                            const totalMinutes = totalsByCat[cat] || groups[cat].reduce((sum, ex) => sum + (ex.default_duration != null ? Number(ex.default_duration) : preferredMinutes), 0)
                            return (
                              <button key={cat} onClick={()=>{
                                const first = groups[cat]?.[0]
                                setSelectedCategory(cat)
                                if(first){
                                  setSelected(first.id)
                                  setReps(10)
                                  const durMin = (first.default_duration ?? preferredMinutes)
                                  setInitialSeconds(durMin * 60)
                                  setMessage(null)
                                }
                              }} className="w-full text-left md-card p-4 rounded-xl bg-surface flex items-center justify-between">
                                <div>
                                  <div className="font-semibold">{cat}</div>
                                  <div className="text-sm text-gray-600 mt-1">{groups[cat].length} esercizi · {Math.round(totalMinutes)} min</div>
                                </div>
                                <div className="text-sm text-primary">Apri</div>
                              </button>
                            )
                          })}
                        </>
                      )
                    }
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
                    <div key={ex.id} className="w-full md-card p-4 rounded-xl bg-surface flex items-center justify-between">
                      <button type="button" onClick={()=>{ setSelected(ex.id); setReps(10); setMessage(null); const durMin = (ex.default_duration ?? preferredMinutes); setInitialSeconds(durMin * 60); }} className="flex-1 text-left flex items-center gap-3">
                        <div className="flex items-center gap-3">
                          {ex.image_url ? (
                            <img src={ex.image_url} alt={ex.title} className="w-16 h-12 object-cover rounded-md" />
                          ) : (
                            <div className="w-16 h-12 bg-gray-100 rounded-md flex items-center justify-center text-xs text-gray-400">No img</div>
                          )}
                          <div>
                            <div className="font-semibold">{ex.title}</div>
                            <div className="text-sm text-gray-600 mt-1">{ex.description}</div>
                          </div>
                        </div>
                      </button>
                      <div className="flex flex-col items-end ml-3">
                        <button type="button" className="text-sm text-primary mb-2" onClick={(ev)=>{ ev.stopPropagation(); setInstructionsText(ex.description || 'Nessuna istruzione disponibile.'); setShowInstructions(true); }}>Istruzioni</button>
                        <button type="button" className="text-sm text-primary" onClick={()=>{ setSelected(ex.id); setReps(10); setMessage(null); const durMin = (ex.default_duration ?? preferredMinutes); setInitialSeconds(durMin * 60); }}>Avvia</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        {current && (
          <div className="flex-1 overflow-auto">
            <div className="md-card p-4 rounded-xl bg-surface mb-4">
              {current.image_url && (
                <img src={current.image_url} alt={current.title} className="w-full h-40 object-cover rounded-md mb-3" />
              )}
              <h3 className="text-xl font-semibold">{current.title}</h3>

              <div className="mt-3">
                <button className="px-3 py-2 bg-white border border-gray-200 rounded text-sm" onClick={()=>{ setInstructionsText(current.description || 'Nessuna istruzione disponibile.'); setShowInstructionsInline(s => !s) }}>{showInstructionsInline ? 'Nascondi istruzioni' : 'Mostra istruzioni'}</button>
              </div>

              {showInstructionsInline && (
                <div className="mt-3 bg-gray-50 p-3 rounded text-sm text-gray-700 whitespace-pre-wrap">
                  {instructionsText}
                </div>
              )}
            </div>

            <div className="mb-3">
              {/* remount Timer when selected changes so it resets */}
              <Timer key={selected} initialSeconds={initialSeconds} onComplete={(secs)=>saveCompleted(secs, current)} />
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
              <button aria-label="Segna completato" className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300" onClick={()=>saveCompleted(initialSeconds, current)}>Segna completato</button>

              {(() => {
                const list = exercises.filter(e => (e.category || 'Generale') === (selectedCategory || (current.category || 'Generale')))
                const idx = list.findIndex(x => x.id === current.id)
                const isLast = !(idx >= 0 && idx < list.length - 1)

                if(!isLast){
                  return (
                    <button aria-label="Successivo" className="px-4 py-2 bg-green-500 text-white font-semibold rounded-lg shadow-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-200 flex items-center gap-2" onClick={()=>{
                      const next = list[idx+1]
                      setSelected(next.id)
                      setReps(10)
                      setMessage(null)
                    }}>
                      <span className="material-symbols-outlined text-base leading-none">arrow_forward</span>
                      <span>Successivo</span>
                    </button>
                  )
                }

                return (
                  <button aria-label="Termina allenamento" className="px-4 py-2 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-200" onClick={()=>{
                    // finish the opened category/workout
                    setSelected(null)
                    setSelectedCategory(null)
                    setMessage('Allenamento completato')
                  }}>Termina allenamento</button>
                )
              })()}
              <button aria-label="Indietro" className="px-4 py-2 bg-white text-gray-800 border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 flex items-center gap-2" onClick={()=>setSelected(null)}>
                <span className="material-symbols-outlined text-base leading-none">arrow_back</span>
                <span>Indietro</span>
              </button>
            </div>
          </div>
        )}
      </div>
      <BottomNav />
      {showInstructions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black opacity-50" onClick={()=>setShowInstructions(false)} />
          <div className="relative max-w-lg w-full bg-white rounded shadow-lg p-4 z-10">
            <div className="flex items-start justify-between">
              <h4 className="text-lg font-semibold">Istruzioni</h4>
              <button className="text-gray-500" onClick={()=>setShowInstructions(false)}>✕</button>
            </div>
            <div className="mt-3 text-sm text-gray-700 whitespace-pre-wrap">{instructionsText}</div>
            <div className="mt-4 text-right">
              <button className="px-3 py-2 bg-primary text-white rounded" onClick={()=>setShowInstructions(false)}>Chiudi</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
