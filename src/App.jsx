import { useEffect, useState, useCallback } from 'react';
import { listarParcelas, listarArboles, listarPendientes } from './lib/db';
import { sincronizar } from './lib/sync';
import BarraEstado from './components/BarraEstado';
import ListaParcelas from './components/ListaParcelas';
import FormParcela from './components/FormParcela';
import VistaParcela from './components/VistaParcela';

export default function App() {
  // Navegación simple por estado: 'lista' | 'nueva' | 'parcela'
  const [vista, setVista] = useState('lista');
  const [parcelas, setParcelas] = useState([]);
  const [parcelaActiva, setParcelaActiva] = useState(null);
  const [arboles, setArboles] = useState([]);

  const [online, setOnline] = useState(navigator.onLine);
  const [pendientes, setPendientes] = useState(0);
  const [msgSync, setMsgSync] = useState('');
  const [sincronizando, setSincronizando] = useState(false);

  // ── Cargar datos locales ──────────────────────────────────
  const refrescar = useCallback(async () => {
    setParcelas(await listarParcelas());
    const { parcelas: pp, arboles: aa } = await listarPendientes();
    setPendientes(pp.length + aa.length);
  }, []);

  const abrirParcela = useCallback(async (p) => {
    setParcelaActiva(p);
    setArboles(await listarArboles(p.client_id));
    setVista('parcela');
  }, []);

  // ── Sincronización (manual y automática) ──────────────────
  const ejecutarSync = useCallback(async () => {
    setSincronizando(true);
    setMsgSync('Sincronizando…');
    try {
      const r = await sincronizar();
      setMsgSync(r.mensaje);
    } catch (e) {
      setMsgSync('Error de sincronización: ' + e.message);
    } finally {
      setSincronizando(false);
      refrescar();
      setTimeout(() => setMsgSync(''), 4000);
    }
  }, [refrescar]);

  useEffect(() => {
    refrescar();
    const alConectar = () => {
      setOnline(true);
      ejecutarSync(); // al recuperar señal, sube lo pendiente solo
    };
    const alDesconectar = () => setOnline(false);
    window.addEventListener('online', alConectar);
    window.addEventListener('offline', alDesconectar);
    return () => {
      window.removeEventListener('online', alConectar);
      window.removeEventListener('offline', alDesconectar);
    };
  }, [ejecutarSync, refrescar]);

  return (
    <div className="min-h-screen bg-zinc-100 text-slate-900">
      {/* Encabezado corporativo */}
      <header className="bg-zinc-900 text-white px-4 pt-[env(safe-area-inset-top)]">
        <div className="flex items-center justify-between py-3">
          <button
            onClick={() => { setVista('lista'); refrescar(); }}
            className="flex items-center gap-2"
          >
            <span className="text-2xl">🌲</span>
            <span className="text-xl font-bold tracking-tight">
              Stoc<span className="text-emerald-400">Bioma</span>
            </span>
          </button>
          <BarraEstado online={online} pendientes={pendientes} />
        </div>
      </header>

      {/* Aviso de sincronización */}
      {msgSync && (
        <div className="bg-emerald-700 text-white text-center text-sm font-medium py-2 px-4">
          {msgSync}
        </div>
      )}

      <main className="max-w-xl mx-auto p-4 pb-28">
        {vista === 'lista' && (
          <ListaParcelas
            parcelas={parcelas}
            onAbrir={abrirParcela}
            onNueva={() => setVista('nueva')}
          />
        )}

        {vista === 'nueva' && (
          <FormParcela
            onGuardada={(p) => { refrescar(); abrirParcela(p); }}
            onCancelar={() => setVista('lista')}
          />
        )}

        {vista === 'parcela' && parcelaActiva && (
          <VistaParcela
            parcela={parcelaActiva}
            arboles={arboles}
            onArbolGuardado={async () => {
              setArboles(await listarArboles(parcelaActiva.client_id));
              refrescar();
            }}
            onVolver={() => { setVista('lista'); refrescar(); }}
          />
        )}
      </main>

      {/* Botón fijo de sincronización manual */}
      <footer className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur border-t border-zinc-200 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="max-w-xl mx-auto">
          <button
            onClick={ejecutarSync}
            disabled={sincronizando}
            className={`w-full py-4 rounded-xl text-lg font-bold transition-colors ${
              pendientes > 0
                ? 'bg-emerald-600 text-white active:bg-emerald-700'
                : 'bg-zinc-200 text-zinc-500'
            } disabled:opacity-60`}
          >
            {sincronizando
              ? 'Sincronizando…'
              : pendientes > 0
                ? `⬆ Sincronizar ${pendientes} pendiente(s)`
                : '✓ Datos sincronizados'}
          </button>
        </div>
      </footer>
    </div>
  );
}
