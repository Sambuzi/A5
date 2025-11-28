import React from 'react'
import { Link } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import logoUrl from '../assets/wellgym-logo.svg'

export default function Home(){
  return (
    <div className="p-4 flex-1 min-h-screen" style={{background: 'var(--md-sys-color-background)'}}>
      <header className="mb-6">
        <div className="app-title app-header">
          <div className="logo-badge" aria-hidden>
            <img src={logoUrl} alt="WellGym" style={{width:48, height:48, borderRadius:12}} />
          </div>
          <div>
            <div className="title-text">WellGym</div>
            <div className="title-sub">Allenati ovunque, salva i progressi</div>
          </div>
        </div>
      </header>

      <div className="grid gap-4">
        <Link to="/workout" className="md-card p-4 rounded-[16px] elev-1 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">play_arrow</span>
            </div>
            <div>
              <h2 className="font-semibold">Avvia Allenamento</h2>
              <p className="text-sm text-gray-500">Esegui esercizi guidati</p>
            </div>
          </div>
          <div className="text-gray-400"><span className="material-symbols-outlined">chevron_right</span></div>
        </Link>

        <Link to="/progress" className="md-card p-4 rounded-[16px] elev-1 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">trending_up</span>
            </div>
            <div>
              <h2 className="font-semibold">Progressi</h2>
              <p className="text-sm text-gray-500">Grafici e statistiche</p>
            </div>
          </div>
          <div className="text-gray-400"><span className="material-symbols-outlined">chevron_right</span></div>
        </Link>

        <Link to="/profile" className="md-card p-4 rounded-[16px] elev-1 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">person</span>
            </div>
            <div>
              <h2 className="font-semibold">Profilo</h2>
              <p className="text-sm text-gray-500">Gestisci obiettivi e impostazioni</p>
            </div>
          </div>
          <div className="text-gray-400"><span className="material-symbols-outlined">chevron_right</span></div>
        </Link>
      </div>

      <BottomNav />
    </div>
  )
}
