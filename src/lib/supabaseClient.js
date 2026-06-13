import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Si faltan credenciales la app sigue funcionando en modo 100% local
// (útil para probar en campo antes de configurar el backend).
export const supabase = url && key ? createClient(url, key) : null;
