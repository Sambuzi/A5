import React from 'react'
import { Link, useLocation } from 'react-router-dom'

export default function BottomNav(){
  const loc = useLocation()
  const active = (p)=> loc.pathname === p
  return (
    <nav className="fixed bottom-3 left-1/2 -translate-x-1/2 bg-white shadow-lg rounded-full px-4 py-2 flex gap-6">
      <Link to="/" className={`flex flex-col items-center ${active('/')? 'text-indigo-600' : 'text-gray-500'}`}>
        <span>🏠</span>
      </Link>
      <Link to="/workout" className={`flex flex-col items-center ${active('/workout')? 'text-indigo-600' : 'text-gray-500'}`}>
        <span>💪</span>
      </Link>
      <Link to="/profile" className={`flex flex-col items-center ${active('/profile')? 'text-indigo-600' : 'text-gray-500'}`}>
        <span>👤</span>
      </Link>
    </nav>
  )
}
