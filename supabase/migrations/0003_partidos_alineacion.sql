-- ============================================================
-- Módulo de Equipos v2: alineaciones (formación + posición de cada
-- jugador en la cancha) y detalle de resultados de partido
-- (goleadores y tarjetas amarillas/rojas).
-- ============================================================

-- ---------- Formación del equipo ----------
alter table public.equipo
  add column if not exists formacion varchar(10) not null default '4-4-2'
  check (formacion in ('4-4-2', '4-3-3', '4-2-3-1', '3-5-2', '5-3-2'));

-- ---------- Slot (posición en la cancha) de cada miembro ----------
-- `posicion` sigue siendo el rol descriptivo; `slot` es la casilla táctica
-- dentro de la formación (p. ej. 'GK', 'DCL', 'MC'). null = suplente.
alter table public.equipo_miembro
  add column if not exists slot varchar(10);

-- ---------- Goles del partido (goleadores propios) ----------
create table if not exists public.partido_gol (
  id         uuid primary key default gen_random_uuid(),
  partido_id uuid not null references public.partido(id) on delete cascade,
  usuario_id uuid references public.usuario(id) on delete set null,
  minuto     integer,
  created_at timestamptz not null default now()
);

create index if not exists idx_partido_gol_partido_id on public.partido_gol(partido_id);

-- ---------- Tarjetas del partido ----------
create table if not exists public.partido_tarjeta (
  id         uuid primary key default gen_random_uuid(),
  partido_id uuid not null references public.partido(id) on delete cascade,
  usuario_id uuid references public.usuario(id) on delete set null,
  tipo       varchar(10) not null check (tipo in ('amarilla', 'roja')),
  minuto     integer,
  created_at timestamptz not null default now()
);

create index if not exists idx_partido_tarjeta_partido_id on public.partido_tarjeta(partido_id);

-- ---------- RLS (deny-all; acceso vía microservicio con service role) ----------
alter table public.partido_gol     enable row level security;
alter table public.partido_tarjeta enable row level security;
