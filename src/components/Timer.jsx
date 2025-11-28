import React, {useEffect, useRef, useState} from 'react'

export default function Timer({initial=30, onComplete}){
  const [seconds, setSeconds] = useState(initial)
  const [running, setRunning] = useState(false)
  const ref = useRef(null)

  useEffect(()=>{
    if(running){
      ref.current = setInterval(()=>{
        setSeconds(s=>{
          if(s<=1){
            clearInterval(ref.current)
            setRunning(false)
            onComplete && onComplete()
            return 0
          }
          return s-1
        })
      }, 1000)
    }
    return ()=> clearInterval(ref.current)
  },[running])

  return (
    <div className="p-4 bg-white rounded shadow text-center">
      <div className="text-4xl font-mono">{Math.floor(seconds/60)}:{String(seconds%60).padStart(2,'0')}</div>
      <div className="mt-3 flex gap-2 justify-center">
        <button className="px-4 py-2 bg-gray-200 rounded" onClick={()=>setRunning(r=>!r)}>{running? 'Pausa' : 'Avvia'}</button>
        <button className="px-4 py-2 bg-red-500 text-white rounded" onClick={()=>{ setSeconds(initial); setRunning(false); }}>Reset</button>
      </div>
    </div>
  )
}
