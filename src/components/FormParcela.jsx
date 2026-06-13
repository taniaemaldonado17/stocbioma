import { useEffect, useState } from 'react';
import { guardarParcela } from '../lib/db';
import { obtenerPosicion } from '../lib/utils';

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
    <section className="bg-white rounded-xl border border-zinc-200 p-4">
      <h1 className="text-2xl font-bold text-slate-800 mb-4">Nueva parcela</h1>

      <label className="block mb-4">
        <span className="font-semibold text-slate-700">Nombre *</span>
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej: P-01 Lote Norte"
          className="mt-1 w-full rounded-lg border-2 border-zinc-300 p-3 focus:border-emerald-600 outline-none"
        />
      </label>

      <label className="block mb-4">
        <span className="font-semibold text-slate-700">Descripción</span>
        <textarea
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          rows={2}
          placeholder="Tipo de bosque, acceso, responsable…"
          className="mt-1 w-full rounded-lg border-2 border-zinc-300 p-3 focus:border-emerald-600 outline-none"
        />
      </label>

      <div className="mb-6 bg-zinc-100 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-700">📍 Centro de parcela</span>
          <button onClick={capturarGps} className="text-emerald-700 font-bold text-sm">
            Recapturar
          </button>
        </div>
        <p className="font-mono text-sm text-slate-800 mt-1">
          {gps ? `${gps.latitud.toFixed(6)}, ${gps.longitud.toFixed(6)}` : '—'}
        </p>
        <p className="text-xs text-slate-500">{gpsEstado}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onCancelar}
          className="py-4 rounded-xl bg-zinc-200 text-slate-700 font-bold active:bg-zinc-300"
        >
          Cancelar
        </button>
        <button
          onClick={guardar}
          disabled={guardando}
          className="py-4 rounded-xl bg-emerald-600 text-white font-bold active:bg-emerald-700 disabled:opacity-60"
        >
          Guardar parcela
        </button>
      </div>
    </section>
  );
}
