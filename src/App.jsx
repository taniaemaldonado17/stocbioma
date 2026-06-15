import { useEffect, useState, useCallback } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { listarParcelas, listarArboles, listarPendientes } from './lib/db';
import { sincronizar } from './lib/sync';
import BarraEstado from './components/BarraEstado';
import ListaParcelas from './components/ListaParcelas';
import FormParcela from './components/FormParcela';
import VistaParcela from './components/VistaParcela';

export default function App() {
  const [vista, setVista] = useState('lista'); // 'lista' | 'nueva' | 'parcela'
  const [parcelas, setParcelas] = useState([]);
  const [parcelaActiva, setParcelaActiva] = useState(null);
  const [arboles, setArboles] = useState([]);

  const [online, setOnline] = useState(navigator.onLine);
  const [pendientes, setPendientes] = useState(0);
  const [msgSync, setMsgSync] = useState('');
  const [syncOk, setSyncOk] = useState(true);
  const [sincronizando, setSincronizando] = useState(false);
  const [showUpdateBanner, setShowUpdateBanner] = useState(false);

  const { needRefresh: [needRefresh, setNeedRefresh], updateServiceWorker } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      console.log('Service worker registrado en', swUrl, registration);
    },
    onRegisterError(error) {
      console.error('Error al registrar el service worker', error);
    }
  });

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

  const ejecutarSync = useCallback(async () => {
    setSincronizando(true);
    setSyncOk(true);
    setMsgSync('Sincronizando…');
    try {
      const r = await sincronizar();
      setSyncOk(r.ok);
      setMsgSync(r.mensaje);
    } catch (e) {
      setSyncOk(false);
      setMsgSync('Error de sincronización: ' + e.message);
    } finally {
      setSincronizando(false);
      refrescar();
      setTimeout(() => setMsgSync(''), 5000);
    }
  }, [refrescar]);

  useEffect(() => {
    setShowUpdateBanner(needRefresh);
  }, [needRefresh]);

  useEffect(() => {
    refrescar();
    const alConectar = () => { setOnline(true); ejecutarSync(); };
    const alDesconectar = () => setOnline(false);
    window.addEventListener('online', alConectar);
    window.addEventListener('offline', alDesconectar);
    return () => {
      window.removeEventListener('online', alConectar);
      window.removeEventListener('offline', alDesconectar);
    };
  }, [ejecutarSync, refrescar]);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-zinc-900 px-4 pt-[env(safe-area-inset-top)] text-white">
        <div className="flex items-center justify-between py-3.5">
          <button
            onClick={() => { setVista('lista'); refrescar(); }}
            className="flex items-center gap-2"
          >
            <span className="text-xl">🌲</span>
            <span className="text-lg font-bold tracking-tight">
              Stoc<span className="text-emerald-400">Bioma</span>
            </span>
          </button>
          <BarraEstado online={online} pendientes={pendientes} />
        </div>
      </header>

      {/* Banner de sincronización: tarjeta sutil, color según éxito/error */}
      {msgSync && (
        <div className="px-4 pt-3">
          <div
            className={`mx-auto max-w-xl rounded-2xl px-4 py-3 text-sm font-medium ${
              syncOk ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-700'
            }`}
          >
            {msgSync}
          </div>
        </div>
      )}

      {showUpdateBanner && (
        <div className="px-4 pt-3">
          <div className="mx-auto flex max-w-xl flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 sm:flex-row sm:items-center sm:justify-between">
            <span>Hay una actualización lista. Recargá la app para usar la versión nueva.</span>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  updateServiceWorker(true);
                  setNeedRefresh(false);
                  setShowUpdateBanner(false);
                }}
                className="rounded-full bg-amber-600 px-3 py-1.5 text-white"
              >
                Actualizar
              </button>
              <button
                onClick={() => setShowUpdateBanner(false)}
                className="rounded-full bg-white px-3 py-1.5 text-amber-700"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-xl p-4 pb-32">
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

      {/* Botón flotante de sincronización */}
      <footer className="fixed inset-x-0 bottom-0 border-t border-zinc-200 bg-white/80 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-lg">
        <div className="mx-auto max-w-xl">
          <button
            onClick={ejecutarSync}
            disabled={sincronizando}
            className={`w-full rounded-2xl py-4 text-base font-semibold transition active:scale-[0.98] disabled:opacity-50 ${
              pendientes > 0 ? 'bg-emerald-600 text-white' : 'bg-zinc-100 text-zinc-400'
            }`}
          >
            {sincronizando
              ? 'Sincronizando…'
              : pendientes > 0
                ? `Sincronizar ${pendientes} pendiente(s)`
                : 'Datos sincronizados'}
          </button>
        </div>
      </footer>
    </div>
  );
}
