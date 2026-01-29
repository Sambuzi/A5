import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useToasts } from '../../components/ToastProvider'

export default function ProfileDetails({
  profile,
  editingField,
  setEditingField,
  levelEdit,
  setLevelEdit,
  goalEdit,
  setGoalEdit,
  updateProfileField,
}){
  const { addToast } = useToasts()
  const [selectedPreset, setSelectedPreset] = useState('')

  // presets definition (value, label)
  const PRESETS = [
    { id: '15m', value: '15 min/die', label: '15m' },
    { id: '30m', value: '30 min/die', label: '30m' },
    { id: '45m', value: '45 min/die', label: '45m' },
    { id: '60m', value: '60 min/die', label: '60m' },
    { id: '1h', value: '1 ore', label: '1h' }
  ]

  useEffect(()=>{
    if(editingField === 'goal'){
      const raw = String(profile?.goal || '').toLowerCase()
      // map profile.goal to a preset id if possible
      const found = PRESETS.find(p => raw.includes(String(p.value).split(' ')[0]))
      if(found) setSelectedPreset(found.id)
      else setSelectedPreset('')
    }
  }, [editingField, profile])
  return (
    <div className="space-y-3">
      <div role="button" onClick={()=>{ if(!editingField) { setEditingField('level'); setLevelEdit(profile?.level ?? levelEdit) } }} className="bg-white p-3 rounded-md flex items-center justify-between cursor-pointer">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined">fitness_center</span>
          <div>
            <div className="text-sm text-gray-500">Livello</div>
                {editingField === 'level' ? (
                  <div className="relative">
                    <div className="font-medium">{profile?.level ?? 'Neofita'}</div>
                    <div className="absolute left-0 mt-2 w-56 z-50">
                      <div className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden">
                        <div role="menu" aria-label="Seleziona livello" className="py-1">
                          {['Neofita','Intermedio','Avanzato'].map(l => (
                            <button
                              key={l}
                              role="menuitem"
                              onClick={async (ev)=>{ 
                                ev.stopPropagation();
                                try{
                                  await updateProfileField('level', l)
                                  addToast({ title: 'Salvato', message: `Livello aggiornato a ${l}`, type: 'default' })
                                  setEditingField(null)
                                }catch(e){ 
                                  console.error(e)
                                  addToast({ title: 'Errore', message: 'Impossibile salvare il livello', type: 'default' })
                                }
                              }}
                              className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between hover:bg-gray-50 ${profile?.level === l ? 'bg-gray-50 font-medium' : ''}`}
                            >
                              <span>{l}</span>
                              {profile?.level === l && (
                                <span className="material-symbols-outlined text-primary">check</span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  ) : (
                  <div className="font-medium">{profile?.level ?? 'Neofita'}</div>
                )}
          </div>
        </div>
        <div className="text-gray-400">{editingField === 'level' ? '' : '>'}</div>
      </div>

      {/* Obiettivo giornaliero rimosso su richiesta */}

      <div role="button" onClick={() => { if(!editingField) { setEditingField('goal'); setGoalEdit(profile?.goal ?? goalEdit) } }} className="bg-white p-3 rounded-md flex items-center justify-between cursor-pointer">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined">schedule</span>
          <div>
            <div className="text-sm text-gray-500">Obiettivo</div>
            {editingField === 'goal' ? (
              <div className="mt-2">
                <div className="flex gap-2 items-center">
                  {PRESETS.map(p => (
                    <button key={p.id} type="button" onClick={(ev)=>{ ev.stopPropagation(); setSelectedPreset(p.id) }} className={`px-3 py-1 rounded text-sm ${selectedPreset === p.id ? 'bg-primary text-white' : 'bg-gray-100'}`}>
                      {p.label}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2 mt-2">
                  <button className={`px-3 py-1 ${selectedPreset ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500 cursor-not-allowed'} rounded text-sm`} disabled={!selectedPreset} onClick={async (ev)=>{ ev.stopPropagation(); if(!selectedPreset) return; try{ const preset = PRESETS.find(x=>x.id===selectedPreset); if(!preset) return; await updateProfileField('goal', preset.value); setEditingField(null); addToast?.({ title: 'Salvato', message: 'Obiettivo aggiornato' }) }catch(e){ console.error(e); addToast?.({ title: 'Errore', message: 'Impossibile salvare obiettivo' }) } }}>Salva</button>
                  <button className="px-3 py-1 bg-gray-100 rounded text-sm" onClick={(ev)=>{ ev.stopPropagation(); setEditingField(null); setSelectedPreset('') }}>Annulla</button>
                </div>
              </div>
            ) : (
              <div className="font-medium">{profile?.goal || 'Non impostato'}</div>
            )}
          </div>
        </div>
        <div className="text-gray-400">{editingField === 'goal' ? '' : '>'}</div>
      </div>

      <div className="bg-white p-3 rounded-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined">settings</span>
          <div>
            <div className="text-sm text-gray-500">Impostazioni account</div>
            <div className="font-medium">Password, privacy</div>
          </div>
        </div>
        <div>
          <Link to="/settings" className="text-primary">Apri impostazioni</Link>
        </div>
      </div>
    </div>
  )
}
