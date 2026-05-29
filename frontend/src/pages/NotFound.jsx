import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center p-4 text-center">
      <p className="text-8xl font-black text-[#00e676]">404</p>
      <p className="text-2xl font-bold text-white mt-4">Página no encontrada</p>
      <p className="text-[#64748b] mt-2 max-w-sm">
        Esta cancha no existe o fue movida a otro lugar.
      </p>
      <Link
        to="/home"
        className="mt-8 px-6 py-3 bg-[#00e676] text-[#0a0a0f] font-bold rounded-xl hover:bg-[#00c853] transition-colors"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
