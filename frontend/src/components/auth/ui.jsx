/** UI compartida entre Login y Registro: OAuth, spinner, divisor y errores. */

export function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 2.9l5.7-5.7C34.5 6.5 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z"/>
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 16.1 19 13 24 13c3.1 0 5.8 1.1 8 2.9l5.7-5.7C34.5 6.5 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.5 0 10.5-2.1 14.2-5.5l-6.6-5.5C29.6 35 26.9 36 24 36c-5.3 0-9.7-3.3-11.3-8H6.1C9.4 35.6 16.3 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.5l6.6 5.5C42.1 36 44 30.4 44 24c0-1.3-.1-2.6-.4-3.9z"/>
    </svg>
  );
}

export function FacebookIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2">
      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
    </svg>
  );
}

export function Spinner() {
  return <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />;
}

export function OAuthButton({ provider, loading, disabled, onClick, children }) {
  const Icon = provider === 'google' ? GoogleIcon : FacebookIcon;
  const tint = provider === 'facebook'
    ? 'bg-[#1877F2]/10 hover:bg-[#1877F2]/20'
    : 'bg-white/5 hover:bg-white/10';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-white/10 ${tint} text-white text-sm font-semibold transition-all disabled:opacity-50`}
    >
      {loading ? <Spinner /> : <Icon />}
      {children}
    </button>
  );
}

export function FormDivider({ children }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-px bg-white/10" />
      <span className="text-[10px] text-white/40 uppercase tracking-[0.18em] font-semibold">{children}</span>
      <div className="flex-1 h-px bg-white/10" />
    </div>
  );
}

export function FormError({ children }) {
  if (!children) return null;
  return (
    <p className="text-sm text-red-400 bg-red-900/20 border border-red-800/30 rounded-xl px-4 py-3">
      {children}
    </p>
  );
}
