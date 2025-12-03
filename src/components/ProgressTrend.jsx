import React, { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import useProfile from '../hooks/useProfile'

function formatDate(dt){
  try{ return new Date(dt).toLocaleString() }catch(e){ return dt }
}

function downloadCSV(rows, filename = 'progress.csv'){
  if(!rows || rows.length === 0) return
  const keys = Object.keys(rows[0])
  const csv = [keys.join(',')].concat(rows.map(r => keys.map(k => `"${String(r[k] ?? '')}"`).join(','))).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export default function ProgressTrend(){
  const [rangeDays, setRangeDays] = useState(30)
  const [workouts, setWorkouts] = useState([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState({ field: 'performed_at', dir: 'desc' })

  useEffect(()=>{
    let mounted = true
    async function load(){
      setLoading(true)
      try{
        const user = (await supabase.auth.getUser()).data?.user
        if(!user){ if(mounted) setWorkouts([]); return }
        const since = new Date(Date.now() - (rangeDays * 24 * 60 * 60 * 1000)).toISOString()
        const { data, error } = await supabase.from('workouts').select('id, exercise, duration, reps, performed_at, calories, weight_used').eq('user_id', user.id).gte('performed_at', since).order('performed_at', { ascending: false })
        if(error) throw error
        if(!mounted) return
        setWorkouts(data || [])
      }catch(e){ console.error('Error loading progress workouts', e); if(mounted) setWorkouts([]) }
      finally{ if(mounted) setLoading(false) }
    }
    load()
    return ()=>{ mounted = false }
  }, [rangeDays])

  const { profile } = useProfile()

  const totals = useMemo(()=>{
    const totalSessions = workouts.length
    const totalMinutes = Math.round((workouts.reduce((s,w)=>s+(w.duration||0),0))/60)
    const totalCalories = Math.round(workouts.reduce((s,w)=>s+(w.calories||0),0) || 0)
    const avgCalories = totalSessions ? Math.round(totalCalories / totalSessions) : 0
    return { totalSessions, totalMinutes, totalCalories, avgCalories }
  }, [workouts])

  // Compute simulated macro grams from burned calories using user's goals as split
  const macroSimulation = useMemo(()=>{
    const pGoal = Number(profile?.protein_goal ?? 100)
    const cGoal = Number(profile?.carbs_goal ?? 250)
    const fGoal = Number(profile?.fats_goal ?? 70)
    const wGoal = Number(profile?.water_goal ?? 2)

    const kcalProtein = pGoal * 4
    const kcalCarbs = cGoal * 4
    const kcalFats = fGoal * 9
    const totalGoalKcal = kcalProtein + kcalCarbs + kcalFats

    let pctP = 0.2, pctC = 0.5, pctF = 0.3
    if(totalGoalKcal > 0){
      pctP = kcalProtein / totalGoalKcal
      pctC = kcalCarbs / totalGoalKcal
      pctF = kcalFats / totalGoalKcal
    }

    const burned = totals.totalCalories
    const burnedProteinG = Math.round((burned * pctP) / 4)
    const burnedCarbsG = Math.round((burned * pctC) / 4)
    const burnedFatsG = Math.round((burned * pctF) / 9)
    const burnedWaterL = +(burned / 500).toFixed(2) // heuristic: 1L per 500 kcal

    const pctDoneProtein = pGoal ? Math.round((burnedProteinG / pGoal) * 100) : 0
    const pctDoneCarbs = cGoal ? Math.round((burnedCarbsG / cGoal) * 100) : 0
    const pctDoneFats = fGoal ? Math.round((burnedFatsG / fGoal) * 100) : 0
    const pctDoneWater = wGoal ? Math.round((burnedWaterL / wGoal) * 100) : 0

    return {
      pGoal, cGoal, fGoal, wGoal,
      burnedProteinG, burnedCarbsG, burnedFatsG, burnedWaterL,
      pctDoneProtein, pctDoneCarbs, pctDoneFats, pctDoneWater
    }
  }, [totals, profile])

  function changeSort(field){
    setSort(s => {
      if(s.field === field) return { field, dir: s.dir === 'asc' ? 'desc' : 'asc' }
      return { field, dir: 'asc' }
    })
  }

  const sorted = useMemo(()=>{
    const arr = [...workouts]
    arr.sort((a,b)=>{
      const f = sort.field
      const av = a[f] ?? ''
      const bv = b[f] ?? ''
      if(av === bv) return 0
      if(sort.dir === 'asc') return av > bv ? 1 : -1
      return av < bv ? 1 : -1
    })
    return arr
  }, [workouts, sort])

  return (
    <div className="mt-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {/** Proteine */}
        <div className="bg-white p-3 rounded shadow">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">Proteine</div>
              <div className="font-semibold text-lg">{macroSimulation.burnedProteinG} g</div>
            </div>
            <div className="text-right text-xs text-gray-500">Goal<br />{macroSimulation.pGoal} g</div>
          </div>
          <div className="mt-3">
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div aria-hidden className={`h-2 ${macroSimulation.pctDoneProtein >= 100 ? 'bg-green-500' : 'bg-primary'}`} style={{ width: `${Math.min(macroSimulation.pctDoneProtein, 200)}%` }} />
            </div>
            <div className="mt-2 text-xs text-gray-600">{macroSimulation.pctDoneProtein}% of goal</div>
          </div>
        </div>

        {/** Carboidrati */}
        <div className="bg-white p-3 rounded shadow">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">Carboidrati</div>
              <div className="font-semibold text-lg">{macroSimulation.burnedCarbsG} g</div>
            </div>
            <div className="text-right text-xs text-gray-500">Goal<br />{macroSimulation.cGoal} g</div>
          </div>
          <div className="mt-3">
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div aria-hidden className={`h-2 ${macroSimulation.pctDoneCarbs >= 100 ? 'bg-green-500' : 'bg-primary'}`} style={{ width: `${Math.min(macroSimulation.pctDoneCarbs, 200)}%` }} />
            </div>
            <div className="mt-2 text-xs text-gray-600">{macroSimulation.pctDoneCarbs}% of goal</div>
          </div>
        </div>

        {/** Grassi */}
        <div className="bg-white p-3 rounded shadow">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">Grassi</div>
              <div className="font-semibold text-lg">{macroSimulation.burnedFatsG} g</div>
            </div>
            <div className="text-right text-xs text-gray-500">Goal<br />{macroSimulation.fGoal} g</div>
          </div>
          <div className="mt-3">
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div aria-hidden className={`h-2 ${macroSimulation.pctDoneFats >= 100 ? 'bg-green-500' : 'bg-primary'}`} style={{ width: `${Math.min(macroSimulation.pctDoneFats, 200)}%` }} />
            </div>
            <div className="mt-2 text-xs text-gray-600">{macroSimulation.pctDoneFats}% of goal</div>
          </div>
        </div>

        {/** Acqua */}
        <div className="bg-white p-3 rounded shadow">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">Acqua</div>
              <div className="font-semibold text-lg">{macroSimulation.burnedWaterL} L</div>
            </div>
            <div className="text-right text-xs text-gray-500">Goal<br />{macroSimulation.wGoal} L</div>
          </div>
          <div className="mt-3">
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div aria-hidden className={`h-2 ${macroSimulation.pctDoneWater >= 100 ? 'bg-green-500' : 'bg-primary'}`} style={{ width: `${Math.min(macroSimulation.pctDoneWater, 200)}%` }} />
            </div>
            <div className="mt-2 text-xs text-gray-600">{macroSimulation.pctDoneWater}% of goal</div>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded shadow max-h-[60vh] overflow-auto">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-sm text-gray-500">Trend allenamenti</div>
            <div className="font-medium">Dettagli allenamenti</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs text-gray-500">Intervallo</div>
            <div className="flex gap-1">
              {[7,30,90].map(d => (
                <button key={d} onClick={()=>setRangeDays(d)} className={`px-2 py-1 rounded text-sm ${rangeDays===d ? 'bg-primary text-white' : 'bg-gray-100'}`}>{d}g</button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-3 text-sm text-gray-500">Caricamento…</div>
        ) : (
          <div>
            <div className="mb-3 text-sm text-gray-600">{totals.totalSessions} sessioni • {totals.totalMinutes} min • {totals.totalCalories} kcal • avg {totals.avgCalories} kcal/sessione</div>

            <div className="overflow-auto max-w-full">
              <table className="min-w-[720px] w-full text-sm whitespace-nowrap">
                <thead>
                  <tr className="text-left text-xs text-gray-500">
                    <th className="pb-2 cursor-pointer" onClick={()=>changeSort('performed_at')}>Data {sort.field==='performed_at' ? (sort.dir==='asc' ? '↑' : '↓') : ''}</th>
                    <th className="pb-2 cursor-pointer" onClick={()=>changeSort('exercise')}>Esercizio {sort.field==='exercise' ? (sort.dir==='asc' ? '↑' : '↓') : ''}</th>
                    <th className="pb-2">Min</th>
                    <th className="pb-2">Rip.</th>
                    <th className="pb-2 cursor-pointer" onClick={()=>changeSort('calories')}>kcal {sort.field==='calories' ? (sort.dir==='asc' ? '↑' : '↓') : ''}</th>
                    <th className="pb-2">Peso</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.length === 0 && <tr><td colSpan={6} className="py-3 text-gray-600">Nessuna sessione in questo intervallo.</td></tr>}
                  {sorted.map(w => (
                    <tr key={w.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="py-2">{formatDate(w.performed_at)}</td>
                      <td className="py-2">{w.exercise}</td>
                      <td className="py-2">{Math.round((w.duration||0)/60)}</td>
                      <td className="py-2">{w.reps ?? '-'}</td>
                      <td className="py-2">{w.calories ?? '-'}</td>
                      <td className="py-2">{w.weight_used ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
