import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useGeolocation } from '../../hooks/useGeolocation'
import api from '../../services/api'

const DEPORTES_DISPONIBLES = ['fútbol','básquet','voley','tenis','natación','ciclismo','running','boxeo','padel','otro']

export default function Registro() {
  const { login } = useAuth()
  const navigate  = useNavigate()
  const { coords, loading: geoLoading, solicitar: solicitarGeo } = useGeolocation()
  const [form, setForm]   = useState({ username:'', email:'', password:'', nombre:'', ciudad:'', deportes:[] })
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

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
      login(data.token, data.usuario)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrarse')
    } finally { setCargando(false) }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4 py-10">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-black text-[#00e676]">Street<span className="text-white">Player</span></h1>
          <p className="text-[#64748b] mt-2">Crea tu perfil de jugador</p>
        </div>

        <div className="bg-[#12121a] border border-[#1e1e2e] rounded-3xl p-8 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
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
                  className="px-3 py-2 rounded-xl border border-[#1e1e2e] text-[#64748b] hover:text-white text-sm transition-colors shrink-0"
                  title="Detectar mi ciudad automáticamente">
                  {geoLoading ? '...' : coords ? '✓' : '📍'}
                </button>
              </div>
              {coords && !form.ciudad && <p className="text-xs text-[#00e676] mt-1">Ubicación detectada — se autocompletará al registrarte</p>}
            </div>

            <div>
              <label className="label">Deportes que practicas *</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {DEPORTES_DISPONIBLES.map((d) => (
                  <button type="button" key={d}
                    onClick={() => toggleDeporte(d)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                      form.deportes.includes(d)
                        ? 'bg-[#00e676]/20 border-[#00e676] text-[#00e676]'
                        : 'border-[#1e1e2e] text-[#64748b] hover:border-[#2e2e3e]'
                    }`}>
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-900/20 border border-red-800/30 rounded-xl px-4 py-3">{error}</p>
            )}

            <button type="submit" disabled={cargando} className="btn-green w-full py-3 text-base disabled:opacity-50">
              {cargando ? 'Creando perfil...' : '¡Entrar a la cancha! ⚽'}
            </button>
          </form>

          <p className="text-center text-sm text-[#64748b]">
            ¿Ya tienes cuenta? <Link to="/login" className="text-[#00e676] hover:underline font-medium">Iniciar sesión</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
