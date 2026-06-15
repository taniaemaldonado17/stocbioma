// ============================================================
// IndexedDB — fuente de verdad LOCAL de StocBioma.
// Todo registro nace acá con synced:false; la sincronización a
// Supabase es un proceso posterior e idempotente (ver sync.js).
// Se usa IndexedDB y no localStorage porque soporta cientos de
// árboles sin el límite de ~5 MB ni bloquear el hilo principal.
// ============================================================

const DB_NAME = 'stocbioma';
const DB_VERSION = 3;

function abrirDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (db.objectStoreNames.contains('parcelas')) {
        db.deleteObjectStore('parcelas');
      }
      if (db.objectStoreNames.contains('arboles')) {
        db.deleteObjectStore('arboles');
      }
      db.createObjectStore('parcelas', { keyPath: 'client_id' });
      const st = db.createObjectStore('arboles', { keyPath: 'client_id' });
      st.createIndex('por_parcela', 'parcela_client_id', { unique: false });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function enTransaccion(store, modo, operacion) {
  return abrirDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(store, modo);
        const resultado = operacion(tx.objectStore(store));
        tx.oncomplete = () => resolve(resultado.result ?? resultado);
        tx.onerror = () => reject(tx.error);
      })
  );
}

function todos(store, indice = null, clave = null) {
  return abrirDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const st = db.transaction(store, 'readonly').objectStore(store);
        const origen = indice ? st.index(indice) : st;
        const req = clave != null ? origen.getAll(clave) : origen.getAll();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      })
  );
}

// ── API pública ─────────────────────────────────────────────

export const guardarParcela = (p) => enTransaccion('parcelas', 'readwrite', (s) => s.put(p));
export const guardarArbol = (a) => enTransaccion('arboles', 'readwrite', (s) => s.put(a));

export const listarParcelas = () => todos('parcelas');
export const listarArboles = (parcelaClientId) =>
  todos('arboles', 'por_parcela', parcelaClientId);

export async function listarPendientes() {
  const [parcelas, arboles] = await Promise.all([todos('parcelas'), todos('arboles')]);
  return {
    parcelas: parcelas.filter((p) => !p.synced),
    arboles: arboles.filter((a) => !a.synced)
  };
}

export async function marcarSincronizados(store, registros) {
  const db = await abrirDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    const st = tx.objectStore(store);
    registros.forEach((r) => st.put({ ...r, synced: true }));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
