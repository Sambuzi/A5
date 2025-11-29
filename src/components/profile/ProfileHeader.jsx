import React from 'react'

export default function ProfileHeader({
  profile,
  editing,
  nameEdit,
  setNameEdit,
  onAvatarClick,
  fileInputRef,
  previewUrl,
  onFileChange,
  onSave,
  saving,
  onCancelEdit,
  onEdit,
}){
  const displayName = profile?.name || 'Utente'
  const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=EDE9FE&color=5B21B6&size=128`

  return (
    <div className="md-card p-4 mb-4 flex flex-wrap items-center gap-4">
      <div className="relative">
        <div onClick={onAvatarClick} className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-2xl text-gray-700 overflow-hidden cursor-pointer">
          <img src={previewUrl || profile?.avatar_url || defaultAvatar} alt="avatar" className="w-full h-full object-cover" />
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
      </div>

      <div className="flex-1">
        {editing ? (
          <input value={nameEdit} onChange={e=>setNameEdit(e.target.value)} className="text-lg font-semibold w-full p-1 border-b" />
        ) : (
          <div className="text-lg font-semibold">{profile?.name ?? displayName}</div>
        )}

        <div className="text-sm text-gray-500 flex items-center gap-2"><span className="material-symbols-outlined text-sm">email</span>{profile?.email ?? ''}</div>
        <div className="text-sm text-gray-500 mt-1">Iscritto: {profile?.joined ? new Date(profile.joined).toLocaleDateString() : '-'}</div>
      </div>

      <div className="w-full sm:w-auto">
        {editing ? (
          <div className="flex flex-col sm:flex-row gap-2 items-end">
            <button onClick={onSave} disabled={saving} className="px-3 py-2 bg-primary text-white rounded-md">{saving ? 'Salvataggio...' : 'Salva'}</button>
            <button onClick={onCancelEdit} className="px-3 py-2 bg-gray-100 rounded-md">Annulla</button>
          </div>
        ) : (
          <button onClick={onEdit} className="px-3 py-2 bg-gray-100 rounded-md flex items-center gap-2" disabled={false}>
            <span className="material-symbols-outlined">edit</span>
            <span className="text-sm">Modifica</span>
          </button>
        )}
      </div>
    </div>
  )
}
