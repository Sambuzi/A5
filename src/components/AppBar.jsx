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

        {/* secondary nav for larger screens */}
        <nav className="hidden md:flex w-full justify-center gap-6 mt-2">
          <Link to="/" className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary">
            <span className="material-symbols-outlined">home</span>
            <span>Home</span>
          </Link>

          <Link to="/workout" className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary">
            <span className="material-symbols-outlined">fitness_center</span>
            <span>Allenamento</span>
          </Link>

          <Link to="/community" className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary">
            <span className="material-symbols-outlined">chat</span>
            <span>Community</span>
          </Link>

          <Link to="/profile" className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary">
            <span className="material-symbols-outlined">person</span>
            <span>Profilo</span>
          </Link>
        </nav>
      </div>

      {/* spacer to reserve AppBar height for page content (bigger because of secondary nav on md+) */}
      <div className="h-20" aria-hidden="true" />
    </>
  )
}
