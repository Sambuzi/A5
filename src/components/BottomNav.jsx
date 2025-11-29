import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

export default function BottomNav(){
  const loc = useLocation()
  const navigate = useNavigate()
  const active = (p)=> loc.pathname === p

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-t border-gray-100">
      <div className="mx-auto max-w-[360px] w-full px-4 py-2 flex items-center justify-around">
        <Link to="/" aria-label="Home" className={`flex flex-col items-center justify-center gap-1 px-3 py-1 rounded-md ${active('/')? 'text-primary' : 'text-gray-500'}`} aria-current={active('/')? 'page' : undefined}>
          <span className="material-symbols-outlined text-xl leading-none">home</span>
          <span className="text-xs">Home</span>
        </Link>

        <Link to="/workout" aria-label="Allenamento" className={`flex flex-col items-center justify-center gap-1 px-3 py-1 rounded-md ${active('/workout')? 'text-primary' : 'text-gray-500'}`} aria-current={active('/workout')? 'page' : undefined}>
          <span className="material-symbols-outlined text-xl leading-none">fitness_center</span>
          <span className="text-xs">Allenamento</span>
        </Link>

        <Link to="/profile" aria-label="Profilo" className={`flex flex-col items-center justify-center gap-1 px-3 py-1 rounded-md ${active('/profile')? 'text-primary' : 'text-gray-500'}`} aria-current={active('/profile')? 'page' : undefined}>
          <span className="material-symbols-outlined text-xl leading-none">person</span>
          <span className="text-xs">Profilo</span>
        </Link>
      </div>
    </nav>
  )
}
