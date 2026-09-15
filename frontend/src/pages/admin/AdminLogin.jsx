import { useState } from 'react';
import axios from 'axios';
import { API_BASE } from '../../config';
import { setAdminToken } from '../../services/authStorage';

function Campo({ id, label, type, value, onChange }) {
  return (
    <div>
      <label htmlFor={id} style={{ color: '#94a3b8', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        required
        style={{
          display: 'block', width: '100%', marginTop: 6,
          background: '#13131f', border: '1px solid #1e1e2e', borderRadius: 8,
          padding: '10px 14px', color: '#fff', fontSize: 14, boxSizing: 'border-box',
          outline: 'none',
        }}
      />
    </div>
  );
}

export default function AdminLogin({ onLogin }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.post(`${API_BASE}/auth/admin/login`, form);
      setAdminToken(data.token);
      onLogin(data.token, data.admin);
    } catch (err) {
      setError(err.response?.data?.error || 'Credenciales inválidas');
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#070710',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#0d0d1a', border: '1px solid #1e1e2e',
        borderRadius: 16, padding: '40px 36px', width: '100%', maxWidth: 380,
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <p style={{ fontFamily: 'Impact, sans-serif', fontSize: 28, color: '#00e676', letterSpacing: 4 }}>
            STREETPLAYER
          </p>
          <p style={{ color: '#64748b', fontSize: 12, marginTop: 4, letterSpacing: 2, textTransform: 'uppercase' }}>
            Panel de Administración
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Campo id="admin-email" label="Email" type="email" value={form.email}
            onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
          <Campo id="admin-password" label="Contraseña" type="password" value={form.password}
            onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />

          {error && (
            <p style={{ color: '#f87171', fontSize: 13, textAlign: 'center', marginTop: 4 }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 8, padding: '12px', borderRadius: 8, border: 'none',
              background: loading ? '#1e1e2e' : '#7c3aed', color: '#fff',
              fontWeight: 700, fontSize: 14, letterSpacing: 1, cursor: loading ? 'wait' : 'pointer',
              textTransform: 'uppercase',
            }}
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}
