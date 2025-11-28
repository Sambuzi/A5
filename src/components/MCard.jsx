import React from 'react'

export default function MCard({children, className=''}){
  return (
    <div className={`md-card elev-1 p-4 ${className}`}>
      {children}
    </div>
  )
}
