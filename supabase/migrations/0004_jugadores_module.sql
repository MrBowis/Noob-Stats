create extension if not exists "pgcrypto";

-- ============================================================
-- Módulo de Jugadores: perfil deportivo del futbolista amateur.
--
-- Alcance: información PROPIA del jugador (datos físicos, posiciones,
-- pierna hábil, atributos y lesiones). Los datos derivados de partidos
-- (goles, tarjetas, minutos, titularidades, atajadas...) pertenecen a
-- `equipos-ms` (tablas partido/gol/tarjeta/equipo_miembro) y NO se
-- duplican aquí: se consultan mediante comunicación entre servicios.
--
-- La identidad (nombres, apellidos, correo, fecha de nacimiento) vive en
-- `auth-ms` (public.persona / public.usuario) y tampoco se replica.
-- ============================================================

-- ---------- Catálogos controlados (ENUM) ----------
do $$ begin
  create type public.genero_jugador as enum
    ('MASCULINO', 'FEMENINO', 'OTRO', 'PREFIERO_NO_DECIR');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.estado_jugador as enum
    ('ACTIVO', 'INACTIVO', 'LESIONADO', 'RETIRADO');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.pierna_habil as enum
    ('DERECHA', 'IZQUIERDA', 'AMBAS');
exception when duplicate_object then null; end $$;

-- PORTERO está soportado explícitamente (requisito del dominio).
do $$ begin
  create type public.posicion_jugador as enum
    ('PORTERO', 'DEFENSA', 'MEDIOCAMPISTA', 'DELANTERO');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.parte_cuerpo as enum (
    'CABEZA', 'CUELLO', 'HOMBRO', 'BRAZO', 'CODO', 'ANTEBRAZO', 'MUNECA',
    'MANO', 'DEDOS_MANO', 'PECHO', 'ESPALDA', 'CADERA', 'INGLE', 'MUSLO',
    'RODILLA', 'PANTORRILLA', 'TOBILLO', 'PIE', 'DEDOS_PIE', 'OTRA'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.estado_lesion as enum
    ('ACTIVA', 'EN_RECUPERACION', 'RECUPERADA', 'CRONICA');
exception when duplicate_object then null; end $$;

-- ---------- Jugador (perfil deportivo) ----------
-- Sin nombre_completo, tipo/numero_documento, nivel_experiencia, categoria,
-- perfil_deportivo ni observaciones: esos datos son de auth-ms o no existen.
-- Sin fecha_nacimiento: ya la administra public.persona (auth-ms).
create table if not exists public.jugador (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null unique references public.usuario(id) on delete cascade,
  genero              public.genero_jugador,
  nacionalidad        varchar(50),
  foto_url            varchar(500),
  pierna_habil        public.pierna_habil,
  estado              public.estado_jugador not null default 'ACTIVO',
  fecha_creacion      timestamptz not null default now(),
  fecha_actualizacion timestamptz not null default now()
);

create index if not exists idx_jugador_user_id on public.jugador(user_id);
create index if not exists idx_jugador_estado on public.jugador(estado);
create index if not exists idx_jugador_pierna_habil on public.jugador(pierna_habil);

-- ---------- Datos físicos (1:1 con jugador) ----------
create table if not exists public.jugador_fisico (
  id                  uuid primary key default gen_random_uuid(),
  jugador_id          uuid not null unique references public.jugador(id) on delete cascade,
  altura_cm           numeric(5, 2) check (altura_cm > 0 and altura_cm <= 300),
  peso_kg             numeric(5, 2) check (peso_kg > 0 and peso_kg <= 300),
  fecha_actualizacion timestamptz not null default now()
);

-- ---------- Posiciones (1:N con jugador) ----------
create table if not exists public.jugador_posicion (
  id           uuid primary key default gen_random_uuid(),
  jugador_id   uuid not null references public.jugador(id) on delete cascade,
  posicion     public.posicion_jugador not null,
  es_principal boolean not null default false,
  unique (jugador_id, posicion)
);

create index if not exists idx_jugador_posicion_jugador_id
  on public.jugador_posicion(jugador_id);
create index if not exists idx_jugador_posicion_posicion
  on public.jugador_posicion(posicion);

-- Como máximo una posición principal por jugador.
create unique index if not exists uq_jugador_posicion_principal
  on public.jugador_posicion(jugador_id)
  where es_principal;

-- ---------- Atributos deportivos (1:1 con jugador) ----------
-- Valoración del perfil (pentágono), NO estadísticas de partidos.
create table if not exists public.jugador_atributo (
  id                  uuid primary key default gen_random_uuid(),
  jugador_id          uuid not null unique references public.jugador(id) on delete cascade,
  ataque              smallint not null default 50 check (ataque between 0 and 100),
  tactica             smallint not null default 50 check (tactica between 0 and 100),
  tecnica             smallint not null default 50 check (tecnica between 0 and 100),
  defensa             smallint not null default 50 check (defensa between 0 and 100),
  creatividad         smallint not null default 50 check (creatividad between 0 and 100),
  fecha_actualizacion timestamptz not null default now()
);

-- ---------- Lesiones (1:N con jugador) ----------
-- Alcance médico limitado: sin historia clínica, diagnósticos, tratamientos
-- ni observaciones_medicas.
create table if not exists public.jugador_lesion (
  id                  uuid primary key default gen_random_uuid(),
  jugador_id          uuid not null references public.jugador(id) on delete cascade,
  parte_cuerpo        public.parte_cuerpo not null,
  nota                varchar(500) not null,
  fecha_inicio        date not null,
  fecha_fin           date,
  estado              public.estado_lesion not null default 'ACTIVA',
  fecha_creacion      timestamptz not null default now(),
  fecha_actualizacion timestamptz not null default now(),
  constraint chk_lesion_fechas check (fecha_fin is null or fecha_fin >= fecha_inicio)
);

create index if not exists idx_jugador_lesion_jugador_id
  on public.jugador_lesion(jugador_id);
create index if not exists idx_jugador_lesion_estado
  on public.jugador_lesion(estado);

-- ---------- RLS (deny-all; el acceso pasa por jugadores-ms con service role) ----------
alter table public.jugador          enable row level security;
alter table public.jugador_fisico   enable row level security;
alter table public.jugador_posicion enable row level security;
alter table public.jugador_atributo enable row level security;
alter table public.jugador_lesion   enable row level security;
