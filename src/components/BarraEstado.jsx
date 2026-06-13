// Indicador visual permanente del estado de conexión y datos pendientes
export default function BarraEstado({ online, pendientes }) {
  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${
        online ? 'bg-emerald-600/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
      }`}
    >
      <span
        className={`w-2.5 h-2.5 rounded-full ${
          online ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'
        }`}
      />
      {online
        ? pendientes > 0 ? `En línea · ${pendientes} sin subir` : 'En línea ✓'
        : 'Modo Offline'}
    </div>
  );
}
