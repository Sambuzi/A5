import React, {useState} from 'react'
import { supabase } from '../lib/supabaseClient'
import { Link, useNavigate } from 'react-router-dom'
import Logo from '../assets/logo.png'

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
    <div className="min-h-screen flex items-start justify-center bg-[var(--md-sys-color-background)] p-4 pt-16">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <img src={Logo} alt="WellGym" className="mx-auto w-24 h-24 mb-4" />
          <h1 className="text-2xl font-semibold text-gray-900">Accedi</h1>
          <p className="text-sm text-gray-600">Benvenuto su WellGym</p>
        </div>

        <form className="space-y-4" onSubmit={(e)=>{ e.preventDefault(); handleSubmit(e) }}>
          <div>
            <label className="block text-xs text-gray-600 mb-2">Email</label>
            <input className="w-full p-3 rounded-[12px] border border-transparent focus:border-transparent focus:ring-2 focus:ring-[var(--md-sys-color-primary)] bg-white/90" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-2">Password</label>
            <input type="password" className="w-full p-3 rounded-[12px] border border-transparent focus:border-transparent focus:ring-2 focus:ring-[var(--md-sys-color-primary)] bg-white/90" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />
          </div>

          {error && <div className="text-red-600">{error}</div>}

          <button type="submit" className="w-full py-3 rounded-[12px] bg-[var(--md-sys-color-primary)] text-white font-medium">Accedi</button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          <Link to="/register" className="text-[var(--md-sys-color-primary)]">Crea un account</Link>
        </div>
      </div>
    </div>
  )
}
