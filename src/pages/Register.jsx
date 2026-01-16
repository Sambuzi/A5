import React, {useState} from 'react'
import { supabase } from '../lib/supabaseClient'
import { Link, useNavigate } from 'react-router-dom'
// AppBar removed for register screen (minimal auth UI)
import Logo from '../assets/logo.png'

export default function Register(){
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [info, setInfo] = useState(null)
  const [pendingConfirm, setPendingConfirm] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e){
    e.preventDefault()
    setError(null)
    const { data, error } = await supabase.auth.signUp({ email, password })
    if(error) {
      setError(error.message)
      setInfo(null)
    } else {
      // supabase may require email confirmation/invite acceptance.
      // Do not navigate: show instruction to the user to accept the email invite before logging in.
      setPendingConfirm(true)
      setInfo('Abbiamo inviato un\'email di conferma al tuo indirizzo. Controlla la posta e accetta l\'invito prima di effettuare l\'accesso.')
      setError(null)
    }
  }

  return (
    <div className="min-h-screen flex items-start justify-center bg-[var(--md-sys-color-background)] p-4 pt-16">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <img src={Logo} alt="WellGym" className="mx-auto w-24 h-24 mb-4" />
          <h1 className="text-2xl font-semibold text-gray-900">Registrati</h1>
          <p className="text-sm text-gray-600">Crea il tuo account WellGym</p>
        </div>

        <form className="space-y-4" onSubmit={(e)=>{ e.preventDefault(); handleSubmit(e) }}>
          <div>
            <label className="block text-xs text-gray-600 mb-2">Email</label>
            <input disabled={pendingConfirm} className="w-full p-3 rounded-[12px] border border-transparent focus:border-transparent focus:ring-2 focus:ring-[var(--md-sys-color-primary)] bg-white/90" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-2">Password</label>
            <input disabled={pendingConfirm} type="password" className="w-full p-3 rounded-[12px] border border-transparent focus:border-transparent focus:ring-2 focus:ring-[var(--md-sys-color-primary)] bg-white/90" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />
          </div>

          {error && <div className="text-red-600">{error}</div>}

          <button disabled={pendingConfirm} type="submit" className="w-full py-3 rounded-[12px] bg-[var(--md-sys-color-primary)] text-white font-medium">Crea account</button>
        </form>

        {info && (
          <div className="mt-4 p-3 rounded-md bg-primary/10 text-sm text-gray-800">{info}</div>
        )}

        <div className="mt-6 text-center text-sm text-gray-600">
          <Link to="/login" className="text-[var(--md-sys-color-primary)]">Hai già un account? Accedi</Link>
        </div>
      </div>
    </div>
  )
}
