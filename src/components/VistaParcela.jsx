import { useState } from 'react';
import FormArbol from './FormArbol';
import MapaParcela from './MapaParcela';
import { descargarCsv, compartirCsv } from '../lib/utils';

function prom(arr, campo) {
  const vals = arr.map((a) => a[campo]).filter((v) => v != null);
  if (vals.length === 0) return '—';
  return (vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(1);
}

function Stat({ etiqueta, valor, unidad }) {
  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-3 text-center">
      <p className="text-2xl font-bold text-emerald-700">
        {valor}
        {unidad && <span className="text-sm text-slate-500 font-normal"> {unidad}</span>}
      </p>
      <p className="text-xs font-semibold text-slate-600 mt-1">{etiqueta}</p>
    </div>
  );
}

export default function VistaParcela({ parcela, arboles, onArbolGuardado, onVolver }) {
  const [tab, setTab] = useState('carga'); // 'carga' | 'ficha'

  const exportar = () => {
    if (arboles.length === 0) return alert('Todavía no hay árboles para exportar.');
    descargarCsv(parcela, arboles);
  };

  const compartir = async () => {
    if (arboles.length === 0) return alert('Todavía no hay árboles para compartir.');
    try {
      await compartirCsv(parcela, arboles);
    } catch (e) {
      if (e.name !== 'AbortError') alert('No se pudo compartir: ' + e.message);
    }
  };

  return (
    <section>
      <button onClick={onVolver} className="text-emerald-700 font-bold mb-2">
        ← Parcelas
      </button>

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-slate-800">{parcela.nombre}</h1>
        <span className="text-sm font-bold text-slate-600">
          {arboles.length} árbol(es)
        </span>
      </div>

      {/* Pestañas */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {[
          ['carga', '🌳 Cargar árbol'],
          ['ficha', '📋 Ficha técnica']
        ].map(([id, etiqueta]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`py-3 rounded-xl font-bold ${
              tab === id
                ? 'bg-slate-800 text-white'
                : 'bg-white border border-zinc-200 text-slate-600'
            }`}
          >
            {etiqueta}
          </button>
        ))}
      </div>

      {tab === 'carga' && (
        <FormArbol
          parcela={parcela}
          numeroSiguiente={arboles.length + 1}
          onGuardado={onArbolGuardado}
        />
      )}

      {tab === 'ficha' && (
        <div className="space-y-4">
          {/* Resumen estadístico calculado al vuelo */}
          <div className="grid grid-cols-3 gap-3">
            <Stat etiqueta="Árboles medidos" valor={arboles.length} />
            <Stat etiqueta="DAP promedio" valor={prom(arboles, 'dap_cm')} unidad="cm" />
            <Stat etiqueta="HT promedio" valor={prom(arboles, 'ht_m')} unidad="m" />
          </div>

          {/* Mapa interactivo */}
          <MapaParcela parcela={parcela} arboles={arboles} />
          <p className="text-xs text-slate-500 -mt-2">
            Tip: abrí este mapa con señal antes de salir al campo y los tiles
            quedan guardados para verlo offline. Tocá un pin para ver la ficha
            del árbol.
          </p>

          {/* Exportación — funciona 100% offline */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={exportar}
              className="py-4 rounded-xl bg-slate-800 text-white font-bold active:bg-slate-900"
            >
              ⬇ Exportar CSV
            </button>
            <button
              onClick={compartir}
              className="py-4 rounded-xl bg-white border-2 border-slate-800 text-slate-800 font-bold active:bg-zinc-100"
            >
              📤 Compartir
            </button>
          </div>

          {/* Listado rápido para control de calidad */}
          {arboles.length > 0 && (
            <ul className="bg-white rounded-xl border border-zinc-200 divide-y divide-zinc-100">
              {arboles.map((a, i) => (
                <li key={a.client_id} className="p-3 flex items-center justify-between text-sm">
                  <div>
                    <span className="font-bold text-slate-800">#{i + 1}</span>{' '}
                    <span className="text-slate-700">{a.especie || 'Sin especie'}</span>
                    <span className="text-slate-500">
                      {' '}· DAP {a.dap_cm ?? '—'} cm · HT {a.ht_m ?? '—'} m
                    </span>
                  </div>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      a.synced ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {a.synced ? '✓' : '⏳'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
