import React from 'react'
import BottomNav from '../components/BottomNav'
import AppBar from '../components/AppBar'

export default function Settings(){
  return (
    <div className="p-0 flex-1 min-h-0">
      <AppBar title="Impostazioni" />
      <div className="p-4">
      <h1 className="text-xl font-semibold mb-3">Impostazioni</h1>
      <div className="bg-white p-4 rounded shadow">
        <div className="text-sm text-gray-500">Ancora nulla qui — qui andranno le impostazioni dell'app.</div>
      </div>
      </div>
      <BottomNav />
    </div>
  )
}
