import React, {useState, useEffect} from 'react'
import { supabase } from '../lib/supabaseClient'
import BottomNav from '../components/BottomNav'

export default function Profile(){
  const [profile, setProfile] = useState({ level: 'Neofita', goal: '30 min/die' })

  async function logout(){
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div className="p-4 flex-1">
      <h1 className="text-xl font-semibold mb-3">Profilo</h1>
      <div className="bg-white p-4 rounded shadow mb-3">
        <div className="text-sm text-gray-500">Livello</div>
        <div className="font-semibold">{profile.level}</div>
      </div>

      <div className="bg-white p-4 rounded shadow mb-3">
        <div className="text-sm text-gray-500">Obiettivo giornaliero</div>
        <div className="font-semibold">{profile.goal}</div>
      </div>

      <div className="mt-6">
        <button className="px-4 py-2 bg-red-500 text-white rounded" onClick={logout}>Logout</button>
      </div>

      <BottomNav />
    </div>
  )
}
