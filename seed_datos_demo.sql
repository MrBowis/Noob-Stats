-- ============================================================
-- Noob Stats — Datos de demostración
--
-- Crea un equipo completo que cubre los cuatro microservicios:
--   auth-ms      → auth.users, persona, usuario, rol
--   equipos-ms   → equipo, equipo_miembro, invitacion, partido,
--                  partido_gol, partido_tarjeta
--   jugadores-ms → jugador, jugador_fisico, jugador_posicion,
--                  jugador_atributo, jugador_lesion
--   admin-ms     → consume las tablas de auth-ms (sin tablas propias)
--
-- CREDENCIALES (contraseña idéntica para todas las cuentas):
--
--   Entrenador   entrenador.demo@noobstats.dev   NoobStats2026!
--   Futbolista   diego.chala@noobstats.dev       NoobStats2026!
--
--   (el resto de la plantilla usa la misma contraseña; ver la sección 2)
--
-- El script es idempotente: vuelve a ejecutarse sin duplicar nada porque
-- borra primero los registros por sus UUID fijos.
--
-- Uso:  psql "$DATABASE_URL" -f seed_datos_demo.sql
--       (o pegarlo en el SQL Editor de Supabase)
-- ============================================================

begin;

-- ------------------------------------------------------------
-- 0. Limpieza previa (permite reejecutar el script)
-- ------------------------------------------------------------
-- Todo cuelga de auth.users por FK en cascada: usuario → persona,
-- equipo, equipo_miembro, invitacion, partido, jugador y sus tablas hijas.
delete from auth.users
where email like '%@noobstats.dev';

-- El equipo se referencia por UUID fijo; se elimina por si quedó huérfano.
delete from public.equipo where id = 'e0000000-0000-4000-a000-000000000001';

-- ------------------------------------------------------------
-- 1. Extensiones necesarias para hashear contraseñas
-- ------------------------------------------------------------
create extension if not exists pgcrypto with schema extensions;

-- ------------------------------------------------------------
-- 2. Cuentas de acceso (auth-ms)
-- ------------------------------------------------------------
-- Contraseña común: NoobStats2026!
--
--   entrenador.demo@noobstats.dev   Entrenador   Marcelo Bielsa Rojas
--   diego.chala@noobstats.dev       Futbolista   Diego Chalá (portero)
--   bryan.angulo@noobstats.dev      Futbolista   Bryan Angulo
--   kevin.mena@noobstats.dev        Futbolista   Kevin Mena
--   jordy.caicedo@noobstats.dev     Futbolista   Jordy Caicedo
--   alan.franco@noobstats.dev       Futbolista   Alan Franco
--   piero.hincapie@noobstats.dev    Futbolista   Piero Hincapié
--   moises.ramirez@noobstats.dev    Futbolista   Moisés Ramírez
--   gonzalo.plata@noobstats.dev     Futbolista   Gonzalo Plata
--   angelo.preciado@noobstats.dev   Futbolista   Ángelo Preciado
--   jhegson.mendez@noobstats.dev    Futbolista   Jhegson Méndez
--   carlos.gruezo@noobstats.dev     Futbolista   Carlos Gruezo
--   damian.diaz@noobstats.dev       Futbolista   Damián Díaz (suplente)
--   michael.estrada@noobstats.dev   Futbolista   Michael Estrada (invitado)

