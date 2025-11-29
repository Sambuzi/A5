import React from 'react'
import { Link } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import logoUrl from '../assets/logo.png'

export default function Home() {
  return (
    <div 
      className="flex flex-col p-5 min-h-screen"
      style={{ background: 'var(--md-sys-color-background)' }}
    >
    <header className="mb-10">
      <div className="flex items-center gap-4">
        <div className="rounded-2xl p-2 elev-2 bg-surface-variant w-24 h-24 flex items-center justify-center overflow-hidden">
          <img
            src={logoUrl}
            alt="WellGym"
            className="w-full h-full object-contain rounded-xl"
          />
        </div>

        <div className="ml-1">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight" style={{ color: '#000' }}>
            WellGym
          </h1>
          <p className="mt-2 text-sm sm:text-base" style={{ color: 'rgba(0,0,0,0.78)' }}>
            Allenati ovunque, salva i progressi
          </p>
          <div className="mt-3">
            <span className="inline-block px-3 py-1 text-xs font-medium rounded-full" style={{ background: 'rgba(79,70,229,0.08)', color: '#000' }}>
              Mobile-first
            </span>
          </div>
        </div>
      </div>
    </header>


      <div className="grid gap-5">
        <Link 
          to="/workout" 
          className="md-card p-5 rounded-[20px] elev-2 flex items-center justify-between bg-surface"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-primary/15 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-3xl">play_arrow</span>
            </div>
            <div>
              <h2 className="title-medium font-semibold">Avvia Allenamento</h2>
              <p className="body-small text-secondary">Esercizi guidati e personalizzati</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-secondary">chevron_right</span>
        </Link>

        <Link 
          to="/progress" 
          className="md-card p-5 rounded-[20px] elev-2 flex items-center justify-between bg-surface"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-primary/15 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-3xl">trending_up</span>
            </div>
            <div>
              <h2 className="title-medium font-semibold">Progressi</h2>
              <p className="body-small text-secondary">Grafici, statistiche e miglioramenti</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-secondary">chevron_right</span>
        </Link>

        <Link 
          to="/profile" 
          className="md-card p-5 rounded-[20px] elev-2 flex items-center justify-between bg-surface"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-primary/15 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-3xl">person</span>
            </div>
            <div>
              <h2 className="title-medium font-semibold">Profilo</h2>
              <p className="body-small text-secondary">Obiettivi, impostazioni e dati personali</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-secondary">chevron_right</span>
        </Link>
      </div>

      <BottomNav />
    </div>
  )
}
