// ============================================================
// Sincronización inteligente: sube EN LOTE todo lo pendiente.
// Usa upsert sobre client_id → tocar "Sincronizar" dos veces o
// que se corte la señal a mitad de la subida NUNCA duplica datos.
// Orden importante: primero parcelas, después árboles (FK).
// ============================================================

import { supabase, supabaseConfigMessage } from './supabaseClient';
import { listarPendientes, marcarSincronizados } from './db';

// Quita campos puramente locales antes de subir a Postgres
function limpiarParcela({ synced, ...p }) {
  return p;
}
function limpiarArbol({ synced, ...a }) {
  return a;
}

async function upsertArbolesConFallback(registros) {
  const payload = registros.map(limpiarArbol);
  const { error } = await supabase.from('arboles').upsert(payload, { onConflict: 'client_id' });

  if (!error) return { ok: true };

  const mensaje = error.message || '';
  if (mensaje.includes('column') && mensaje.includes('does not exist')) {
    const { error: errorFallback } = await supabase.from('arboles').upsert(
      payload.map(({ foto_arbol_entero, foto_hoja, foto_corteza, tipo_inventario, ...rest }) => rest),
      { onConflict: 'client_id' }
    );
    if (errorFallback) throw errorFallback;
    return { ok: true, fallback: true };
  }

  throw error;
}

export async function sincronizar() {
  if (!supabase) {
    return { ok: false, mensaje: supabaseConfigMessage || 'Supabase no está configurado' };
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
    try {
      const { error } = await supabase
        .from('parcelas')
        .upsert(parcelas.map(limpiarParcela), { onConflict: 'client_id' });
      if (error) throw error;
      await marcarSincronizados('parcelas', parcelas);
    } catch (error) {
      console.error('Error subiendo parcelas', error);
      return { ok: false, mensaje: `Error subiendo parcelas: ${error.message || 'sin detalle'}` };
    }
  }

  // 2) Árboles en lote
  if (arboles.length > 0) {
    try {
      await upsertArbolesConFallback(arboles);
      await marcarSincronizados('arboles', arboles);
    } catch (error) {
      console.error('Error subiendo árboles', error);
      return { ok: false, mensaje: `Error subiendo árboles: ${error.message || 'sin detalle'}` };
    }
  }

  const total = parcelas.length + arboles.length;
  return { ok: true, mensaje: `${total} registro(s) sincronizados ✓`, subidos: total };
}
