import { useEffect, useState } from 'react';
import { guardarParcela } from '../lib/db';
import { obtenerPosicion } from '../lib/utils';

const inputBase =
  'mt-1.5 w-full rounded-xl bg-zinc-100/70 px-4 py-3 text-zinc-900 ' +
  'placeholder:text-zinc-400 transition focus:bg-white ' +
  'focus:ring-2 focus:ring-zinc-900 focus:outline-none';
const labelBase = 'text-xs font-medium text-zinc-500';

export default function FormParcela({ onGuardada, onCancelar }) {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [gps, setGps] = useState(null);
  const [gpsEstado, setGpsEstado] = useState('Buscando señal GPS…');
  const [guardando, setGuardando] = useState(false);

  const capturarGps = async () => {
    setGpsEstado('Buscando señal GPS…');
    try {
      const pos = await obtenerPosicion();
      setGps(pos);
      setGpsEstado(`Precisión ±${pos.precision_m ?? '?'} m`);
    } catch (e) {
      setGpsEstado(e.message);
    }
  };

  useEffect(() => { capturarGps(); }, []);

  const guardar = async () => {
    if (!nombre.trim()) return alert('Poné un nombre a la parcela.');
    setGuardando(true);
    const parcela = {
      client_id: crypto.randomUUID(),
      nombre: nombre.trim(),
      descripcion: descripcion.trim() || null,
      latitud: gps?.latitud ?? null,
      longitud: gps?.longitud ?? null,
      creado_en: new Date().toISOString(),
      synced: false
    };
    await guardarParcela(parcela);
    setGuardando(false);
    onGuardada(parcela);
  };

  return (
    <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-zinc-100">
      <h1 className="mb-5 text-2xl font-bold tracking-tight text-zinc-900">Nueva parcela</h1>

      <label className="mb-4 block">
        <span className={labelBase}>Nombre *</span>
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej: P-01 Lote Norte"
          className={inputBase}
        />
      </label>

      <label className="mb-4 block">
        <span className={labelBase}>Descripción</span>
        <textarea
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          rows={2}
          placeholder="Tipo de bosque, acceso, responsable…"
          className={`${inputBase} resize-none`}
        />
      </label>

      <div className="mb-6 rounded-2xl bg-zinc-50 p-4">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-sm font-semibold text-zinc-700">
            <span className="text-rose-500">📍</span> Centro de parcela
          </span>
          <button
            onClick={capturarGps}
            className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-zinc-600 shadow-sm transition active:scale-95"
          >
            Recapturar
          </button>
        </div>
        <p className="mt-2 font-mono text-sm text-zinc-900">
          {gps ? `${gps.latitud.toFixed(6)}, ${gps.longitud.toFixed(6)}` : '—'}
        </p>
        <p className="text-xs text-zinc-400">{gpsEstado}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onCancelar}
          className="rounded-2xl bg-zinc-100 py-3.5 text-sm font-semibold text-zinc-600 transition active:scale-[0.98]"
        >
          Cancelar
        </button>
        <button
          onClick={guardar}
          disabled={guardando}
          className="rounded-2xl bg-zinc-900 py-3.5 text-sm font-semibold text-white transition active:scale-[0.98] disabled:opacity-50"
        >
          Guardar parcela
        </button>
      </div>
    </section>
  );
}
