import React, {useState} from 'react'
import { supabase } from '../lib/supabaseClient'
import { Link, useNavigate } from 'react-router-dom'

export default function Login(){
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  async function handleSubmit(e){
    e.preventDefault()
    setError(null)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if(error) setError(error.message)
    else navigate('/')
  }

  return (
    <div className="p-4 max-w-md mx-auto w-full">
      <div className="mb-4 text-center">
        <h1 className="text-2xl font-semibold">Accedi</h1>
        <p className="text-sm text-gray-500">Benvenuto su WellGym</p>
      </div>

      <div className="space-y-3">
        <label className="text-xs text-gray-600">Email</label>
        <input className="w-full p-3 rounded-lg border border-gray-200" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />

        <label className="text-xs text-gray-600">Password</label>
        <input type="password" className="w-full p-3 rounded-lg border border-gray-200" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />

        {error && <div className="text-red-600">{error}</div>}

        <div className="mt-2">
          <button onClick={handleSubmit} className="w-full bg-primary text-white p-3 rounded-lg">Accedi</button>
        </div>
      </div>

      <div className="mt-4 text-center">
        <Link to="/register" className="text-primary">Crea un account</Link>
      </div>
    </div>
  )
}