with cuentas (auth_id, email, nombres, apellidos, fecha_nac, rol) as (
  values
    ('a0000000-0000-4000-a000-000000000001'::uuid, 'entrenador.demo@noobstats.dev', 'Marcelo',  'Bielsa Rojas',  date '1980-03-11', 'Entrenador'),
    ('a0000000-0000-4000-a000-000000000002'::uuid, 'diego.chala@noobstats.dev',     'Diego',    'Chalá',         date '1998-07-21', 'Futbolista'),
    ('a0000000-0000-4000-a000-000000000003'::uuid, 'bryan.angulo@noobstats.dev',    'Bryan',    'Angulo',        date '1996-02-14', 'Futbolista'),
    ('a0000000-0000-4000-a000-000000000004'::uuid, 'kevin.mena@noobstats.dev',      'Kevin',    'Mena',          date '2000-11-05', 'Futbolista'),
    ('a0000000-0000-4000-a000-000000000005'::uuid, 'jordy.caicedo@noobstats.dev',   'Jordy',    'Caicedo',       date '1997-09-18', 'Futbolista'),
    ('a0000000-0000-4000-a000-000000000006'::uuid, 'alan.franco@noobstats.dev',     'Alan',     'Franco',        date '1998-08-21', 'Futbolista'),
    ('a0000000-0000-4000-a000-000000000007'::uuid, 'piero.hincapie@noobstats.dev',  'Piero',    'Hincapié',      date '2002-01-09', 'Futbolista'),
    ('a0000000-0000-4000-a000-000000000008'::uuid, 'moises.ramirez@noobstats.dev',  'Moisés',   'Ramírez',       date '2000-05-30', 'Futbolista'),
    ('a0000000-0000-4000-a000-000000000009'::uuid, 'gonzalo.plata@noobstats.dev',   'Gonzalo',  'Plata',         date '2000-11-01', 'Futbolista'),
    ('a0000000-0000-4000-a000-00000000000a'::uuid, 'angelo.preciado@noobstats.dev', 'Ángelo',   'Preciado',      date '1998-02-18', 'Futbolista'),
    ('a0000000-0000-4000-a000-00000000000b'::uuid, 'jhegson.mendez@noobstats.dev',  'Jhegson',  'Méndez',        date '1997-04-26', 'Futbolista'),
    ('a0000000-0000-4000-a000-00000000000c'::uuid, 'carlos.gruezo@noobstats.dev',   'Carlos',   'Gruezo',        date '1995-04-19', 'Futbolista'),
    ('a0000000-0000-4000-a000-00000000000d'::uuid, 'damian.diaz@noobstats.dev',     'Damián',   'Díaz',          date '1986-10-11', 'Futbolista'),
    ('a0000000-0000-4000-a000-00000000000e'::uuid, 'michael.estrada@noobstats.dev', 'Michael',  'Estrada',       date '1996-04-07', 'Futbolista')
),

-- 2.1 Usuarios de Supabase Auth (email + contraseña, ya confirmados)
nuevos_auth as (
  -- Las columnas de token deben ir en cadena vacía, nunca NULL: GoTrue las
  -- lee como `string` y un NULL rompe el login con
  -- "Database error querying schema".
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data,
    confirmation_token, recovery_token, email_change,
    email_change_token_new, email_change_token_current,
    phone_change, phone_change_token, reauthentication_token
  )
  select
    '00000000-0000-0000-0000-000000000000',
    c.auth_id,
    'authenticated',
    'authenticated',
    c.email,
    extensions.crypt('NoobStats2026!', extensions.gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('full_name', c.nombres || ' ' || c.apellidos),
    '', '', '', '', '', '', '', ''
  from cuentas c
  returning id, email
),

-- 2.2 Identidad de proveedor "email" (GoTrue la exige para el login)
nuevas_identidades as (
  -- `auth.identities.email` es una columna generada: se deriva de identity_data.
  insert into auth.identities (
    provider_id, user_id, identity_data, provider,
    last_sign_in_at, created_at, updated_at
  )
  select
    n.id::text,
    n.id,
    jsonb_build_object(
      'sub', n.id::text,
      'email', n.email,
      'email_verified', true,
      'phone_verified', false
    ),
    'email',
    now(), now(), now()
  from nuevos_auth n
  returning user_id
),

-- 2.3 Persona (datos de identidad del dominio)
nuevas_personas as (
  insert into public.persona (nombres, apellidos, correo, fecha_nacimiento)
  select c.nombres, c.apellidos, c.email, c.fecha_nac
  from cuentas c
  returning id, correo
)

-- 2.4 Usuario de dominio (enlaza persona + rol + cuenta de Supabase)
insert into public.usuario (persona_id, rol_id, supabase_auth_id, email, estado)
select p.id, r.id, c.auth_id, c.email, 'activo'
from cuentas c
join nuevas_personas p on p.correo = c.email
join public.rol r on r.nombre_rol = c.rol
-- Fuerza la materialización de los CTE anteriores.
where (select count(*) from nuevas_identidades) > 0;

-- ------------------------------------------------------------
-- 3. Equipo, plantilla e invitaciones (equipos-ms)
-- ------------------------------------------------------------
insert into public.equipo (
  id, nombre, descripcion, categoria, ciudad, escudo_url, formacion, entrenador_id
)
select
  'e0000000-0000-4000-a000-000000000001',
  'Noob FC',
  'Equipo amateur de la liga barrial de Quito. Fundado en 2019.',
  'Sub-23',
  'Quito',
  'https://cdn.jsdelivr.net/gh/twitter/twemoji/assets/72x72/26bd.png',
  '4-4-2',
  u.id
