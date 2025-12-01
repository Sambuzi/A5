import React from 'react'
import { Link } from 'react-router-dom'

export default function ProfilePreferences({ 
  profile, 
  editing, 
  bioEdit, 
  setBioEdit, 
  editingField, 
  setEditingField, 
  updateProfileField 
}){ 
  return (
    <>
      <div className="bg-white p-3 rounded-md">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined">person</span>
          <div className="flex-1">
            <div className="text-sm text-gray-500">Bio</div>
            {editing || editingField === 'bio' ? (
              <div className="mt-2">
                <textarea value={bioEdit} onChange={e=>setBioEdit(e.target.value)} rows={3} className="w-full mt-2 p-2 border rounded text-sm" />
                {editingField === 'bio' && (
                  <div className="flex gap-2 mt-2">
                    <button className="px-3 py-1 bg-primary text-white rounded text-sm" onClick={async (ev)=>{ ev.stopPropagation(); try{ await updateProfileField('bio', bioEdit); setEditingField(null) }catch(e){ console.error(e) } }}>Salva</button>
                    <button className="px-3 py-1 bg-gray-100 rounded text-sm" onClick={(ev)=>{ ev.stopPropagation(); setEditingField(null); setBioEdit(profile?.bio || '') }}>Annulla</button>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-2 text-sm text-gray-700" role="button" tabIndex={0} onClick={()=>setEditingField('bio')}>{profile?.bio || 'Aggiungi una breve presentazione.'}</div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
