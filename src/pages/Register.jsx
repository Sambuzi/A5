import React, {useState} from 'react'
import { supabase } from '../lib/supabaseClient'
import { Link, useNavigate } from 'react-router-dom'

export default function Register(){
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  async function handleSubmit(e){
    e.preventDefault()
    setError(null)
    const { data, error } = await supabase.auth.signUp({ email, password })
    if(error) setError(error.message)
    else navigate('/')
  }

  return (
    <div className="p-4 max-w-md mx-auto w-full">
      <h1 className="text-2xl font-semibold mb-4">Registrati</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input className="w-full p-3 rounded border" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input type="password" className="w-full p-3 rounded border" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />
        {error && <div className="text-red-600">{error}</div>}
        <button className="w-full bg-indigo-600 text-white p-3 rounded">Crea account</button>
      </form>
      <div className="mt-4 text-center">
        <Link to="/login" className="text-indigo-600">Hai già un account? Accedi</Link>
      </div>
    </div>
  )
}
