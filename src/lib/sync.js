// ============================================================
// Sincronización inteligente: sube EN LOTE todo lo pendiente.
// Usa upsert sobre client_id → tocar "Sincronizar" dos veces o
// que se corte la señal a mitad de la subida NUNCA duplica datos.
// Orden importante: primero parcelas, después árboles (FK).
// ============================================================

import { supabase } from './supabaseClient';
import { listarPendientes, marcarSincronizados } from './db';

// Quita campos puramente locales antes de subir a Postgres
function limpiarParcela({ synced, ...p }) {
  return p;
}
function limpiarArbol({ synced, ...a }) {
  return a;
}

export async function sincronizar() {
  if (!supabase) {
    return { ok: false, mensaje: 'Supabase no está configurado (.env.local)' };
  }
  if (!navigator.onLine) {
    return { ok: false, mensaje: 'Sin conexión: los datos siguen guardados en el teléfono' };
  }

  const { parcelas, arboles } = await listarPendientes();

  if (parcelas.length === 0 && arboles.length === 0) {
    return { ok: true, mensaje: 'Todo sincronizado ✓', subidos: 0 };
  }

  // 1) Parcelas primero (los árboles dependen de ellas)
  if (parcelas.length > 0) {
    const { error } = await supabase
      .from('parcelas')
      .upsert(parcelas.map(limpiarParcela), { onConflict: 'client_id' });
    if (error) return { ok: false, mensaje: `Error subiendo parcelas: ${error.message}` };
    await marcarSincronizados('parcelas', parcelas);
  }

  // 2) Árboles en lote
  if (arboles.length > 0) {
    const { error } = await supabase
      .from('arboles')
      .upsert(arboles.map(limpiarArbol), { onConflict: 'client_id' });
    if (error) return { ok: false, mensaje: `Error subiendo árboles: ${error.message}` };
    await marcarSincronizados('arboles', arboles);
  }

  const total = parcelas.length + arboles.length;
  return { ok: true, mensaje: `${total} registro(s) sincronizados ✓`, subidos: total };
}
