-- ============================================================
-- StocBioma · Esquema de base de datos para Supabase
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

-- ── Tabla de PARCELAS de muestreo ───────────────────────────
create table if not exists public.parcelas (
  id          uuid primary key default gen_random_uuid(),
  -- client_id: UUID generado EN EL TELÉFONO (offline). Es la clave
  -- de sincronización: permite hacer upsert idempotente (re-sincronizar
  -- nunca duplica datos) y relacionar árboles creados sin internet.
  client_id   uuid not null unique,
  nombre      text not null,
  descripcion text,
  -- Coordenadas del centro de la parcela
  latitud     double precision,
  longitud    double precision,
  creado_en   timestamptz not null default now()
);

-- ── Tabla de ÁRBOLES (20–30 por parcela) ────────────────────
create table if not exists public.arboles (
  id                  uuid primary key default gen_random_uuid(),
  client_id           uuid not null unique,
  -- Relación jerárquica: cada árbol pertenece a una parcela.
  -- Referencia al client_id (no al id) para que la relación sea
  -- válida aunque ambos registros hayan nacido offline.
  parcela_client_id   uuid not null references public.parcelas(client_id) on delete cascade,

  especie             text,

  -- Variables dendrométricas (numeric admite decimales exactos)
  dap_cm              numeric(6,2),   -- Diámetro a la Altura del Pecho (cm)
  ht_m                numeric(6,2),   -- Altura Total (m)
  hf_m                numeric(6,2),   -- Altura Fustal / Comercial (m)
  dc_m                numeric(6,2),   -- Diámetro de Copa (m)

  -- Atributos cualitativos con valores controlados
  estado_fitosanitario text check (estado_fitosanitario in ('Sano','Enfermo','Plaga','Muerto en pie')),
  riesgo               text check (riesgo in ('Bajo','Medio','Alto')),

  notas               text,

  -- Georreferenciación automática (double precision es el tipo
  -- correcto para coordenadas WGS84 de navigator.geolocation)
  latitud             double precision not null,
  longitud            double precision not null,
  precision_m         numeric(8,2),   -- precisión reportada por el GPS (metros)

  medido_en           timestamptz,    -- momento de la medición en campo
  creado_en           timestamptz not null default now()
);

create index if not exists idx_arboles_parcela on public.arboles (parcela_client_id);

-- ── Row Level Security (RLS) ────────────────────────────────
-- ⚠️ PROTOTIPO: políticas abiertas para la clave 'anon' para que
-- la app funcione sin sistema de login. Antes de usar en producción
-- con datos sensibles, agregar Supabase Auth y restringir por usuario.
alter table public.parcelas enable row level security;
alter table public.arboles  enable row level security;

create policy "prototipo_parcelas_select" on public.parcelas for select using (true);
create policy "prototipo_parcelas_insert" on public.parcelas for insert with check (true);
create policy "prototipo_parcelas_update" on public.parcelas for update using (true);

create policy "prototipo_arboles_select" on public.arboles for select using (true);
create policy "prototipo_arboles_insert" on public.arboles for insert with check (true);
create policy "prototipo_arboles_update" on public.arboles for update using (true);
