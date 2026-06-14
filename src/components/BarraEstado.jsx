// Indicador de conexión y datos pendientes, como píldora minimalista
export default function BarraEstado({ online, pendientes }) {
  return (
    <div
      className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold backdrop-blur ${
        online
          ? 'bg-white/10 text-emerald-300'
          : 'bg-amber-400/15 text-amber-300'
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${
          online ? 'bg-emerald-400' : 'animate-pulse bg-amber-400'
        }`}
      />
      {online
        ? pendientes > 0 ? `En línea · ${pendientes} sin subir` : 'En línea'
        : 'Modo Offline'}
    </div>
  );
}
