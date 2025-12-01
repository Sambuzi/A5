import React from 'react'

export default function ProfilePreferences({ 
  profile, 
  editing, 
  bioEdit, 
  setBioEdit, 
  prefDurationEdit, 
  setPrefDurationEdit, 
  preferredCategoriesEdit, 
  setPreferredCategoriesEdit, 
  isPublic, 
  setIsPublic, 
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

      <div className="bg-white p-3 rounded-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined">timer</span>
          <div>
            <div className="text-sm text-gray-500">Durata preferita</div>
            {editing || editingField === 'preferred_duration' ? (
              <div className="mt-1">
                <input type="number" min={5} value={prefDurationEdit} onChange={e=>setPrefDurationEdit(Number(e.target.value))} className="font-medium w-24" />
                {editingField === 'preferred_duration' && (
                  <div className="flex gap-2 mt-2">
                    <button className="px-3 py-1 bg-primary text-white rounded text-sm" onClick={async (ev)=>{ ev.stopPropagation(); try{ await updateProfileField('preferred_duration', Number(prefDurationEdit) || 30); setEditingField(null) }catch(e){ console.error(e) } }}>Salva</button>
                    <button className="px-3 py-1 bg-gray-100 rounded text-sm" onClick={(ev)=>{ ev.stopPropagation(); setEditingField(null); setPrefDurationEdit(profile?.preferred_duration || 30) }}>Annulla</button>
                  </div>
                )}
              </div>
            ) : (
              <div className="font-medium" role="button" tabIndex={0} onClick={()=>setEditingField('preferred_duration')}>{profile?.preferred_duration ?? 30} min/die</div>
            )}
          </div>
        </div>
        <div className="text-gray-400">{editing ? '' : '>'}</div>
      </div>

      <div className="bg-white p-3 rounded-md">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined">category</span>
          <div className="flex-1">
            <div className="text-sm text-gray-500">Categorie preferite</div>
            {editing || editingField === 'preferred_categories' ? (
              <div className="mt-2">
                <input value={preferredCategoriesEdit} onChange={e=>setPreferredCategoriesEdit(e.target.value)} className="w-full mt-2 p-2 border rounded text-sm" placeholder="es. Cardio, Forza, Mobilità" />
                {editingField === 'preferred_categories' && (
                  <div className="flex gap-2 mt-2">
                    <button className="px-3 py-1 bg-primary text-white rounded text-sm" onClick={async (ev)=>{ ev.stopPropagation(); try{ await updateProfileField('preferred_categories', preferredCategoriesEdit || ''); setEditingField(null) }catch(e){ console.error(e) } }}>Salva</button>
                    <button className="px-3 py-1 bg-gray-100 rounded text-sm" onClick={(ev)=>{ ev.stopPropagation(); setEditingField(null); setPreferredCategoriesEdit(profile?.preferred_categories || '') }}>Annulla</button>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-2 text-sm text-gray-700" role="button" tabIndex={0} onClick={()=>setEditingField('preferred_categories')}>{profile?.preferred_categories || '—'}</div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white p-3 rounded-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined">visibility</span>
          <div>
            <div className="text-sm text-gray-500">Visibilità profilo</div>
            <div className="font-medium">{(profile?.is_public ?? isPublic) ? 'Pubblico' : 'Privato'}</div>
          </div>
        </div>
        {editing || editingField === 'is_public' ? (
          <div>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={isPublic} onChange={e=>setIsPublic(Boolean(e.target.checked))} />
              <span className="text-sm text-gray-600">Visibile agli altri</span>
            </label>
            {editingField === 'is_public' && (
              <div className="flex gap-2 mt-2">
                <button className="px-3 py-1 bg-primary text-white rounded text-sm" onClick={async (ev)=>{ ev.stopPropagation(); try{ await updateProfileField('is_public', Boolean(isPublic)); setEditingField(null) }catch(e){ console.error(e) } }}>Salva</button>
                <button className="px-3 py-1 bg-gray-100 rounded text-sm" onClick={(ev)=>{ ev.stopPropagation(); setEditingField(null); setIsPublic(Boolean(profile?.is_public)) }}>Annulla</button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-gray-400" role="button" tabIndex={0} onClick={()=>setEditingField('is_public')}>{(profile?.is_public ?? isPublic) ? ' ' : ' '}</div>
        )}
      </div>
    </>
  )
}
