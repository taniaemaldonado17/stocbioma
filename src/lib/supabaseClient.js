import { createClient } from '@supabase/supabase-js';

function normalizarUrl(url) {
  if (!url) return null;
  const limpia = url.trim().replace(/\/+$/, '');
  return limpia.endsWith('/rest/v1') || limpia.endsWith('/rest/v1/')
    ? limpia.replace(/\/rest\/v1\/?$/, '')
    : limpia;
}

const url = normalizarUrl(import.meta.env.VITE_SUPABASE_URL);
const key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

// Si faltan credenciales la app sigue funcionando en modo 100% local
// (útil para probar en campo antes de configurar el backend).
export const supabase = url && key ? createClient(url, key) : null;
