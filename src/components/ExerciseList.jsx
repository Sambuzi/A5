import React from 'react'

export default function ExerciseList({
  exercises,
  groups,
  cats,
  anyMatch,
  filteredCats,
  selectedCategory,
  setSelectedCategory,
  setSelected,
  setReps,
  setInitialSeconds,
  preferredMinutes,
  setMessage,
  setShowInstructions,
  setInstructionsText
}){
  return (
    <div className="flex-1 overflow-auto">
      {!selectedCategory && (
        <div className="space-y-3">
          {(() => {
            if(cats.length === 0) return <div className="p-4 bg-white rounded-md text-center text-gray-600">Nessun esercizio disponibile per questo livello.</div>

            const displayCats = anyMatch ? filteredCats : cats
            return (
              <>
                {!anyMatch && (
                  <div className="text-xs text-gray-400">(Nessuna tipologia raggiunge i {preferredMinutes} min, vengono mostrati tutti i risultati)</div>
                )}
                {displayCats.map(cat => {
                  const totalMinutes = (groups[cat] || []).reduce((sum, ex) => sum + (ex.default_duration != null ? Number(ex.default_duration) : preferredMinutes), 0)
                  return (
                    <button key={cat} onClick={()=>{
                      const first = groups[cat]?.[0]
                      setSelectedCategory(cat)
                      if(first){
                        setSelected(first.id)
                        setReps(10)
                        const durMin = (first.default_duration ?? preferredMinutes)
                        setInitialSeconds(durMin * 60)
                        setMessage(null)
                      }
                    }} className="w-full text-left md-card p-4 rounded-xl bg-surface flex items-center justify-between">
                      <div>
                        <div className="font-semibold">{cat}</div>
                        <div className="text-sm text-gray-600 mt-1">{groups[cat].length} esercizi · {Math.round(totalMinutes)} min</div>
                      </div>
                      <div className="text-sm text-primary">Apri</div>
                    </button>
                  )
                })}
              </>
            )
          })()}
        </div>
      )}

      {selectedCategory && (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold text-lg">{selectedCategory}</div>
            <button className="text-sm text-primary" onClick={()=>setSelectedCategory(null)}>Indietro</button>
          </div>

          {exercises.filter(e => (e.category || 'Generale') === selectedCategory).map(ex => (
            <div key={ex.id} className="w-full md-card p-4 rounded-xl bg-surface flex items-center justify-between">
              <button type="button" onClick={()=>{ setSelected(ex.id); setReps(10); setMessage(null); const durMin = (ex.default_duration ?? preferredMinutes); setInitialSeconds(durMin * 60); }} className="flex-1 text-left flex items-center gap-3">
                <div className="flex items-center gap-3">
                  {ex.image_url ? (
                    <img src={ex.image_url} alt={ex.title} className="w-16 h-12 object-contain object-center rounded-md bg-gray-100 p-1" />
                  ) : (
                    <div className="w-16 h-12 bg-gray-100 rounded-md flex items-center justify-center text-xs text-gray-400">No img</div>
                  )}
                  <div>
                    <div className="font-semibold">{ex.title}</div>
                    <div className="text-sm text-gray-600 mt-1">{ex.description}</div>
                    <div className="text-xs text-gray-500 mt-1">Serie: <span className="font-medium">{ex.default_sets ?? '-'}</span> · Ripetizioni: <span className="font-medium">{ex.default_reps ?? '-'}</span></div>
                  </div>
                </div>
              </button>
              <div className="flex flex-col items-end ml-3">
                <button type="button" className="text-sm text-primary mb-2" onClick={(ev)=>{ ev.stopPropagation(); setInstructionsText(ex.description || 'Nessuna istruzione disponibile.'); setShowInstructions(true); }}>Istruzioni</button>
                <button type="button" className="text-sm text-primary" onClick={()=>{ setSelected(ex.id); setReps(10); setMessage(null); const durMin = (ex.default_duration ?? preferredMinutes); setInitialSeconds(durMin * 60); }}>Avvia</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
