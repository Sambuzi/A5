import React from 'react'
import { Link } from 'react-router-dom'
import BottomNav from '../components/BottomNav'

export default function Home(){
  return (
    <div className="p-4 flex-1 bg-gray-50 min-h-screen">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">WellGym</h1>
        <p className="text-sm text-gray-600">Allenati ovunque, salva i progressi</p>
      </header>

      <div className="grid gap-4">
        <Link to="/workout" className="p-4 bg-white rounded-2xl elev-1 flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Avvia Allenamento</h2>
            <p className="text-sm text-gray-500">Esegui esercizi guidati</p>
          </div>
          <div className="text-primary">▶️</div>
        </Link>

        <Link to="/progress" className="p-4 bg-white rounded-2xl elev-1 flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Progressi</h2>
            <p className="text-sm text-gray-500">Grafici e statistiche</p>
          </div>
          <div className="text-primary">📈</div>
        </Link>

        <Link to="/profile" className="p-4 bg-white rounded-2xl elev-1 flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Profilo</h2>
            <p className="text-sm text-gray-500">Gestisci obiettivi e impostazioni</p>
          </div>
          <div className="text-primary">⚙️</div>
        </Link>
      </div>
    </div>
  )
}
