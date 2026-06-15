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
    <div className="rounded-2xl bg-white p-4 text-center shadow-sm ring-1 ring-zinc-100">
      <p className="text-2xl font-bold tracking-tight text-zinc-900">
        {valor}
        {unidad && valor !== '—' && (
          <span className="text-sm font-normal text-zinc-400"> {unidad}</span>
        )}
      </p>
      <p className="mt-1 text-xs font-medium text-zinc-500">{etiqueta}</p>
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
      <button
        onClick={onVolver}
        className="mb-3 text-sm font-semibold text-zinc-500 transition active:text-zinc-900"
      >
        ← Parcelas
      </button>

      <div className="mb-5 flex items-end justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">{parcela.nombre}</h1>
        <span className="pb-1 text-sm font-medium text-zinc-400">
          {arboles.length} árbol(es)
        </span>
      </div>

      {/* Pestañas tipo segmented control */}
      <div className="mb-5 grid grid-cols-2 gap-1 rounded-2xl bg-zinc-100 p-1">
        {[
          ['carga', 'Cargar árbol'],
          ['ficha', 'Ficha técnica']
        ].map(([id, etiqueta]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`rounded-xl py-2.5 text-sm font-semibold transition ${
              tab === id ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500'
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
          {/* Resumen estadístico al vuelo */}
          <div className="grid grid-cols-3 gap-3">
            <Stat etiqueta="Árboles" valor={arboles.length} />
            <Stat etiqueta="DAP prom." valor={prom(arboles, 'dap_cm')} unidad="cm" />
            <Stat etiqueta="HT prom." valor={prom(arboles, 'ht_m')} unidad="m" />
          </div>

          {/* Mapa interactivo */}
          <div className="overflow-hidden rounded-2xl shadow-sm ring-1 ring-zinc-100">
            <MapaParcela parcela={parcela} arboles={arboles} />
          </div>
          <p className="px-1 text-xs leading-relaxed text-zinc-400">
            Abrí este mapa con señal antes de salir al campo y los tiles quedan
            guardados para verlo offline. Tocá un pin para ver la ficha del árbol.
          </p>

          {/* Exportación — 100% offline */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={exportar}
              className="rounded-2xl bg-zinc-900 py-3.5 text-sm font-semibold text-white transition active:scale-[0.98]"
            >
              Exportar CSV
            </button>
            <button
              onClick={compartir}
              className="rounded-2xl bg-white py-3.5 text-sm font-semibold text-zinc-900 shadow-sm ring-1 ring-zinc-200 transition active:scale-[0.98]"
            >
              Compartir
            </button>
          </div>

          {/* Listado para control de calidad */}
          {arboles.length > 0 && (
            <ul className="divide-y divide-zinc-100 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-zinc-100">
              {arboles.map((a, i) => (
                <li key={a.client_id} className="flex items-center justify-between p-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-zinc-900">
                      #{i + 1} · {a.especie || 'Sin especie'}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-400">
                      {a.tipo_inventario === 'urbano' ? 'Urbano' : 'Forestal'} · DAP {a.dap_cm ?? '—'} cm · HT {a.ht_m ?? '—'} m · {a.estado_fitosanitario}
                    </p>
                  </div>
                  <span
                    className={`ml-3 shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      a.synced ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {a.synced ? 'Sincr.' : 'Pend.'}
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
