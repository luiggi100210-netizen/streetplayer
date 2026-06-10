import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import AuthShell, { Eyebrow } from '../../components/auth/AuthShell';
import { FormError } from '../../components/auth/ui';
import { T } from '../../styles/brand';

/**
 * Recuperación de contraseña en dos pasos:
 *  1. email            → POST /auth/forgot (envía código de 6 dígitos)
 *  2. código + nueva   → POST /auth/reset  (valida y cambia)
 */
export default function RecuperarPassword() {
  const navigate = useNavigate();
  const [paso, setPaso]         = useState(1);
  const [form, setForm]         = useState({ email: '', codigo: '', password: '' });
  const [error, setError]       = useState('');
  const [aviso, setAviso]       = useState('');
  const [cargando, setCargando] = useState(false);

  const set = (campo) => (e) => setForm(f => ({ ...f, [campo]: e.target.value }));

  const pedirCodigo = async (e) => {
    e.preventDefault();
    setCargando(true); setError(''); setAviso('');
    try {
      const { data } = await api.post('/auth/forgot', { email: form.email });
      setAviso(data.mensaje);
      setPaso(2);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.errors?.[0]?.mensaje || 'No se pudo enviar el código');
    } finally { setCargando(false); }
  };

  const cambiarPassword = async (e) => {
    e.preventDefault();
    setCargando(true); setError('');
    try {
      await api.post('/auth/reset', form);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.errors?.[0]?.mensaje || 'No se pudo cambiar la contraseña');
    } finally { setCargando(false); }
  };

  return (
    <AuthShell>
      <Eyebrow>● Recuperar acceso</Eyebrow>
      <h1 className="font-impact uppercase text-4xl leading-[0.95] font-normal mb-2">
        Recupera tu <em className="italic" style={{ color: T.emerald }}>cuenta.</em>
      </h1>

      {paso === 1 ? (
        <>
          <p className="text-white/40 text-sm mb-8">
            Escribe tu email y te enviaremos un código de 6 dígitos.
          </p>
          <form onSubmit={pedirCodigo} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" placeholder="tu@email.com"
                value={form.email} onChange={set('email')} autoFocus required />
            </div>
            <FormError>{error}</FormError>
            <button type="submit" disabled={cargando} className="btn-hero">
              {cargando ? 'Enviando...' : 'Enviar código →'}
            </button>
          </form>
        </>
      ) : (
        <>
          <p className="text-white/40 text-sm mb-2">
            Revisa la bandeja de <span className="text-white/70">{form.email}</span>.
          </p>
          {aviso && <p className="text-xs text-sp-green mb-6">{aviso} Vence en 15 minutos.</p>}
          <form onSubmit={cambiarPassword} className="space-y-4">
            <div>
              <label className="label">Código de 6 dígitos</label>
              <input
                inputMode="numeric" maxLength={6} className="input text-center tracking-[0.5em] text-lg font-bold"
                placeholder="••••••"
                value={form.codigo} onChange={set('codigo')} autoFocus required
              />
            </div>
            <div>
              <label className="label">Nueva contraseña</label>
              <input type="password" className="input" placeholder="Mínimo 6 caracteres"
                value={form.password} onChange={set('password')} minLength={6} required />
            </div>
            <FormError>{error}</FormError>
            <button type="submit" disabled={cargando} className="btn-hero">
              {cargando ? 'Cambiando...' : 'Cambiar contraseña'}
            </button>
          </form>
          <p className="text-center text-sm text-white/40 mt-5">
            ¿No llegó el código?{' '}
            <button onClick={() => { setPaso(1); setError(''); }} className="text-sp-green hover:underline font-medium">
              Reenviar
            </button>
          </p>
        </>
      )}

      <p className="text-center text-sm text-white/40 mt-7">
        <Link to="/login" className="text-sp-green hover:underline font-medium">← Volver a iniciar sesión</Link>
      </p>
    </AuthShell>
  );
}
