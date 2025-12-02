import React, { createContext, useContext, useCallback, useState, useEffect } from 'react'

const ToastContext = createContext(null)

export function useToasts(){
  return useContext(ToastContext)
}

let nextId = 1

export default function ToastProvider({ children }){
  const [toasts, setToasts] = useState([])

  const addToast = useCallback(({ title, message, duration = 5000, type = 'default' }) =>{
    const id = nextId++
    setToasts(t => [...t, { id, title, message, type }])
    if(duration > 0){
      setTimeout(()=>{
        setToasts(t => t.filter(x => x.id !== id))
      }, duration)
    }
    return id
  }, [])

  const removeToast = useCallback((id) => setToasts(t => t.filter(x => x.id !== id)), [])

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}

      {/* Toast container */}
      <div aria-live="polite" className="fixed right-4 bottom-20 z-50 flex flex-col gap-2 items-end">
        {toasts.map(t => (
          <div key={t.id} className="max-w-xs w-full bg-white border p-3 rounded shadow-md">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <div className="font-semibold text-sm">{t.title}</div>
                {t.message && <div className="text-xs text-gray-600 mt-1">{t.message}</div>}
              </div>
              <button aria-label="Close" className="text-gray-400 text-sm" onClick={()=>removeToast(t.id)}>✕</button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
