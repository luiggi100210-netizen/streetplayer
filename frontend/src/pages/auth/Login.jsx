import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { getLastUser, clearAll } from '../../services/authStorage';
import { signInWithGoogle, signInWithFacebook } from '../../services/firebase';
import AuthShell, { Eyebrow } from '../../components/auth/AuthShell';
import { GoogleIcon, FacebookIcon, Spinner, OAuthButton, FormDivider, FormError } from '../../components/auth/ui';
import { T } from '../../styles/brand';

// ── Avatar del usuario recordado ──────────────────────────
function AvatarRecordado({ user }) {
  if (user.foto_url) {
    return (
      <img
        src={user.foto_url}
        alt={user.nombre}
        className="w-20 h-20 rounded-full object-cover border-2 border-sp-green/40"
      />
    );
  }
  return (
    <div className="w-20 h-20 rounded-full bg-sp-green/15 border-2 border-sp-green/40 flex items-center justify-center font-impact text-3xl text-sp-green">
      {user.nombre?.[0]?.toUpperCase() ?? '?'}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
export default function Login() {
  const { login }  = useAuth();
  const navigate   = useNavigate();

  // Último usuario guardado localmente
  const lastUser   = getLastUser();

  // 'recordado' si hay usuario guardado, 'normal' si no
  const [modo, setModo]                 = useState(lastUser ? 'recordado' : 'normal');
  const [form, setForm]                 = useState({ email: '', password: '' });
  const [error, setError]               = useState('');
  const [cargando, setCargando]         = useState(false);
  const [oauthCargando, setOauthCargando] = useState(''); // 'google' | 'facebook' | ''

  const ocupado = cargando || !!oauthCargando;

  // ── Handlers ──────────────────────────────────────────

  const handleOAuth = async (provider) => {
    setOauthCargando(provider); setError('');
    try {
      const idToken = provider === 'google'
        ? await signInWithGoogle()
        : await signInWithFacebook();
      const { data } = await api.post('/auth/firebase', { idToken });
      login(data.token, data.refreshToken, { ...data.usuario, provider });
      navigate('/');
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user') return;
      setError(err.response?.data?.error || 'Error al iniciar sesión con ' + provider);
    } finally { setOauthCargando(''); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true); setError('');
    try {
      const { data } = await api.post('/auth/login', form);
      login(data.token, data.refreshToken, { ...data.usuario, provider: 'email' });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión');
    } finally { setCargando(false); }
  };

  // Login con contraseña para usuario recordado (email)
  const handleSubmitRecordado = async (e) => {
    e.preventDefault();
    setCargando(true); setError('');
    try {
      const { data } = await api.post('/auth/login', {
        email:    lastUser.email,
        password: form.password,
      });
      login(data.token, data.refreshToken, { ...data.usuario, provider: 'email' });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Contraseña incorrecta');
    } finally { setCargando(false); }
  };

  const usarOtraCuenta = () => {
    clearAll(); // borra sp_last_user también
    setModo('normal');
    setError('');
  };

  // ── Render: modo RECORDADO ─────────────────────────────
  if (modo === 'recordado' && lastUser) {
    const isOAuth = lastUser.provider === 'google' || lastUser.provider === 'facebook';

    return (
      <AuthShell>
        <Eyebrow>● Bienvenido de nuevo</Eyebrow>
        <h1 className="font-impact uppercase text-4xl leading-[0.95] font-normal mb-8">
          Vuelve al <em className="italic" style={{ color: T.emerald }}>campo.</em>
        </h1>

        {/* Tarjeta del usuario recordado */}
        <div className="flex flex-col items-center gap-3 pb-7 mb-7 border-b border-white/10">
          <AvatarRecordado user={lastUser} />
          <div className="text-center">
            <p className="text-white font-bold text-lg">{lastUser.nombre}</p>
            <p className="text-white/40 text-sm">@{lastUser.username}</p>
            {lastUser.email && (
              <p className="text-white/40 text-xs mt-0.5">{lastUser.email}</p>
            )}
          </div>
          {/* Badge del proveedor */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10">
            {lastUser.provider === 'google'   && <GoogleIcon />}
            {lastUser.provider === 'facebook' && <FacebookIcon />}
            <span className="text-white/40 text-xs capitalize">{lastUser.provider}</span>
          </div>
        </div>

        {/* Acción principal */}
        {isOAuth ? (
          // Google / Facebook: un solo toque
          <OAuthButton
            provider={lastUser.provider}
            loading={!!oauthCargando}
            disabled={ocupado}
            onClick={() => handleOAuth(lastUser.provider)}
          >
            Continuar como {lastUser.nombre.split(' ')[0]}
          </OAuthButton>
        ) : (
          // Email: solo pedir contraseña
          <form onSubmit={handleSubmitRecordado} className="space-y-4">
            <div>
              <label className="label">Contraseña</label>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                autoFocus
                required
              />
            </div>
            <FormError>{error}</FormError>
            <button type="submit" disabled={ocupado} className="btn-hero">
              {cargando ? 'Ingresando...' : `Entrar como ${lastUser.nombre.split(' ')[0]}`}
            </button>
          </form>
        )}

        {isOAuth && <div className="mt-4"><FormError>{error}</FormError></div>}

        {/* Usar otra cuenta */}
        <p className="text-center text-sm text-white/40 mt-7">
          No eres {lastUser.nombre.split(' ')[0]}.{' '}
          <button onClick={usarOtraCuenta} className="text-sp-green hover:underline font-medium">
            Usar otra cuenta
          </button>
        </p>
      </AuthShell>
    );
  }

  // ── Render: modo NORMAL ────────────────────────────────
  return (
    <AuthShell>
      <Eyebrow>● Acceso</Eyebrow>
      <h1 className="font-impact uppercase text-4xl leading-[0.95] font-normal mb-2">
        Vuelve al <em className="italic" style={{ color: T.emerald }}>campo.</em>
      </h1>
      <p className="text-white/40 text-sm mb-8">Tu ranking te está esperando.</p>

      {/* OAuth */}
      <div className="space-y-3 mb-5">
        <OAuthButton
          provider="google"
          loading={oauthCargando === 'google'}
          disabled={ocupado}
          onClick={() => handleOAuth('google')}
        >
          Continuar con Google
        </OAuthButton>
        <OAuthButton
          provider="facebook"
          loading={oauthCargando === 'facebook'}
          disabled={ocupado}
          onClick={() => handleOAuth('facebook')}
        >
          Continuar con Facebook
        </OAuthButton>
      </div>

      <FormDivider>o con email</FormDivider>

      {/* Email + contraseña */}
      <form onSubmit={handleSubmit} className="space-y-4 mt-5">
        <div>
          <label className="label">Email</label>
          <input type="email" className="input" placeholder="tu@email.com"
            value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
        </div>
        <div>
          <label className="label">Contraseña</label>
          <input type="password" className="input" placeholder="••••••••"
            value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
        </div>

        <FormError>{error}</FormError>

        <button type="submit" disabled={ocupado} className="btn-hero">
          {cargando ? <span className="inline-flex items-center gap-2"><Spinner /> Ingresando...</span> : 'Entrar al campo →'}
        </button>
      </form>

      <p className="text-center text-sm text-white/40 mt-7">
        ¿No tienes cuenta?{' '}
        <Link to="/registro" className="text-sp-green hover:underline font-medium">Únete ahora</Link>
      </p>
    </AuthShell>
  );
}
