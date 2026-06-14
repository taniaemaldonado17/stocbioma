import { useEffect, useState } from 'react';
import { guardarArbol } from '../lib/db';
import { obtenerPosicion } from '../lib/utils';

const ESTADOS = ['Sano', 'Enfermo', 'Plaga', 'Muerto en pie'];
const RIESGOS = ['Bajo', 'Medio', 'Alto'];

const VACIO = {
  especie: '', dap_cm: '', ht_m: '', hf_m: '', dc_m: '',
  estado_fitosanitario: 'Sano', riesgo: 'Bajo', notas: ''
};

// Clases base reutilizables (estética premium de la referencia)
const inputBase =
  'mt-1.5 w-full rounded-xl bg-zinc-100/70 px-4 py-3 text-zinc-900 ' +
  'placeholder:text-zinc-400 transition focus:bg-white ' +
  'focus:ring-2 focus:ring-zinc-900 focus:outline-none';
const labelBase = 'text-xs font-medium text-zinc-500';

// inputMode="decimal" abre el teclado numérico en iOS y Android
function CampoNumerico({ etiqueta, unidad, valor, onChange }) {
  return (
    <label className="block">
      <span className={labelBase}>
        {etiqueta} <span className="text-zinc-400">· {unidad}</span>
      </span>
      <input
        type="text"
        inputMode="decimal"
        value={valor}
        onChange={(e) => onChange(e.target.value.replace(',', '.'))}
        placeholder="0.0"
        className={`${inputBase} font-mono text-lg`}
      />
    </label>
  );
}

export default function FormArbol({ parcela, numeroSiguiente, onGuardado }) {
  const [f, setF] = useState(VACIO);
  const [gps, setGps] = useState(null);
  const [gpsEstado, setGpsEstado] = useState('Buscando señal GPS…');
  const [guardando, setGuardando] = useState(false);

  const set = (campo) => (valor) => setF((prev) => ({ ...prev, [campo]: valor }));

  const capturarGps = async () => {
    setGps(null);
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

  const num = (v) => (v === '' || isNaN(Number(v)) ? null : Number(v));

  const guardar = async () => {
    if (!gps) return alert('Esperá a que el GPS capture la posición del árbol.');
    if (f.dap_cm === '') return alert('El DAP es obligatorio.');
    setGuardando(true);
    await guardarArbol({
      client_id: crypto.randomUUID(),
      parcela_client_id: parcela.client_id,
      especie: f.especie.trim() || null,
      dap_cm: num(f.dap_cm),
      ht_m: num(f.ht_m),
      hf_m: num(f.hf_m),
      dc_m: num(f.dc_m),
      estado_fitosanitario: f.estado_fitosanitario,
      riesgo: f.riesgo,
      notas: f.notas.trim() || null,
      latitud: gps.latitud,
      longitud: gps.longitud,
      precision_m: gps.precision_m,
      medido_en: new Date().toISOString(),
      synced: false
    });
    setF(VACIO);
    setGuardando(false);
    capturarGps();
    onGuardado();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-zinc-100">
      {/* Encabezado */}
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900">
          Árbol <span className="text-zinc-400">#{numeroSiguiente}</span>
        </h2>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
          {parcela.nombre}
        </span>
      </div>

      {/* GPS automático */}
      <div className="mb-5 rounded-2xl bg-zinc-50 p-4">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-sm font-semibold text-zinc-700">
            <span className="text-rose-500">📍</span> Posición del árbol
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

      {/* Especie */}
      <label className="mb-4 block">
        <span className={labelBase}>Especie</span>
        <input
          value={f.especie}
          onChange={(e) => set('especie')(e.target.value)}
          placeholder="Ej: Prosopis alba"
          className={inputBase}
        />
      </label>

      {/* Variables dendrométricas */}
      <div className="mb-4 grid grid-cols-2 gap-4">
        <CampoNumerico etiqueta="DAP" unidad="cm" valor={f.dap_cm} onChange={set('dap_cm')} />
        <CampoNumerico etiqueta="HT · Alt. total" unidad="m" valor={f.ht_m} onChange={set('ht_m')} />
        <CampoNumerico etiqueta="HF · Alt. fustal" unidad="m" valor={f.hf_m} onChange={set('hf_m')} />
        <CampoNumerico etiqueta="DC · Diám. copa" unidad="m" valor={f.dc_m} onChange={set('dc_m')} />
      </div>

      {/* Atributos cualitativos */}
      <div className="mb-4 grid grid-cols-2 gap-4">
        <label className="block">
          <span className={labelBase}>Estado fitosanitario</span>
          <select
            value={f.estado_fitosanitario}
            onChange={(e) => set('estado_fitosanitario')(e.target.value)}
            className={`${inputBase} appearance-none`}
          >
            {ESTADOS.map((x) => <option key={x}>{x}</option>)}
          </select>
        </label>
        <label className="block">
          <span className={labelBase}>Análisis de riesgo</span>
          <select
            value={f.riesgo}
            onChange={(e) => set('riesgo')(e.target.value)}
            className={`${inputBase} appearance-none`}
          >
            {RIESGOS.map((x) => <option key={x}>{x}</option>)}
          </select>
        </label>
      </div>

      {/* Notas */}
      <label className="mb-6 block">
        <span className={labelBase}>Notas / observaciones</span>
        <textarea
          value={f.notas}
          onChange={(e) => set('notas')(e.target.value)}
          rows={2}
          placeholder="Bifurcado, inclinado, regeneración cercana…"
          className={`${inputBase} resize-none`}
        />
      </label>

      {/* Acción principal */}
      <button
        onClick={guardar}
        disabled={guardando}
        className="w-full rounded-2xl bg-zinc-900 py-4 text-base font-semibold text-white transition active:scale-[0.98] disabled:opacity-50"
      >
        {guardando ? 'Guardando…' : 'Guardar árbol y cargar siguiente'}
      </button>
    </section>
  );
}
