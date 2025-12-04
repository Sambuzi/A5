import React, { useEffect, useState, useRef } from 'react'

export default function Timer({ initialSeconds = 45, onComplete }){
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
            onComplete && onComplete(seconds)
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
