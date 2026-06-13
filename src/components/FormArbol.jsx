import { useEffect, useState } from 'react';
import { guardarArbol } from '../lib/db';
import { obtenerPosicion } from '../lib/utils';

const ESTADOS = ['Sano', 'Enfermo', 'Plaga', 'Muerto en pie'];
const RIESGOS = ['Bajo', 'Medio', 'Alto'];

const VACIO = {
  especie: '', dap_cm: '', ht_m: '', hf_m: '', dc_m: '',
  estado_fitosanitario: 'Sano', riesgo: 'Bajo', notas: ''
};

// inputMode="decimal" abre el teclado numérico en iOS y Android
function CampoNumerico({ etiqueta, unidad, valor, onChange }) {
  return (
    <label className="block">
      <span className="font-semibold text-slate-700 text-sm">
        {etiqueta} <span className="text-slate-400">({unidad})</span>
      </span>
      <input
        type="text"
        inputMode="decimal"
        value={valor}
        onChange={(e) => onChange(e.target.value.replace(',', '.'))}
        placeholder="0.0"
        className="mt-1 w-full rounded-lg border-2 border-zinc-300 p-3 text-lg font-mono focus:border-emerald-600 outline-none"
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
    setF(VACIO);          // limpia el formulario para el árbol siguiente
    setGuardando(false);
    capturarGps();        // recaptura GPS para la próxima posición
    onGuardado();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section className="bg-white rounded-xl border border-zinc-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-bold text-slate-800">Árbol #{numeroSiguiente}</h2>
        <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
          {parcela.nombre}
        </span>
      </div>

      {/* GPS automático */}
      <div className="mb-4 bg-zinc-100 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-700 text-sm">📍 Posición del árbol</span>
          <button onClick={capturarGps} className="text-emerald-700 font-bold text-sm">
            Recapturar
          </button>
        </div>
        <p className="font-mono text-sm text-slate-800 mt-1">
          {gps ? `${gps.latitud.toFixed(6)}, ${gps.longitud.toFixed(6)}` : '—'}
        </p>
        <p className="text-xs text-slate-500">{gpsEstado}</p>
      </div>

      <label className="block mb-4">
        <span className="font-semibold text-slate-700 text-sm">Especie</span>
        <input
          value={f.especie}
          onChange={(e) => set('especie')(e.target.value)}
          placeholder="Ej: Prosopis alba"
          className="mt-1 w-full rounded-lg border-2 border-zinc-300 p-3 focus:border-emerald-600 outline-none"
        />
      </label>

      {/* Variables dendrométricas */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <CampoNumerico etiqueta="DAP" unidad="cm" valor={f.dap_cm} onChange={set('dap_cm')} />
        <CampoNumerico etiqueta="HT — Alt. total" unidad="m" valor={f.ht_m} onChange={set('ht_m')} />
        <CampoNumerico etiqueta="HF — Alt. fustal" unidad="m" valor={f.hf_m} onChange={set('hf_m')} />
        <CampoNumerico etiqueta="DC — Diám. copa" unidad="m" valor={f.dc_m} onChange={set('dc_m')} />
      </div>

      {/* Atributos cualitativos */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <label className="block">
          <span className="font-semibold text-slate-700 text-sm">Estado fitosanitario</span>
          <select
            value={f.estado_fitosanitario}
            onChange={(e) => set('estado_fitosanitario')(e.target.value)}
            className="mt-1 w-full rounded-lg border-2 border-zinc-300 p-3 bg-white focus:border-emerald-600 outline-none"
          >
            {ESTADOS.map((x) => <option key={x}>{x}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="font-semibold text-slate-700 text-sm">Análisis de riesgo</span>
          <select
            value={f.riesgo}
            onChange={(e) => set('riesgo')(e.target.value)}
            className="mt-1 w-full rounded-lg border-2 border-zinc-300 p-3 bg-white focus:border-emerald-600 outline-none"
          >
            {RIESGOS.map((x) => <option key={x}>{x}</option>)}
          </select>
        </label>
      </div>

      <label className="block mb-5">
        <span className="font-semibold text-slate-700 text-sm">Notas / observaciones</span>
        <textarea
          value={f.notas}
          onChange={(e) => set('notas')(e.target.value)}
          rows={2}
          placeholder="Bifurcado, inclinado, regeneración cercana…"
          className="mt-1 w-full rounded-lg border-2 border-zinc-300 p-3 focus:border-emerald-600 outline-none"
        />
      </label>

      <button
        onClick={guardar}
        disabled={guardando}
        className="w-full py-4 rounded-xl bg-emerald-600 text-white text-lg font-bold active:bg-emerald-700 disabled:opacity-60"
      >
        💾 Guardar árbol y cargar siguiente
      </button>
    </section>
  );
}
