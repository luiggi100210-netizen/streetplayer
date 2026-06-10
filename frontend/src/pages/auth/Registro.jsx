import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useGeolocation } from '../../hooks/useGeolocation'
import api from '../../services/api'
import { signInWithGoogle, signInWithFacebook } from '../../services/firebase'
import AuthShell, { Eyebrow } from '../../components/auth/AuthShell'
import { OAuthButton, FormDivider, FormError } from '../../components/auth/ui'
import { T } from '../../styles/brand'

const DEPORTES_DISPONIBLES = ['fútbol','básquet','voley','tenis','natación','ciclismo','running','boxeo','padel','otro']

export default function Registro() {
  const { login } = useAuth()
  const navigate  = useNavigate()
  const { coords, loading: geoLoading, solicitar: solicitarGeo } = useGeolocation()
  const [form, setForm]   = useState({ username:'', email:'', password:'', nombre:'', ciudad:'', deportes:[] })
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const [oauthCargando, setOauthCargando] = useState('')

  const handleOAuth = async (provider) => {
    setOauthCargando(provider); setError('')
    try {
      const idToken = provider === 'google'
        ? await signInWithGoogle()
        : await signInWithFacebook()
      const { data } = await api.post('/auth/firebase', { idToken })
      login(data.token, data.refreshToken, { ...data.usuario, provider })
      navigate('/')
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user') return
      setError(err.response?.data?.error || 'Error al continuar con ' + provider)
    } finally { setOauthCargando('') }
  }

  const toggleDeporte = (d) => {
    setForm(f => ({
      ...f,
      deportes: f.deportes.includes(d) ? f.deportes.filter(x => x !== d) : [...f.deportes, d]
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.deportes.length === 0) { setError('Selecciona al menos un deporte'); return }
    setCargando(true); setError('')
    try {
      const payload = { ...form, ...(coords && !form.ciudad ? { lat: coords.lat, lng: coords.lng } : {}) }
      const { data } = await api.post('/auth/registro', payload)
      login(data.token, data.refreshToken, data.usuario)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrarse')
    } finally { setCargando(false) }
  }

  const ocupado = cargando || !!oauthCargando

  return (
    <AuthShell>
      <Eyebrow>● Nuevo jugador</Eyebrow>
      <h1 className="font-impact uppercase text-4xl leading-[0.95] font-normal mb-2">
        Crea tu <em className="italic" style={{ color: T.emerald }}>leyenda.</em>
      </h1>
      <p className="text-white/40 text-sm mb-8">Tu perfil de jugador en menos de un minuto.</p>

      {/* ── OAuth: acceso rápido ── */}
      <div className="space-y-3 mb-5">
        <OAuthButton
          provider="google"
          loading={oauthCargando === 'google'}
          disabled={ocupado}
          onClick={() => handleOAuth('google')}
        >
          Registrarse con Google
        </OAuthButton>
        <OAuthButton
          provider="facebook"
          loading={oauthCargando === 'facebook'}
          disabled={ocupado}
          onClick={() => handleOAuth('facebook')}
        >
          Registrarse con Facebook
        </OAuthButton>
      </div>

      <FormDivider>o completa el formulario</FormDivider>

      <form onSubmit={handleSubmit} className="space-y-4 mt-5">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Usuario *</label>
            <input className="input" placeholder="cr7_jr" value={form.username}
              onChange={(e) => setForm({...form, username: e.target.value})} required />
          </div>
          <div>
            <label className="label">Nombre *</label>
            <input className="input" placeholder="Carlos" value={form.nombre}
              onChange={(e) => setForm({...form, nombre: e.target.value})} required />
          </div>
        </div>
        <div>
          <label className="label">Email *</label>
          <input type="email" className="input" placeholder="tu@email.com" value={form.email}
            onChange={(e) => setForm({...form, email: e.target.value})} required />
        </div>
        <div>
          <label className="label">Contraseña *</label>
          <input type="password" className="input" placeholder="Mínimo 6 caracteres" value={form.password}
            onChange={(e) => setForm({...form, password: e.target.value})} required minLength={6} />
        </div>
        <div>
          <label className="label">Ciudad</label>
          <div className="flex gap-2">
            <input className="input flex-1" placeholder="Lima, Arequipa..." value={form.ciudad}
              onChange={(e) => setForm({...form, ciudad: e.target.value})} />
            <button type="button" onClick={solicitarGeo} disabled={geoLoading}
              className="px-3 py-2 rounded-xl border border-white/10 text-white/40 hover:text-white hover:border-sp-green/50 text-sm transition-colors shrink-0"
              title="Detectar mi ciudad automáticamente">
              {geoLoading ? '...' : coords ? '✓' : '📍'}
            </button>
          </div>
          {coords && !form.ciudad && <p className="text-xs text-sp-green mt-1">Ubicación detectada — se autocompletará al registrarte</p>}
        </div>

        <div>
          <label className="label">Deportes que practicas *</label>
          <div className="flex flex-wrap gap-2 mt-1">
            {DEPORTES_DISPONIBLES.map((d) => (
              <button type="button" key={d}
                onClick={() => toggleDeporte(d)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                  form.deportes.includes(d)
                    ? 'bg-sp-green/15 border-sp-green text-sp-green-light'
                    : 'border-white/10 text-white/40 hover:border-white/25 hover:text-white/70'
                }`}>
                {d}
              </button>
            ))}
          </div>
        </div>

        <FormError>{error}</FormError>

        <button type="submit" disabled={cargando} className="btn-hero">
          {cargando ? 'Creando perfil...' : '¡Entrar a la cancha! ⚽'}
        </button>
      </form>

      <p className="text-center text-sm text-white/40 mt-7">
        ¿Ya tienes cuenta? <Link to="/login" className="text-sp-green hover:underline font-medium">Iniciar sesión</Link>
      </p>
    </AuthShell>
  )
}
