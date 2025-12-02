import React from 'react'
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
