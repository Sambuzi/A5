import React, { useEffect, useState, useRef } from 'react'
import AppBar from '../components/AppBar'
import { supabase } from '../lib/supabaseClient'
import { useToasts } from '../components/ToastProvider'
import BottomNav from '../components/BottomNav'
import useProfile from '../hooks/useProfile'
import Timer from '../components/Timer'
import ExerciseList from '../components/ExerciseList'

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
// Timer moved to `src/components/Timer.jsx`

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
  const [setsTotal, setSetsTotal] = useState(3)
  const [currentSet, setCurrentSet] = useState(0)
  const [weightUsed, setWeightUsed] = useState('')

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
        // include `category`, `default_duration`, `default_sets` and `default_reps` so frontend can group exercises and compute durations/sets
        const { data, error } = await supabase.from('exercises').select('id, level, category, title, description, demo_url, default_duration, default_sets, default_reps, image_url').eq('level', finalLevel).order('created_at', { ascending: true })
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
        // initialize reps/sets and timer using exercise defaults when available
        setReps(first.default_reps ?? 10)
        setSetsTotal(first.default_sets ?? setsTotal)
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

  async function saveSet(durationSec, ex){
    try{
      const user = (await supabase.auth.getUser()).data?.user

      const raw = sessionStorage.getItem('wellgym_profile_cache_v1')
      let cached = null
      try{ if(raw) cached = JSON.parse(raw) }catch(e){ cached = null }
      const weightVal = weightUsed || (profile?.weight ?? cached?.weight ?? 70)

      const payload = { user_id: user?.id || null, exercise: ex.title, duration: durationSec, reps, performed_at: new Date(), set_number: currentSet + 1, sets_total: Number(setsTotal), weight_used: Number(weightVal) }
      let res = await supabase.from('workouts').insert([payload])
      const addToast = toasts?.addToast

      if(res.error){
        // retry without extra fields if DB schema missing
        console.warn('Saving set with extras failed, retrying without extras', res.error)
        const { error } = await supabase.from('workouts').insert([{ user_id: user?.id || null, exercise: ex.title, duration: durationSec, reps, performed_at: new Date() }])
        if(error) throw error
        if(addToast) addToast({ title: 'Serie salvata', message: `${ex.title} — salvata localmente` })
        setMessage('Serie salvata (locale)')
      }else{
        if(addToast) addToast({ title: 'Serie salvata', message: `${ex.title} — serie ${currentSet + 1} salvata` })
        setMessage(`Serie ${currentSet + 1} salvata`)
      }

      // advance current set and start a short rest (optional UI hook)
      setCurrentSet(s => Math.min(Number(setsTotal), s + 1))
    }catch(e){ console.error('saveSet error', e); setMessage('Errore salvataggio serie') }
  }

  // called when timer completes: save the completed set/exercise and advance to next exercise if available
  async function handleTimerComplete(secs){
    try{
      if(current) await saveCompleted(secs, current)
      // move to next exercise in same category, similar to 'Successivo' button
      const list = exercises.filter(e => (e.category || 'Generale') === (selectedCategory || (current?.category || 'Generale')))
      const idx = list.findIndex(x => x.id === current?.id)
      const isLast = !(idx >= 0 && idx < list.length - 1)
      if(!isLast){
        const next = list[idx+1]
        setSelected(next.id)
        setReps(10)
        setMessage(null)
      }else{
        // finish workout
        setSelected(null)
        setSelectedCategory(null)
        setMessage('Allenamento completato')
      }
    }catch(e){ console.error('handleTimerComplete error', e) }
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

  // when selected changes, initialize sets/reps/duration from exercise defaults if present
  useEffect(()=>{
    if(!selected) return
    const ex = exercises.find(e=>e.id===selected)
    if(!ex) return
    // set reps and sets from exercise defaults when available
    if(ex.default_reps != null) setReps(Number(ex.default_reps))
    if(ex.default_sets != null) setSetsTotal(Number(ex.default_sets))
    if(ex.default_duration != null) setInitialSeconds(Number(ex.default_duration) * 60)
    // load number of sets already recorded for this user & exercise today
    ;(async ()=>{
      try{
        const user = (await supabase.auth.getUser()).data?.user
        if(!user) return
        const start = new Date()
        start.setHours(0,0,0,0)
        const startISO = start.toISOString()
        const { data, error, count } = await supabase.from('workouts').select('id', { count: 'exact' }).eq('exercise', ex.title).eq('user_id', user.id).gte('performed_at', startISO)
        if(error){ console.warn('Could not fetch existing sets count', error); return }
        // if there are saved sets today, use that count; otherwise fall back to exercise default_sets
        const resolved = (count && Number(count) > 0) ? Number(count) : (ex.default_sets != null ? Number(ex.default_sets) : 0)
        setCurrentSet(resolved)
      }catch(err){ console.error('Error loading existing sets count', err) }
    })()
  }, [selected, exercises])

  return (
    <div className="p-0 flex-1 min-h-0">
      <AppBar title="Allenamento" />
      <div className="p-4 flex-1 flex flex-col">
        <h2 className="text-lg font-semibold mb-3">Esercizi — {level}</h2>

        {loading && <div className="p-3 mb-4 bg-yellow-50 text-yellow-800 rounded">Caricamento esercizi…</div>}

          {!current && (
            <ExerciseList
              exercises={exercises}
              groups={groups}
              cats={cats}
              anyMatch={anyMatch}
              filteredCats={filteredCats}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              setSelected={setSelected}
              setReps={setReps}
              setInitialSeconds={setInitialSeconds}
              preferredMinutes={preferredMinutes}
              setMessage={setMessage}
              setShowInstructions={setShowInstructions}
              setInstructionsText={setInstructionsText}
            />
          )}

        {current && (
          <div className="flex-1 overflow-auto">
            <div className="md-card p-4 rounded-xl bg-surface mb-4">
              {current.image_url && (
                <img src={current.image_url} alt={current.title} className="w-full h-40 object-contain object-center rounded-md mb-3 bg-gray-50 p-2" />
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
              <Timer key={selected} initialSeconds={initialSeconds} onComplete={handleTimerComplete} />
            </div>

            {/* Summary card: show current set number and repetitions */}
            <div className="md-card p-4 rounded-xl bg-white mb-4 shadow-sm">
              <div className="flex items-center justify-center gap-6">
                <div className="text-center">
                  <div className="text-xs text-gray-500">Serie</div>
                  <div className="text-2xl font-semibold">{currentSet}</div>
                </div>
                <div className="border-l h-10 mx-4" />
                <div className="text-center">
                  <div className="text-xs text-gray-500">Ripetizioni</div>
                  <div className="text-2xl font-semibold">{reps}</div>
                </div>
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
              <button aria-label="Indietro" className="px-4 py-2 bg-white text-gray-800 border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 flex items-center gap-2" onClick={()=>{
                const list = exercises.filter(e => (e.category || 'Generale') === (selectedCategory || (current.category || 'Generale')))
                const idx = list.findIndex(x => x.id === current.id)
                if(idx > 0){
                  const prev = list[idx-1]
                  setSelected(prev.id)
                  setReps(10)
                  setMessage(null)
                }else{
                  setSelected(null)
                }
              }}>
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
