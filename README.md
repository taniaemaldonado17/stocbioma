# 🌲 StocBioma — Inventario forestal offline-first (PWA)

App móvil instalable para inventarios forestales en campo (proyectos de bonos
de carbono) de la consultora **Stoc**. Funciona al 100% sin internet y
sincroniza con Supabase cuando recupera señal.

---

## 1 · Requisitos previos

- **Node.js 18+** instalado (https://nodejs.org)
- Cuenta gratuita en **Supabase** (https://supabase.com)
- Cuenta gratuita en **GitHub** y **Vercel**

## 2 · Instalar librerías

```bash
# Dentro de la carpeta del proyecto
npm install
```

Eso instala todo lo declarado en `package.json`. Si lo armaras a mano, los
comandos equivalentes serían:

```bash
npm install react react-dom @supabase/supabase-js leaflet react-leaflet@4
npm install -D vite @vitejs/plugin-react vite-plugin-pwa tailwindcss postcss autoprefixer
```

## 3 · Crear la base de datos en Supabase

1. Entrá a https://supabase.com → **New project** (plan Free).
2. Cuando termine de crearse, andá a **SQL Editor → New query**.
3. Pegá el contenido completo de `supabase/schema.sql` y tocá **Run**.
4. Verificá en **Table Editor** que existan las tablas `parcelas` y `arboles`.

## 4 · Configurar las credenciales (variables de entorno)

1. En Supabase: **Settings → API**. Copiá la **Project URL** y la clave
   **anon public**.
2. En la raíz del proyecto, copiá `.env.example` como `.env.local`:

```bash
cp .env.example .env.local
```

3. Completalo:

```
VITE_SUPABASE_URL=https://tuproyecto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

> El prefijo `VITE_` es obligatorio para que Vite exponga la variable al
> frontend. `.env.local` está en `.gitignore`: nunca se sube a GitHub.

## 5 · Probar en tu computadora

```bash
npm run dev
```

Abrí http://localhost:5173. Para probar el **modo offline**: en Chrome,
DevTools → pestaña *Network* → tildá "Offline" y cargá árboles; después
destildá y mirá cómo sincroniza solo.

> Nota: el GPS y la instalación como PWA requieren **HTTPS**. En localhost
> funciona igual (excepción del navegador), pero en el teléfono solo va a
> funcionar cuando esté desplegada en Vercel (que ya da HTTPS gratis).

## 6 · Subir a GitHub (guía súper simple)

```bash
git init
git add .
git commit -m "StocBioma v0.1"
```

1. En https://github.com → **New repository** → nombre `stocbioma` → Create.
2. Copiá los dos comandos que te muestra GitHub:

```bash
git remote add origin https://github.com/TU_USUARIO/stocbioma.git
git push -u origin main
```

## 7 · Desplegar gratis en Vercel

1. Entrá a https://vercel.com → **Add New → Project** → importá el repo
   `stocbioma` desde GitHub.
2. Vercel detecta Vite solo. Antes de tocar **Deploy**, abrí
   **Environment Variables** y agregá las dos mismas variables de
   `.env.local`:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. **Deploy**. En ~1 minuto tenés tu URL: `https://stocbioma.vercel.app`.
4. Cada `git push` a `main` redeploya automáticamente.

## 8 · Instalar en los teléfonos

### iPhone (Safari)
1. Abrí la URL de Vercel **en Safari** (no Chrome de iOS).
2. Tocá el botón **Compartir** (cuadrado con flecha hacia arriba).
3. Bajá y elegí **"Agregar a pantalla de inicio"** → **Agregar**.
4. Aparece el ícono de StocBioma; al abrirlo corre a pantalla completa.
5. La primera vez, aceptá el permiso de **Ubicación** cuando lo pida.

### Android (Chrome)
1. Abrí la URL de Vercel en **Chrome**.
2. Chrome suele mostrar solo el aviso **"Instalar app"**. Si no aparece:
   menú **⋮ → Agregar a la pantalla principal / Instalar app**.
3. Confirmá. Queda instalada como una app más, con su ícono.
4. Aceptá el permiso de **Ubicación** la primera vez.

### Antes de salir al campo (importante)
- Abrí la app **una vez con internet** para que el service worker cachee todo.
- Abrí el mapa de la zona de trabajo con señal: los tiles quedan guardados
  y el mapa se ve offline.
- Después de eso, la app abre, carga árboles, calcula estadísticas y exporta
  CSV **sin ninguna conexión**.

## 9 · Cómo funciona el flujo offline (resumen)

```
[Formulario] → IndexedDB (synced:false) → ✅ guardado instantáneo, con o sin señal
                          │
        evento 'online' o botón "Sincronizar"
                          ▼
        upsert en lote a Supabase (onConflict: client_id)
                          ▼
              marca local synced:true
```

- **IndexedDB** es la fuente de verdad local (no localStorage: sin límite de 5 MB).
- Los **UUID se generan en el teléfono** (`crypto.randomUUID()`), por eso
  re-sincronizar nunca duplica registros y las relaciones parcela→árbol
  funcionan aunque ambos nazcan offline.
- El **CSV** se genera con un `Blob` desde IndexedDB: descarga y compartir
  (correo/WhatsApp) funcionan sin tocar el servidor.

## 10 · Seguridad (leer antes de producción)

El esquema SQL incluye políticas RLS **abiertas** para que el prototipo
funcione sin login. Antes de cargar datos reales de clientes: activar
Supabase Auth, agregar una columna `user_id` y restringir las políticas.