from public.usuario u
where u.email = 'entrenador.demo@noobstats.dev';

-- 3.1 Plantilla: 11 titulares con su casilla táctica del 4-4-2 + 2 suplentes
insert into public.equipo_miembro (equipo_id, usuario_id, dorsal, posicion, slot, estado)
select
  'e0000000-0000-4000-a000-000000000001',
  u.id, m.dorsal, m.posicion, m.slot, 'activo'
from (values
    ('diego.chala@noobstats.dev',      1, 'Portero',        'GK'),
    ('angelo.preciado@noobstats.dev',  2, 'Lateral derecho','RB'),
    ('piero.hincapie@noobstats.dev',   3, 'Central',        'DCL'),
    ('alan.franco@noobstats.dev',      4, 'Central',        'DCR'),
    ('carlos.gruezo@noobstats.dev',    5, 'Lateral izq.',   'LB'),
    ('jhegson.mendez@noobstats.dev',   6, 'Mediocentro',    'MCL'),
    ('damian.diaz@noobstats.dev',     10, 'Mediocentro',    'MCR'),
    ('gonzalo.plata@noobstats.dev',    7, 'Extremo derecho','RM'),
    ('kevin.mena@noobstats.dev',      11, 'Extremo izq.',   'LM'),
    ('jordy.caicedo@noobstats.dev',    9, 'Delantero',      'DL'),
    ('bryan.angulo@noobstats.dev',    19, 'Delantero',      'DR'),
    ('moises.ramirez@noobstats.dev',  12, 'Portero',        null),
    ('michael.estrada@noobstats.dev', 21, 'Delantero',      null)
  ) as m(email, dorsal, posicion, slot)
join public.usuario u on u.email = m.email;

-- 3.2 Invitaciones: una aceptada y una pendiente
insert into public.invitacion (equipo_id, usuario_id, estado, mensaje, responded_at)
select
  'e0000000-0000-4000-a000-000000000001',
  u.id, 'aceptada',
  'Te esperamos en el Noob FC, necesitamos un 9.',
  now() - interval '40 days'
from public.usuario u where u.email = 'jordy.caicedo@noobstats.dev';

insert into public.invitacion (equipo_id, usuario_id, estado, mensaje)
select
  'e0000000-0000-4000-a000-000000000001',
  u.id, 'pendiente',
  'Nos hace falta un delantero para el torneo de apertura.'
from public.usuario u where u.email = 'damian.diaz@noobstats.dev';

-- ------------------------------------------------------------
-- 4. Partidos, goles y tarjetas (equipos-ms)
-- ------------------------------------------------------------
insert into public.partido (
  id, equipo_id, rival, fecha, ubicacion, es_local, estado,
  goles_favor, goles_contra, notas
)
values
  ('b0000000-0000-4000-a000-000000000001',
   'e0000000-0000-4000-a000-000000000001',
   'Deportivo Cotocollao', now() - interval '35 days',
   'Cancha La Concordia', true,  'finalizado', 3, 1, 'Fecha 1 — buen arranque'),
  ('b0000000-0000-4000-a000-000000000002',
   'e0000000-0000-4000-a000-000000000001',
   'Atlético Carcelén',   now() - interval '28 days',
   'Estadio Municipal',   false, 'finalizado', 1, 1, 'Fecha 2 — empate sufrido'),
  ('b0000000-0000-4000-a000-000000000003',
   'e0000000-0000-4000-a000-000000000001',
   'Real Chillogallo',    now() - interval '21 days',
   'Cancha La Concordia', true,  'finalizado', 2, 0, 'Fecha 3 — portería en cero'),
  ('b0000000-0000-4000-a000-000000000004',
   'e0000000-0000-4000-a000-000000000001',
   'Independiente Sur',   now() - interval '14 days',
   'Complejo El Ejido',   false, 'finalizado', 0, 2, 'Fecha 4 — derrota de visita'),
  ('b0000000-0000-4000-a000-000000000005',
   'e0000000-0000-4000-a000-000000000001',
   'Ferroviarios FC',     now() + interval '5 days',
   'Cancha La Concordia', true,  'programado', null, null, 'Fecha 5'),
  ('b0000000-0000-4000-a000-000000000006',
   'e0000000-0000-4000-a000-000000000001',
   'Juventud Calderón',   now() + interval '12 days',
   'Parque Bicentenario', false, 'programado', null, null, 'Fecha 6'),
  ('b0000000-0000-4000-a000-000000000007',
   'e0000000-0000-4000-a000-000000000001',
   'Los Chillos United',  now() - interval '7 days',
   'Cancha del Valle',    true,  'cancelado',  null, null, 'Suspendido por lluvia');

