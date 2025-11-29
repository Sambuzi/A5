import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function AppBar({ title }){
  const navigate = useNavigate()
  return (
    <div className="w-full bg-white/90 backdrop-blur-sm border-b border-gray-100 px-4 py-3 flex items-center justify-between">
      <button aria-label="Indietro" onClick={()=>navigate(-1)} className="text-gray-700 p-2 rounded-md">
        <span className="material-symbols-outlined">arrow_back</span>
      </button>

      <div className="flex-1 text-center font-semibold text-lg text-gray-800">{title ?? ''}</div>

      <button aria-label="Impostazioni" onClick={()=>navigate('/settings')} className="text-gray-700 p-2 rounded-md">
        <span className="material-symbols-outlined">settings</span>
      </button>
    </div>
  )
}
