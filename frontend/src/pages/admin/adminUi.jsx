// Estilos y componentes compartidos entre las vistas del panel admin
// (antes duplicados idénticamente en Admin.jsx, AdminAuditoria.jsx y AdminConfig.jsx).

export const inputS = { display: 'block', width: '100%', marginTop: 5, background: '#13131f', border: '1px solid #1e1e2e', borderRadius: 8, padding: '8px 12px', color: '#fff', fontSize: 13, boxSizing: 'border-box', outline: 'none' };
export const labelS = { color: '#94a3b8', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 };

export function Btn({ children, onClick, color = '#7c3aed', danger, small, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ padding: small ? '3px 9px' : '6px 14px', borderRadius: 6, border: 'none', fontSize: small ? 10 : 12, fontWeight: 700, cursor: disabled ? 'default' : 'pointer', background: danger ? '#ef444422' : color + '22', color: danger ? '#f87171' : color, opacity: disabled ? 0.5 : 1 }}>
      {children}
    </button>
  );
}
