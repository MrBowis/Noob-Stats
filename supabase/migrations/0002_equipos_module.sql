create extension if not exists "pgcrypto";

-- ============================================================
-- Módulo de Equipos: gestión de equipos, miembros, invitaciones
-- y partidos. Los Entrenadores gestionan sus equipos; los
-- Futbolistas consultan la información de los equipos a los que
-- pertenecen (miembros, partidos próximos, resultados).
-- ============================================================

-- ---------- Equipo ----------
create table if not exists public.equipo (
  id            uuid primary key default gen_random_uuid(),
  nombre        varchar(100) not null,
  descripcion   varchar(300),
  categoria     varchar(50),
  ciudad        varchar(100),
  escudo_url    varchar(500),
  entrenador_id uuid not null references public.usuario(id) on delete cascade,
  created_at    timestamptz not null default now()
);

create index if not exists idx_equipo_entrenador_id on public.equipo(entrenador_id);

-- ---------- Equipo <-> Miembro (jugadores del equipo) ----------
create table if not exists public.equipo_miembro (
  id         uuid primary key default gen_random_uuid(),
  equipo_id  uuid not null references public.equipo(id) on delete cascade,
  usuario_id uuid not null references public.usuario(id) on delete cascade,
  dorsal     integer,
  posicion   varchar(50),
  estado     varchar(30) not null default 'activo',
  joined_at  timestamptz not null default now(),
  unique (equipo_id, usuario_id)
);

create index if not exists idx_equipo_miembro_equipo_id on public.equipo_miembro(equipo_id);
create index if not exists idx_equipo_miembro_usuario_id on public.equipo_miembro(usuario_id);

-- ---------- Invitación (Entrenador -> Jugador) ----------
create table if not exists public.invitacion (
  id           uuid primary key default gen_random_uuid(),
  equipo_id    uuid not null references public.equipo(id) on delete cascade,
  usuario_id   uuid not null references public.usuario(id) on delete cascade,
  estado       varchar(20) not null default 'pendiente'
               check (estado in ('pendiente', 'aceptada', 'rechazada', 'cancelada')),
  mensaje      varchar(300),
  created_at   timestamptz not null default now(),
  responded_at timestamptz
);

create index if not exists idx_invitacion_equipo_id on public.invitacion(equipo_id);
create index if not exists idx_invitacion_usuario_id on public.invitacion(usuario_id);
-- Una sola invitación pendiente por (equipo, jugador).
create unique index if not exists uq_invitacion_pendiente
  on public.invitacion(equipo_id, usuario_id)
  where estado = 'pendiente';

-- ---------- Partido ----------
create table if not exists public.partido (
  id           uuid primary key default gen_random_uuid(),
  equipo_id    uuid not null references public.equipo(id) on delete cascade,
  rival        varchar(100) not null,
  fecha        timestamptz not null,
  ubicacion    varchar(150),
  es_local     boolean not null default true,
  estado       varchar(20) not null default 'programado'
               check (estado in ('programado', 'finalizado', 'cancelado')),
  goles_favor  integer,
  goles_contra integer,
  notas        varchar(300),
  created_at   timestamptz not null default now()
);

create index if not exists idx_partido_equipo_id on public.partido(equipo_id);
create index if not exists idx_partido_fecha on public.partido(fecha);

-- ---------- RLS (deny-all; el acceso pasa por el microservicio con service role) ----------
alter table public.equipo         enable row level security;
alter table public.equipo_miembro enable row level security;
alter table public.invitacion     enable row level security;
alter table public.partido        enable row level security;
