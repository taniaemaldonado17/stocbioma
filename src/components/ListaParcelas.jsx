export default function ListaParcelas({ parcelas, onAbrir, onNueva }) {
  return (
    <section>
      <h1 className="mb-5 text-3xl font-bold tracking-tight text-zinc-900">Parcelas</h1>

      <button
        onClick={onNueva}
        className="mb-5 w-full rounded-2xl bg-zinc-900 py-4 text-base font-semibold text-white transition active:scale-[0.98]"
      >
        ＋ Nueva parcela
      </button>

      {parcelas.length === 0 && (
        <div className="rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-zinc-100">
          <p className="mb-3 text-4xl">🌲</p>
          <p className="font-semibold text-zinc-900">Todavía no hay parcelas</p>
          <p className="mt-1.5 text-sm leading-relaxed text-zinc-500">
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
              className="w-full rounded-2xl bg-white p-4 text-left shadow-sm ring-1 ring-zinc-100 transition active:scale-[0.99]"
            >
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold tracking-tight text-zinc-900">{p.nombre}</span>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    p.synced ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  {p.synced ? 'Sincronizada' : 'Pendiente'}
                </span>
              </div>
              {p.descripcion && (
                <p className="mt-1 text-sm text-zinc-500">{p.descripcion}</p>
              )}
              {p.latitud != null && (
                <p className="mt-1.5 font-mono text-xs text-zinc-400">
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
