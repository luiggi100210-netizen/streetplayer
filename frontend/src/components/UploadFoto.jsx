import { useRef, useState } from 'react';
import api from '../services/api';

const STATIC_BASE = import.meta.env.VITE_BACKEND_URL || '';

export default function UploadFoto({ value, onChange, label = 'Foto', rounded = false, size = 96 }) {
  const inputRef           = useRef(null);
  const [subiendo, setSubiendo] = useState(false);
  const [error,    setError]    = useState('');

  const handleFile = async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSubiendo(true);
    setError('');
    try {
      const form = new FormData();
      form.append('foto', file);
      const { data } = await api.post('/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onChange(STATIC_BASE + data.url);
    } catch {
      setError('No se pudo subir. Máx 5 MB (JPG, PNG, WebP).');
    }
    setSubiendo(false);
    e.target.value = '';
  };

  const radius = rounded ? '50%' : 8;

  return (
    <div>
      {label && <label className="label">{label}</label>}
      <div
        onClick={() => !subiendo && inputRef.current?.click()}
        className="relative cursor-pointer border-2 border-dashed border-sp-border hover:border-sp-green transition-colors overflow-hidden"
        style={{ width: size, height: size, borderRadius: radius, background: '#0a0a0a', flexShrink: 0 }}
      >
        {value ? (
          <img src={value} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-1 text-sp-muted px-2 text-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-[9px] font-bold uppercase tracking-wider leading-tight">
              {subiendo ? 'Subiendo...' : 'Subir foto'}
            </span>
          </div>
        )}
        {subiendo && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-sp-green border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
      {error && <p className="text-red-400 text-[11px] mt-1">{error}</p>}
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp"
        onChange={handleFile} className="hidden" />
    </div>
  );
}
