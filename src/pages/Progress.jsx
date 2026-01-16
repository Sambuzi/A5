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
  const [summary, setSummary] = useState(null)

  useEffect(()=>{
    async function load(){
      const user = (await supabase.auth.getUser()).data?.user
      // sample fetch: aggregated by day (user should create proper view/table)
      // only fetch current user's workouts and limit to last 7 days to match the trend table
      const since = new Date(Date.now() - (6 * 24 * 60 * 60 * 1000)).toISOString()
      const { data: rows } = await supabase.from('workouts').select('performed_at,duration').eq('user_id', user?.id).gte('performed_at', since)
      const week = Array.from({length:7}, ()=>0)
      const now = new Date()

      // build labels for the last 7 days (6 days ago ... today)
      const labels = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(now)
        d.setDate(now.getDate() - (6 - i))
        return d.toLocaleDateString(undefined, { weekday: 'short' })
      })

      // compute start-of-day millis for today once (local timezone)
      const msDay = 1000 * 60 * 60 * 24
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()

      rows?.forEach(r=>{
        const d = new Date(r.performed_at)
        const startOfR = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
        const diff = Math.round((startOfToday - startOfR) / msDay)
        if(diff < 7 && diff >= 0) week[6-diff] += (r.duration || 0)/60
      })

      const total = week.reduce((s,n)=>s+n,0)
      const avg = +(total / 7).toFixed(2)
      const max = Math.max(...week)
      const maxIndex = week.indexOf(max)
      setSummary({ total: +total.toFixed(2), avg, bestDay: labels[maxIndex], bestValue: max })

      setData({ labels, datasets:[{ label:'Ore allenamento (ultimi 7 giorni)', data: week, backgroundColor:'#7c3aed', borderRadius:8, barThickness: 28, borderSkipped: false }] })
    }
    load()
  },[])

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.parsed.y.toFixed(1)} ore`
        }
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#6b7280' } },
      y: { beginAtZero: true, grid: { color: '#f3f4f6' }, ticks: { color: '#6b7280' } }
    },
    elements: { bar: { borderRadius: 8 } },
    animation: { duration: 600 }
  }

  return (
    <div className="p-0 flex-1 min-h-0 flex flex-col">
      <AppBar title="Progressi" />
      <div className="p-4 flex-1 overflow-auto min-h-0 pb-24">
      <h1 className="text-xl font-semibold mb-3">Progressi</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div className="p-4 rounded-lg bg-white shadow">
          <div className="text-xs text-gray-500">Ore totali (7 giorni)</div>
          <div className="text-2xl font-semibold">{summary ? summary.total : '—'}</div>
          <div className="text-sm text-gray-500">Media {summary ? summary.avg : '—'} ore/g</div>
        </div>
        <div className="p-4 rounded-lg bg-white shadow">
          <div className="text-xs text-gray-500">Giorno migliore</div>
          <div className="text-2xl font-semibold">{summary ? summary.bestDay : '—'}</div>
          <div className="text-sm text-gray-500">{summary ? `${summary.bestValue.toFixed(1)} ore` : '—'}</div>
        </div>
        <div className="p-4 rounded-lg bg-white shadow flex flex-col justify-between">
          <div>
            <div className="text-xs text-gray-500">Obiettivo settimanale</div>
            <div className="text-2xl font-semibold">{/* placeholder */}—</div>
          </div>
          <div className="text-sm text-gray-500 mt-2">Imposta il tuo obiettivo nel profilo</div>
        </div>
      </div>

      <div className="bg-white p-4 rounded shadow mb-4">
        {data ? (
          <div className="h-56 md:h-44 lg:h-36">
            <Bar data={data} options={options} />
          </div>
        ) : <div>Caricamento...</div>}
      </div>

      <ProgressTrend />

      </div>
      <BottomNav />
    </div>
  )
}