-- 4.1 Goleadores (suman exactamente los goles_favor de cada partido)
insert into public.partido_gol (partido_id, usuario_id, minuto)
select g.partido_id, u.id, g.minuto
from (values
    ('b0000000-0000-4000-a000-000000000001'::uuid, 'jordy.caicedo@noobstats.dev',  12),
    ('b0000000-0000-4000-a000-000000000001'::uuid, 'jordy.caicedo@noobstats.dev',  57),
    ('b0000000-0000-4000-a000-000000000001'::uuid, 'gonzalo.plata@noobstats.dev',  78),
    ('b0000000-0000-4000-a000-000000000002'::uuid, 'bryan.angulo@noobstats.dev',   66),
    ('b0000000-0000-4000-a000-000000000003'::uuid, 'kevin.mena@noobstats.dev',     23),
    ('b0000000-0000-4000-a000-000000000003'::uuid, 'jordy.caicedo@noobstats.dev',  81)
  ) as g(partido_id, email, minuto)
join public.usuario u on u.email = g.email;

-- 4.2 Tarjetas
insert into public.partido_tarjeta (partido_id, usuario_id, tipo, minuto)
select t.partido_id, u.id, t.tipo, t.minuto
from (values
    ('b0000000-0000-4000-a000-000000000001'::uuid, 'carlos.gruezo@noobstats.dev',   'amarilla', 34),
    ('b0000000-0000-4000-a000-000000000002'::uuid, 'alan.franco@noobstats.dev',     'amarilla', 41),
    ('b0000000-0000-4000-a000-000000000002'::uuid, 'jhegson.mendez@noobstats.dev',  'amarilla', 72),
    ('b0000000-0000-4000-a000-000000000004'::uuid, 'piero.hincapie@noobstats.dev',  'roja',     58),
    ('b0000000-0000-4000-a000-000000000004'::uuid, 'angelo.preciado@noobstats.dev', 'amarilla', 30)
  ) as t(partido_id, email, tipo, minuto)
join public.usuario u on u.email = t.email;

-- ------------------------------------------------------------
-- 5. Perfiles deportivos (jugadores-ms)
-- ------------------------------------------------------------
-- Nombre y fecha de nacimiento NO se replican aquí: viven en auth-ms.
insert into public.jugador (
  user_id, genero, nacionalidad, foto_url, pierna_habil, estado
)
select u.id, j.genero::public.genero_jugador, j.nacionalidad, j.foto_url,
       j.pierna::public.pierna_habil, j.estado::public.estado_jugador
from (values
    ('diego.chala@noobstats.dev',      'MASCULINO', 'Ecuatoriana', 'https://i.pravatar.cc/300?img=11', 'DERECHA',   'ACTIVO'),
    ('angelo.preciado@noobstats.dev',  'MASCULINO', 'Ecuatoriana', 'https://i.pravatar.cc/300?img=12', 'DERECHA',   'ACTIVO'),
    ('piero.hincapie@noobstats.dev',   'MASCULINO', 'Ecuatoriana', 'https://i.pravatar.cc/300?img=13', 'IZQUIERDA', 'LESIONADO'),
    ('alan.franco@noobstats.dev',      'MASCULINO', 'Ecuatoriana', 'https://i.pravatar.cc/300?img=14', 'DERECHA',   'ACTIVO'),
    ('carlos.gruezo@noobstats.dev',    'MASCULINO', 'Ecuatoriana', 'https://i.pravatar.cc/300?img=15', 'IZQUIERDA', 'ACTIVO'),
    ('jhegson.mendez@noobstats.dev',   'MASCULINO', 'Ecuatoriana', 'https://i.pravatar.cc/300?img=16', 'DERECHA',   'ACTIVO'),
    ('damian.diaz@noobstats.dev',      'MASCULINO', 'Argentina',   'https://i.pravatar.cc/300?img=17', 'DERECHA',   'ACTIVO'),
    ('gonzalo.plata@noobstats.dev',    'MASCULINO', 'Ecuatoriana', 'https://i.pravatar.cc/300?img=18', 'IZQUIERDA', 'ACTIVO'),
    ('kevin.mena@noobstats.dev',       'MASCULINO', 'Ecuatoriana', 'https://i.pravatar.cc/300?img=19', 'AMBAS',     'ACTIVO'),
    ('jordy.caicedo@noobstats.dev',    'MASCULINO', 'Ecuatoriana', 'https://i.pravatar.cc/300?img=20', 'DERECHA',   'ACTIVO'),
    ('bryan.angulo@noobstats.dev',     'MASCULINO', 'Ecuatoriana', 'https://i.pravatar.cc/300?img=21', 'DERECHA',   'ACTIVO'),
    ('moises.ramirez@noobstats.dev',   'MASCULINO', 'Ecuatoriana', 'https://i.pravatar.cc/300?img=22', 'DERECHA',   'INACTIVO'),
    ('michael.estrada@noobstats.dev',  'MASCULINO', 'Ecuatoriana', 'https://i.pravatar.cc/300?img=23', 'DERECHA',   'ACTIVO')
  ) as j(email, genero, nacionalidad, foto_url, pierna, estado)
