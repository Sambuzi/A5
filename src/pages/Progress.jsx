import React, {useEffect, useState} from 'react'
import { supabase } from '../lib/supabaseClient'
import { Bar } from 'react-chartjs-2'
import { Chart, BarElement, CategoryScale, LinearScale, Tooltip } from 'chart.js'
import AppBar from '../components/AppBar'
import BottomNav from '../components/BottomNav'

Chart.register(BarElement, CategoryScale, LinearScale, Tooltip)

export default function Progress(){
  const [data, setData] = useState(null)

  useEffect(()=>{
    async function load(){
      const user = (await supabase.auth.getUser()).data?.user
      // sample fetch: aggregated by day (user should create proper view/table)
      const { data: rows } = await supabase.from('workouts').select('performed_at,duration')
      const week = Array.from({length:7}, ()=>0)
      const labels = ['Lun','Mar','Mer','Gio','Ven','Sab','Dom']
      const now = new Date()
      rows?.forEach(r=>{
        const d = new Date(r.performed_at)
        const diff = Math.floor((now - d) / (1000*60*60*24))
        if(diff < 7) week[6-diff] += (r.duration || 0)/60
      })
      setData({ labels, datasets:[{ label:'Ore allenamento (ultimi 7 giorni)', data: week, backgroundColor:'#4f46e5' }] })
    }
    load()
  },[])

  return (
    <div className="p-0 flex-1 min-h-0">
      <AppBar title="Progressi" />
      <div className="p-4">
      <h1 className="text-xl font-semibold mb-3">Progressi</h1>
      <div className="bg-white p-4 rounded shadow mb-4">
        {data ? <Bar data={data} /> : <div>Caricamento...</div>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-3 rounded shadow">
          <div className="text-sm text-gray-500">Proteine</div>
          <div className="font-semibold">120 g</div>
        </div>
        <div className="bg-white p-3 rounded shadow">
          <div className="text-sm text-gray-500">Carboidrati</div>
          <div className="font-semibold">240 g</div>
        </div>
        <div className="bg-white p-3 rounded shadow">
          <div className="text-sm text-gray-500">Grassi</div>
          <div className="font-semibold">60 g</div>
        </div>
        <div className="bg-white p-3 rounded shadow">
          <div className="text-sm text-gray-500">Acqua</div>
          <div className="font-semibold">2.5 L</div>
        </div>
      </div>

      <div className="mt-4 bg-white p-4 rounded shadow">
        <div className="text-sm text-gray-500">Calorie</div>
        <div className="text-lg font-semibold">1200 / 2000 restanti</div>
      </div>

      </div>
      <BottomNav />
    </div>
  )
}
