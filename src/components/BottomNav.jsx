import React from 'react'
import { Link, useLocation } from 'react-router-dom'

export default function BottomNav(){
  const loc = useLocation()
  const active = (p)=> loc.pathname === p

  return (
    <nav className="fixed left-1/2 -translate-x-1/2 bottom-4 z-40 sm:bottom-6">
      <div className="flex items-center gap-6 px-4 py-2 rounded-full bg-white elev-2" style={{minWidth: 320}}>
        <Link to="/" aria-label="Home" className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-full ${active('/')? 'text-primary' : 'text-gray-500'}`}>
          <span className="material-symbols-outlined text-xl leading-none">home</span>
          <span className="text-xs">Home</span>
        </Link>

        <Link to="/workout" aria-label="Workout" className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-full ${active('/workout')? 'text-primary' : 'text-gray-500'}`}>
          <span className="material-symbols-outlined text-xl leading-none">fitness_center</span>
          <span className="text-xs">Allenamento</span>
        </Link>

        <Link to="/profile" aria-label="Profile" className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-full ${active('/profile')? 'text-primary' : 'text-gray-500'}`}>
          <span className="material-symbols-outlined text-xl leading-none">person</span>
          <span className="text-xs">Profilo</span>
        </Link>
      </div>
    </nav>
  )
}
