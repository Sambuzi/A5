import React from 'react'
import { useNavigate, Link } from 'react-router-dom'

export default function AppBar({ title, showBack = true }){
  const navigate = useNavigate()
  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 w-full bg-white/90 backdrop-blur-sm border-b border-gray-100 px-4 py-3">
        <div className="flex items-center justify-between">
          {showBack ? (
            <button aria-label="Indietro" onClick={()=>navigate(-1)} className="text-gray-700 p-2 rounded-md">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
          ) : (
            <div style={{width: 40}} />
          )}

          <div className="flex-1 text-center font-semibold text-lg text-gray-800">{title ?? ''}</div>

          <button aria-label="Impostazioni" onClick={()=>navigate('/settings')} className="text-gray-700 p-2 rounded-md">
            <span className="material-symbols-outlined">settings</span>
          </button>
        </div>

        {/* secondary nav removed — keep AppBar minimal */}
      </div>

      {/* spacer to reserve AppBar height for page content */}
      <div className="h-16" aria-hidden="true" />
    </>
  )
}
