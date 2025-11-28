import React, {useState} from 'react'
import Timer from '../components/Timer'
import { supabase } from '../lib/supabaseClient'
import BottomNav from '../components/BottomNav'

export default function Workout(){
  const [exercise] = useState({ title: 'Allenamento Gambe - Squat', image: 'https://images.unsplash.com/photo-1558611848-73f7eb4001d7?q=80&w=800&auto=format&fit=crop&ixlib=rb-4.0.3&s=abcd' })
  const [reps, setReps] = useState(10)
  const [message, setMessage] = useState(null)

  async function saveCompleted(durationSec){
    try{
      const user = (await supabase.auth.getUser()).data?.user
      await supabase.from('workouts').insert([{ user_id: user?.id || null, exercise: exercise.title, duration: durationSec, reps, performed_at: new Date() }])
      setMessage('Esercizio salvato')
    }catch(e){
      setMessage('Errore salvataggio')
    }
  }

  return (
    <div className="p-4 flex-1">
      <div className="mb-4">
        <button onClick={()=>window.history.back()} className="text-gray-600">◀ Indietro</button>
      </div>

      <h2 className="text-xl font-semibold">{exercise.title}</h2>
      <img src={exercise.image} alt="exercise" className="w-full h-48 object-cover rounded mt-3 mb-3" />

      <div className="mb-3">
        <button className="px-3 py-2 bg-white rounded shadow">Istruzioni</button>
      </div>

      <Timer initial={45} onComplete={()=>saveCompleted(45)} />

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

      <div className="mt-6">
        <button className="px-4 py-2 bg-indigo-600 text-white rounded" onClick={()=>saveCompleted(0)}>Segna completato</button>
      </div>

      <BottomNav />
    </div>
  )
}
