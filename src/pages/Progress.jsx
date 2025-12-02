import React, {useEffect, useState} from 'react'
import { supabase } from '../lib/supabaseClient'
import { Bar } from 'react-chartjs-2'
import { Chart, BarElement, CategoryScale, LinearScale, Tooltip } from 'chart.js'
import AppBar from '../components/AppBar'
import BottomNav from '../components/BottomNav'
import ProgressTrend from '../components/ProgressTrend'

Chart.register(BarElement, CategoryScale, LinearScale, Tooltip)

export default function Progress(){
  const [data, setData] = useState(null)

  useEffect(()=>{
    async function load(){
      const user = (await supabase.auth.getUser()).data?.user
      // sample fetch: aggregated by day (user should create proper view/table)
      const { data: rows } = await supabase.from('workouts').select('performed_at,duration')
      const week = Array.from({length:7}, ()=>0)
      const now = new Date()

      // build labels for the last 7 days (6 days ago ... today)
      const labels = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(now)
        d.setDate(now.getDate() - (6 - i))
        return d.toLocaleDateString(undefined, { weekday: 'short' })
      })

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
    <div className="p-0 flex-1 min-h-0 flex flex-col">
      <AppBar title="Progressi" />
      <div className="p-4 flex-1 overflow-auto min-h-0 pb-24">
      <h1 className="text-xl font-semibold mb-3">Progressi</h1>
      <div className="bg-white p-4 rounded shadow mb-4">
        {data ? <Bar data={data} /> : <div>Caricamento...</div>}
      </div>

      <ProgressTrend />

      </div>
      <BottomNav />
    </div>
  )
}