join public.usuario u on u.email = j.email;

-- 5.1 Datos físicos (relación 1:1)
insert into public.jugador_fisico (jugador_id, altura_cm, peso_kg)
select ju.id, f.altura, f.peso
from (values
    ('diego.chala@noobstats.dev',      188.0, 84.5),
    ('angelo.preciado@noobstats.dev',  174.5, 70.0),
    ('piero.hincapie@noobstats.dev',   184.0, 79.0),
    ('alan.franco@noobstats.dev',      182.5, 77.5),
    ('carlos.gruezo@noobstats.dev',    175.0, 72.0),
    ('jhegson.mendez@noobstats.dev',   178.0, 74.0),
    ('damian.diaz@noobstats.dev',      172.0, 71.5),
    ('gonzalo.plata@noobstats.dev',    179.0, 73.0),
    ('kevin.mena@noobstats.dev',       176.5, 70.5),
    ('jordy.caicedo@noobstats.dev',    186.0, 81.0),
    ('bryan.angulo@noobstats.dev',     181.0, 78.0),
    ('moises.ramirez@noobstats.dev',   185.0, 82.0),
    ('michael.estrada@noobstats.dev',  183.0, 80.0)
  ) as f(email, altura, peso)
join public.usuario u on u.email = f.email
join public.jugador ju on ju.user_id = u.id;

-- 5.2 Posiciones (una principal por jugador + secundarias)
insert into public.jugador_posicion (jugador_id, posicion, es_principal)
select ju.id, p.posicion::public.posicion_jugador, p.principal
from (values
    ('diego.chala@noobstats.dev',      'PORTERO',       true),
    ('angelo.preciado@noobstats.dev',  'DEFENSA',       true),
    ('angelo.preciado@noobstats.dev',  'MEDIOCAMPISTA', false),
    ('piero.hincapie@noobstats.dev',   'DEFENSA',       true),
    ('alan.franco@noobstats.dev',      'DEFENSA',       true),
    ('alan.franco@noobstats.dev',      'MEDIOCAMPISTA', false),
    ('carlos.gruezo@noobstats.dev',    'DEFENSA',       true),
    ('jhegson.mendez@noobstats.dev',   'MEDIOCAMPISTA', true),
    ('jhegson.mendez@noobstats.dev',   'DEFENSA',       false),
    ('damian.diaz@noobstats.dev',      'MEDIOCAMPISTA', true),
    ('gonzalo.plata@noobstats.dev',    'DELANTERO',     true),
    ('gonzalo.plata@noobstats.dev',    'MEDIOCAMPISTA', false),
    ('kevin.mena@noobstats.dev',       'MEDIOCAMPISTA', true),
    ('kevin.mena@noobstats.dev',       'DELANTERO',     false),
    ('jordy.caicedo@noobstats.dev',    'DELANTERO',     true),
    ('bryan.angulo@noobstats.dev',     'DELANTERO',     true),
    ('moises.ramirez@noobstats.dev',   'PORTERO',       true),
    ('michael.estrada@noobstats.dev',  'DELANTERO',     true)
  ) as p(email, posicion, principal)
join public.usuario u on u.email = p.email
join public.jugador ju on ju.user_id = u.id;

