import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'

export default function Login() {
  const { login } = useAuth()
  const navigate  = useNavigate()
  const [form, setForm]   = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setCargando(true); setError('')
    try {
      const { data } = await api.post('/auth/login', form)
      login(data.token, data.usuario)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión')
    } finally { setCargando(false) }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center">
          <h1 className="text-4xl font-black text-[#00e676]">Street<span className="text-white">Player</span></h1>
          <p className="text-[#64748b] mt-2">La red social del deporte callejero</p>
        </div>

        <div className="bg-[#12121a] border border-[#1e1e2e] rounded-3xl p-8 space-y-6">
          <h2 className="text-xl font-bold text-white text-center">Iniciar sesión</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" placeholder="tu@email.com"
                value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} required />
            </div>
            <div>
              <label className="label">Contraseña</label>
              <input type="password" className="input" placeholder="••••••••"
                value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} required />
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-900/20 border border-red-800/30 rounded-xl px-4 py-3">
                {error}
              </p>
            )}

            <button type="submit" disabled={cargando}
              className="btn-green w-full py-3 text-base disabled:opacity-50">
              {cargando ? 'Ingresando...' : 'Entrar al campo 🏃'}
            </button>
          </form>

          <p className="text-center text-sm text-[#64748b]">
            ¿No tienes cuenta?{' '}
            <Link to="/registro" className="text-[#00e676] hover:underline font-medium">Únete ahora</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
