// Estados compartidos de listas filtradas (Eventos, Torneos): mensaje de
// error y grilla de placeholders mientras carga.

export function ErrorText({ children }) {
  if (!children) return null;
  return <p className="text-xs text-red-400 text-center">{children}</p>;
}

export function SkeletonGrid({ count = 6, height = 280 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} style={{ height, borderRadius: 12, background: 'rgba(255,255,255,0.03)', animation: 'pulse 1.5s ease-in-out infinite' }} />
      ))}
    </div>
  );
}
