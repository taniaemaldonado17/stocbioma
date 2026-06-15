// ── ID robusto para navegadores viejos o celulares ─────────
export function crearClientId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}-${Math.random().toString(16).slice(2)}`;
}

// ── GPS: navigator.geolocation envuelto en una Promise ──────
export function obtenerPosicion() {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Este dispositivo no soporta GPS'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          latitud: pos.coords.latitude,
          longitud: pos.coords.longitude,
          precision_m: pos.coords.accuracy ? Number(pos.coords.accuracy.toFixed(1)) : null
        }),
      (err) => reject(new Error('No se pudo obtener el GPS: ' + err.message)),
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 10000 }
    );
  });
}

// ── CSV: generación y descarga 100% offline (Blob) ──────────
const COLUMNAS = [
  'parcela', 'nro', 'especie', 'dap_cm', 'ht_m', 'hf_m', 'dc_m',
  'estado_fitosanitario', 'riesgo', 'latitud', 'longitud',
  'precision_m', 'notas', 'medido_en'
];

function celda(v) {
  if (v === null || v === undefined) return '';
  const s = String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function generarCsv(parcela, arboles) {
  const filas = arboles.map((a, i) =>
    [
      parcela.nombre, i + 1, a.especie, a.dap_cm, a.ht_m, a.hf_m, a.dc_m,
      a.estado_fitosanitario, a.riesgo, a.latitud, a.longitud,
      a.precision_m, a.notas, a.medido_en
    ].map(celda).join(',')
  );
  // BOM UTF-8 para que Excel abra bien los acentos
  return '\uFEFF' + [COLUMNAS.join(','), ...filas].join('\r\n');
}

function nombreArchivo(parcela) {
  const fecha = new Date().toISOString().slice(0, 10);
  const limpio = parcela.nombre.replace(/[^a-zA-Z0-9_-]+/g, '_');
  return `StocBioma_${limpio}_${fecha}.csv`;
}

// Descarga directa desde la memoria del celular: funciona sin internet
export function descargarCsv(parcela, arboles) {
  const blob = new Blob([generarCsv(parcela, arboles)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombreArchivo(parcela);
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Menú de compartir nativo (correo, WhatsApp, etc.)
export async function compartirCsv(parcela, arboles) {
  const archivo = new File([generarCsv(parcela, arboles)], nombreArchivo(parcela), {
    type: 'text/csv'
  });
  if (navigator.canShare && navigator.canShare({ files: [archivo] })) {
    await navigator.share({
      files: [archivo],
      title: `StocBioma — ${parcela.nombre}`,
      text: `Datos de la parcela ${parcela.nombre} (${arboles.length} árboles)`
    });
    return true;
  }
  // Si el navegador no soporta compartir archivos, descargamos
  descargarCsv(parcela, arboles);
  return false;
}