-- 5.3 Atributos del pentágono (0-100). No son estadísticas de partidos.
insert into public.jugador_atributo (
  jugador_id, ataque, tactica, tecnica, defensa, creatividad
)
select ju.id, a.ataque, a.tactica, a.tecnica, a.defensa, a.creatividad
from (values
    ('diego.chala@noobstats.dev',      18, 74, 62, 88, 40),
    ('angelo.preciado@noobstats.dev',  58, 72, 70, 78, 61),
    ('piero.hincapie@noobstats.dev',   42, 84, 74, 89, 55),
    ('alan.franco@noobstats.dev',      38, 80, 68, 86, 50),
    ('carlos.gruezo@noobstats.dev',    52, 76, 71, 80, 58),
    ('jhegson.mendez@noobstats.dev',   60, 85, 78, 74, 72),
    ('damian.diaz@noobstats.dev',      74, 88, 91, 42, 95),
    ('gonzalo.plata@noobstats.dev',    82, 66, 88, 34, 86),
    ('kevin.mena@noobstats.dev',       70, 71, 84, 46, 79),
    ('jordy.caicedo@noobstats.dev',    89, 68, 76, 30, 64),
    ('bryan.angulo@noobstats.dev',     85, 64, 79, 28, 70),
    ('moises.ramirez@noobstats.dev',   15, 70, 58, 84, 36),
    ('michael.estrada@noobstats.dev',  81, 62, 73, 32, 66)
  ) as a(email, ataque, tactica, tecnica, defensa, creatividad)
join public.usuario u on u.email = a.email
join public.jugador ju on ju.user_id = u.id;

-- 5.4 Historial de lesiones (alcance médico limitado)
insert into public.jugador_lesion (
  jugador_id, parte_cuerpo, nota, fecha_inicio, fecha_fin, estado
)
select ju.id, l.parte::public.parte_cuerpo, l.nota,
       l.inicio, l.fin, l.estado::public.estado_lesion
from (values
    ('piero.hincapie@noobstats.dev',  'RODILLA',     'Molestia en el ligamento tras un choque', current_date - 10, null,               'ACTIVA'),
    ('piero.hincapie@noobstats.dev',  'TOBILLO',     'Esguince leve en entrenamiento',          current_date - 120, current_date - 95, 'RECUPERADA'),
    ('jordy.caicedo@noobstats.dev',   'MUSLO',       'Distensión muscular leve',                current_date - 45,  current_date - 30, 'RECUPERADA'),
    ('carlos.gruezo@noobstats.dev',   'PANTORRILLA', 'Sobrecarga por exceso de partidos',       current_date - 18,  null,              'EN_RECUPERACION'),
    ('damian.diaz@noobstats.dev',     'ESPALDA',     'Dolor lumbar recurrente',                 current_date - 300, null,              'CRONICA'),
    ('moises.ramirez@noobstats.dev',  'MANO',        'Golpe en los dedos atajando un remate',   current_date - 60,  current_date - 52, 'RECUPERADA'),
    ('bryan.angulo@noobstats.dev',    'INGLE',       'Molestia tras el partido de la fecha 2',  current_date - 26,  current_date - 15, 'RECUPERADA')
  ) as l(email, parte, nota, inicio, fin, estado)
join public.usuario u on u.email = l.email
join public.jugador ju on ju.user_id = u.id;

commit;

-- ------------------------------------------------------------
-- 6. Comprobación rápida
-- ------------------------------------------------------------
select
  (select count(*) from public.usuario  where email like '%@noobstats.dev')                                  as usuarios,
  (select count(*) from public.equipo_miembro where equipo_id = 'e0000000-0000-4000-a000-000000000001')      as plantilla,
  (select count(*) from public.partido        where equipo_id = 'e0000000-0000-4000-a000-000000000001')      as partidos,
  (select count(*) from public.partido_gol  g join public.partido p on p.id = g.partido_id
     where p.equipo_id = 'e0000000-0000-4000-a000-000000000001')                                             as goles,
  (select count(*) from public.jugador     ju join public.usuario u on u.id = ju.user_id
     where u.email like '%@noobstats.dev')                                                                   as perfiles,
  (select count(*) from public.jugador_lesion l join public.jugador ju on ju.id = l.jugador_id
     join public.usuario u on u.id = ju.user_id where u.email like '%@noobstats.dev')                        as lesiones;
