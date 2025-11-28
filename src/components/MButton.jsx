import React from 'react'

export default function MButton({children, variant='filled', className='', ...props}){
  const base = 'px-4 py-2 rounded-lg font-medium transition'
  const filled = 'bg-primary text-white'
  const outlined = 'bg-transparent border border-gray-200 text-gray-800'
  const ghost = 'bg-transparent text-gray-700'
  const cls = `${base} ${variant==='filled'?filled: variant==='outlined'?outlined:ghost} ${className}`
  return <button className={cls} {...props}>{children}</button>
}
