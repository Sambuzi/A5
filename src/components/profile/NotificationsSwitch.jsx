import React from 'react'

export default function NotificationsSwitch({ notificationsEnabled, onToggle }){
  return (
    <div className="bg-white p-3 rounded-md flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined">notifications</span>
        <div>
          <div className="text-sm text-gray-500">Notifiche</div>
          <div className="font-medium">{notificationsEnabled ? 'Attive' : 'Disattivate'}</div>
        </div>
      </div>
      <div>
        <div
          className={`m3-switch ${notificationsEnabled ? 'on' : ''}`}
          tabIndex={0}
          role="switch"
          aria-checked={notificationsEnabled}
          onClick={(ev)=>{ ev.stopPropagation(); onToggle(!notificationsEnabled) }}
          onKeyDown={(ev)=>{ if(ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); ev.stopPropagation(); onToggle(!notificationsEnabled) } }}
        >
          <span className="thumb" aria-hidden="true"></span>
        </div>
      </div>
    </div>
  )
}
