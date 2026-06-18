-- ========================================================
-- Noob Stats — Módulo de Autenticación
-- Tablas: rol, persona, usuario
-- Aplicada al proyecto Supabase mediante MCP (migración inicial).
-- ========================================================

create extension if not exists "pgcrypto";

-- ---------- Rol ----------
create table if not exists public.rol (
  id          uuid primary key default gen_random_uuid(),
  nombre_rol  varchar(50)  not null unique,
  descripcion varchar(150)
);

-- ---------- Persona ----------
create table if not exists public.persona (
  id               uuid primary key default gen_random_uuid(),
  nombres          varchar(100) not null,
  apellidos        varchar(100) not null,
  correo           varchar(150),
  fecha_nacimiento date,
  created_at       timestamptz not null default now()
);

-- ---------- Usuario ----------
create table if not exists public.usuario (
  id               uuid primary key default gen_random_uuid(),
  persona_id       uuid not null references public.persona(id) on delete cascade,
  rol_id           uuid not null references public.rol(id),
  supabase_auth_id uuid unique references auth.users(id) on delete cascade,
  email            varchar(150) not null unique,
  estado           varchar(30) not null default 'activo',
  created_at       timestamptz not null default now()
);

create index if not exists idx_usuario_supabase_auth_id on public.usuario(supabase_auth_id);
create index if not exists idx_usuario_persona_id on public.usuario(persona_id);
create index if not exists idx_usuario_rol_id on public.usuario(rol_id);

-- ---------- RLS ----------
-- Todo el acceso pasa por el microservicio auth-ms usando la service_role key,
-- que omite RLS. Habilitamos RLS sin políticas permisivas => deny-all para
-- clientes anon/authenticated, evitando exposición directa de las tablas.
alter table public.rol     enable row level security;
alter table public.persona enable row level security;
alter table public.usuario enable row level security;

-- ---------- Seed de roles ----------
insert into public.rol (nombre_rol, descripcion) values
  ('Futbolista',    'Jugador que registra estadísticas y notas de bienestar'),
  ('Entrenador',    'Dirige equipos y registra estadísticas de partido'),
  ('Administrador', 'Gestiona la plataforma y los usuarios')
on conflict (nombre_rol) do nothing;
