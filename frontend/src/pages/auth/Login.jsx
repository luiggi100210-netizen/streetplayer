import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import { signInWithGoogle, signInWithFacebook } from '../../services/firebase'

export default function Login() {
  const { login }   = useAuth()
  const navigate    = useNavigate()
  const [form, setForm]         = useState({ email: '', password: '' })
  const [error, setError]       = useState('')
  const [cargando, setCargando] = useState(false)
  const [oauthCargando, setOauthCargando] = useState('')  // 'google' | 'facebook' | ''

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

  const handleOAuth = async (provider) => {
    setOauthCargando(provider); setError('')
    try {
      const idToken = provider === 'google'
        ? await signInWithGoogle()
        : await signInWithFacebook()
      const { data } = await api.post('/auth/firebase', { idToken })
      login(data.token, data.usuario)
      navigate('/')
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user') return
      setError(err.response?.data?.error || 'Error al iniciar sesión con ' + provider)
    } finally { setOauthCargando('') }
  }

  const ocupado = cargando || !!oauthCargando

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">

        <div className="text-center">
          <h1 className="text-4xl font-black text-[#00e676]">Street<span className="text-white">Player</span></h1>
          <p className="text-[#64748b] mt-2">La red social del deporte callejero</p>
        </div>

        <div className="bg-[#12121a] border border-[#1e1e2e] rounded-3xl p-8 space-y-5">
          <h2 className="text-xl font-bold text-white text-center">Iniciar sesión</h2>

          {/* ── OAuth ── */}
          <div className="space-y-3">
            <button
              onClick={() => handleOAuth('google')}
              disabled={ocupado}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-[#2e2e3e] bg-white/5 hover:bg-white/10 text-white text-sm font-semibold transition-all disabled:opacity-50"
            >
              {oauthCargando === 'google' ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <svg width="20" height="20" viewBox="0 0 48 48">
                  <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 2.9l5.7-5.7C34.5 6.5 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z"/>
                  <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 16.1 19 13 24 13c3.1 0 5.8 1.1 8 2.9l5.7-5.7C34.5 6.5 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
                  <path fill="#4CAF50" d="M24 44c5.5 0 10.5-2.1 14.2-5.5l-6.6-5.5C29.6 35 26.9 36 24 36c-5.3 0-9.7-3.3-11.3-8H6.1C9.4 35.6 16.3 44 24 44z"/>
                  <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.5l6.6 5.5C42.1 36 44 30.4 44 24c0-1.3-.1-2.6-.4-3.9z"/>
                </svg>
              )}
              Continuar con Google
            </button>

            <button
              onClick={() => handleOAuth('facebook')}
              disabled={ocupado}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-[#2e2e3e] bg-[#1877F2]/10 hover:bg-[#1877F2]/20 text-white text-sm font-semibold transition-all disabled:opacity-50"
            >
              {oauthCargando === 'facebook' ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2">
                  <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
                </svg>
              )}
              Continuar con Facebook
            </button>
          </div>

          {/* ── Divisor ── */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[#1e1e2e]" />
            <span className="text-xs text-[#64748b] uppercase tracking-wider">o con email</span>
            <div className="flex-1 h-px bg-[#1e1e2e]" />
          </div>

          {/* ── Formulario email/password ── */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" placeholder="tu@email.com"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <label className="label">Contraseña</label>
              <input type="password" className="input" placeholder="••••••••"
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-900/20 border border-red-800/30 rounded-xl px-4 py-3">{error}</p>
            )}

            <button type="submit" disabled={ocupado}
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
