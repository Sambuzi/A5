import React from 'react'
import NotificationsSwitch from './NotificationsSwitch'

export default function ProfileDetails({
  profile,
  editingField,
  setEditingField,
  levelEdit,
  setLevelEdit,
  goalEdit,
  setGoalEdit,
  updateProfileField,
  notificationsEnabled,
  setNotificationsEnabled
}){
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
                                }catch(e){ console.error(e) }
                                setEditingField(null)
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

      <div role="button" onClick={()=>{ if(!editingField) { setEditingField('goal'); setGoalEdit(profile?.goal ?? goalEdit) } }} className="bg-white p-3 rounded-md flex items-center justify-between cursor-pointer">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined">schedule</span>
          <div>
            <div className="text-sm text-gray-500">Obiettivo giornaliero</div>
            {editingField === 'goal' ? (
              <div className="flex items-center gap-2">
                <input value={goalEdit} onChange={e=>setGoalEdit(e.target.value)} className="font-medium" />
                <button onClick={(ev)=>{ ev.stopPropagation(); updateProfileField('goal', goalEdit) }} className="px-2 py-1 bg-primary text-white rounded text-sm">Salva</button>
                <button onClick={(ev)=>{ ev.stopPropagation(); setEditingField(null); setGoalEdit(profile?.goal ?? goalEdit) }} className="px-2 py-1 bg-gray-100 rounded text-sm">Annulla</button>
              </div>
            ) : (
              <div className="font-medium">{profile?.goal ?? '30 min/die'}</div>
            )}
          </div>
        </div>
        <div className="text-gray-400">{editingField === 'goal' ? '' : '>'}</div>
      </div>

      <NotificationsSwitch
        notificationsEnabled={notificationsEnabled}
        onToggle={async (val) => {
          setNotificationsEnabled(val)
          try{ await updateProfileField('notifications', val) }catch(e){ /* handled by parent */ }
        }}
      />

      <div className="bg-white p-3 rounded-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined">settings</span>
          <div>
            <div className="text-sm text-gray-500">Impostazioni account</div>
            <div className="font-medium">Password, privacy</div>
          </div>
        </div>
        <div className="text-gray-400">&gt;</div>
      </div>
    </div>
  )
}
