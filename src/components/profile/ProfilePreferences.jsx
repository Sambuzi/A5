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
  setIsPublic
}){
  return (
    <>
      <div className="bg-white p-3 rounded-md">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined">person</span>
          <div className="flex-1">
            <div className="text-sm text-gray-500">Bio</div>
            {editing ? (
              <textarea value={bioEdit} onChange={e=>setBioEdit(e.target.value)} rows={3} className="w-full mt-2 p-2 border rounded text-sm" />
            ) : (
              <div className="mt-2 text-sm text-gray-700">{profile?.bio || 'Aggiungi una breve presentazione.'}</div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white p-3 rounded-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined">timer</span>
          <div>
            <div className="text-sm text-gray-500">Durata preferita</div>
            {editing ? (
              <input type="number" min={5} value={prefDurationEdit} onChange={e=>setPrefDurationEdit(Number(e.target.value))} className="mt-1 font-medium w-24" />
            ) : (
              <div className="font-medium">{profile?.preferred_duration ?? 30} min/die</div>
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
            {editing ? (
              <input value={preferredCategoriesEdit} onChange={e=>setPreferredCategoriesEdit(e.target.value)} className="w-full mt-2 p-2 border rounded text-sm" placeholder="es. Cardio, Forza, Mobilità" />
            ) : (
              <div className="mt-2 text-sm text-gray-700">{profile?.preferred_categories || '—'}</div>
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
        {editing ? (
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={isPublic} onChange={e=>setIsPublic(Boolean(e.target.checked))} />
            <span className="text-sm text-gray-600">Visibile agli altri</span>
          </label>
        ) : (
          <div className="text-gray-400">{(profile?.is_public ?? isPublic) ? ' ' : ' '}</div>
        )}
      </div>
    </>
  )
}
