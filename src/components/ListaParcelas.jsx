export default function ListaParcelas({ parcelas, onAbrir, onNueva }) {
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-slate-800">Parcelas de muestreo</h1>
      </div>

      <button
        onClick={onNueva}
        className="w-full mb-4 py-4 rounded-xl bg-emerald-600 text-white text-lg font-bold active:bg-emerald-700"
      >
        ＋ Nueva parcela
      </button>

      {parcelas.length === 0 && (
        <div className="bg-white rounded-xl border border-zinc-200 p-6 text-center text-slate-600">
          <p className="text-4xl mb-2">🌲</p>
          <p className="font-semibold">Todavía no hay parcelas.</p>
          <p className="text-sm mt-1">
            Creá la primera con el botón de arriba. Todo se guarda en el
            teléfono, con o sin señal.
          </p>
        </div>
      )}

      <ul className="space-y-3">
        {parcelas.map((p) => (
          <li key={p.client_id}>
            <button
              onClick={() => onAbrir(p)}
              className="w-full text-left bg-white rounded-xl border border-zinc-200 p-4 active:bg-zinc-50"
            >
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-slate-800">{p.nombre}</span>
                <span
                  className={`text-xs font-bold px-2 py-1 rounded-full ${
                    p.synced ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {p.synced ? 'Sincronizada' : 'Pendiente'}
                </span>
              </div>
              {p.descripcion && (
                <p className="text-sm text-slate-600 mt-1">{p.descripcion}</p>
              )}
              {p.latitud != null && (
                <p className="text-xs text-slate-500 mt-1 font-mono">
                  {p.latitud.toFixed(5)}, {p.longitud.toFixed(5)}
                </p>
              )}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
