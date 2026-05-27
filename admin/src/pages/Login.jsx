import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const [form, setForm] = useState({ username: '', password: '' });
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError('');
    try {
      await login(form.username, form.password);
    } catch (err) {
      setError(err.response?.data?.error || 'Credenciales incorrectas');
    }
    setCargando(false);
  };

  return (
    <div className="min-h-screen bg-sp-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-sp-green">StreetPlayer</h1>
          <p className="text-gray-400 mt-2">Panel de Administracion</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          <div>
            <label className="label">Usuario</label>
            <input
              value={form.username}
              onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
              className="input w-full"
              placeholder="admin"
              autoFocus
            />
          </div>
          <div>
            <label className="label">Contrasena</label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              className="input w-full"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <button type="submit" disabled={cargando} className="btn-green w-full">
            {cargando ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}
