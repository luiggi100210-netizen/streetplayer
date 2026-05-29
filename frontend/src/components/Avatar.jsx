export default function Avatar({ foto, username, size = 40, color = '#1D9E75' }) {
  return foto ? (
    <img
      src={foto}
      alt=""
      style={{
        width: size, height: size, borderRadius: '50%',
        objectFit: 'cover', border: `2px solid ${color}`, flexShrink: 0,
      }}
    />
  ) : (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: color + '22', border: `2px solid ${color}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Anton, Impact, sans-serif', fontSize: size * 0.38, color,
    }}>
      {username?.[0]?.toUpperCase()}
    </div>
  );
}
