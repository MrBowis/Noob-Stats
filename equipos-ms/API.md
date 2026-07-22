# Equipos MS — Referencia de API para el Frontend

Microservicio de gestión de **equipos, miembros, invitaciones, partidos y
estadísticas** de Noob Stats. Sigue arquitectura limpia y comparte la base de
datos Supabase con `auth-ms`.

- **Base URL (dev):** `http://localhost:3002`
- **Swagger UI:** `http://localhost:3002/docs` · **OpenAPI JSON:** `/docs-json`
- **Formato:** JSON en request y response.

---

## Autenticación

**Todas** las rutas requieren el `access_token` de Supabase (el mismo que emite
`auth-ms` al hacer login/registro) en la cabecera:

```
Authorization: Bearer <access_token>
```

El microservicio resuelve, a partir del token, el usuario de dominio y su rol:

- **Entrenador** → puede crear/editar/eliminar equipos, gestionar miembros,
  enviar/cancelar invitaciones y programar partidos.
- **Futbolista** → consulta los equipos a los que pertenece (miembros, partidos,
  estadísticas), ve y responde sus invitaciones, y puede salir de un equipo.

> El `id` que se usa en todas las relaciones (`entrenadorId`, `usuarioId`) es el
> `usuario.id` de dominio, **no** el `supabase_auth_id`.

---

## Formato de errores

Todos los errores de negocio devuelven la misma forma:

```json
{ "statusCode": 404, "error": "EquipoNotFoundError", "message": "El equipo no existe" }
```

| statusCode | Casos                                                                                             |
| ---------- | ------------------------------------------------------------------------------------------------- |
| 400        | `InvalidPlayerError` (el invitado no es Futbolista), validación de DTO                             |
| 401        | Token ausente, inválido o expirado                                                                |
| 403        | `NotEntrenadorError`, `NotEquipoOwnerError`, `ForbiddenEquipoAccessError`, `NotInvitacionOwnerError` |
| 404        | `EquipoNotFoundError`, `PartidoNotFoundError`, `InvitacionNotFoundError`, `UsuarioNotFoundError`, `MiembroNotFoundError` |
| 409        | `AlreadyMiembroError`, `InvitacionAlreadyExistsError`, `InvitacionNotPendingError`                 |
| 502        | `EquiposProviderError` (error del proveedor de datos)                                              |

Los errores de validación de DTO (400) usan el formato estándar de NestJS
(`message` es un arreglo de strings).

---

## Modelos de respuesta

### Equipo

```json
{
  "id": "uuid",
  "nombre": "Real Noob FC",
  "descripcion": "Equipo amateur de la liga local",
  "categoria": "Sub-20",
  "ciudad": "Quito",
  "escudoUrl": "https://cdn.example.com/escudo.png",
  "entrenadorId": "uuid-del-usuario-entrenador",
  "createdAt": "2026-07-09T12:00:00.000Z"
}
```

### MiembroDetalle

```json
{
  "id": "uuid-equipo_miembro",
  "usuarioId": "uuid-usuario",
  "nombres": "Juan",
  "apellidos": "Pérez",
  "email": "juan@example.com",
  "dorsal": 10,
  "posicion": "Delantero",
  "estado": "activo",
  "joinedAt": "2026-07-09T12:30:00.000Z"
}
```

### InvitacionDetalle

```json
{
  "id": "uuid",
  "equipoId": "uuid",
  "equipoNombre": "Real Noob FC",
  "usuarioId": "uuid-jugador",
  "jugadorNombres": "Juan",
  "jugadorApellidos": "Pérez",
  "jugadorEmail": "juan@example.com",
  "estado": "pendiente",
  "mensaje": "Únete a nuestro equipo",
  "createdAt": "2026-07-09T12:00:00.000Z",
  "respondedAt": null
}
```

`estado` ∈ `pendiente | aceptada | rechazada | cancelada`.

### Partido

```json
{
  "id": "uuid",
  "equipoId": "uuid",
  "rival": "Deportivo Rival",
  "fecha": "2026-08-15T18:00:00.000Z",
  "ubicacion": "Estadio Municipal",
  "esLocal": true,
  "estado": "programado",
  "golesFavor": null,
  "golesContra": null,
  "notas": null,
  "createdAt": "2026-07-09T12:00:00.000Z"
}
```

`estado` ∈ `programado | finalizado | cancelado`.

### PartidoDetalle

`Partido` + los eventos del encuentro:

```json
{
  "...": "campos de Partido",
  "goles": [
    {
      "id": "uuid",
      "partidoId": "uuid",
      "usuarioId": "uuid",
      "jugadorNombres": "Juan",
      "jugadorApellidos": "Pérez",
      "minuto": 23
    }
  ],
  "tarjetas": [
    {
      "id": "uuid",
      "partidoId": "uuid",
      "usuarioId": "uuid",
      "jugadorNombres": "Luis",
      "jugadorApellidos": "Gómez",
      "tipo": "amarilla",
      "minuto": 67
    }
  ]
}
```

`tipo` ∈ `amarilla | roja`.

### Formaciones y alineación

El equipo tiene una `formacion` limitada a: **`4-4-2`**, **`4-3-3`**,
**`4-2-3-1`**, **`3-5-2`**, **`5-3-2`**.

Cada miembro tiene un `slot` (casilla táctica dentro de la formación, `null` =
suplente). Las casillas por formación son:

| Formación | Casillas (slots) |
| --------- | ---------------- |
| 4-4-2     | GK, LB, DCL, DCR, RB, LM, MCL, MCR, RM, DL, DR |
| 4-3-3     | GK, LB, DCL, DCR, RB, MCL, MC, MCR, EI, DC, ED |
| 4-2-3-1   | GK, LB, DCL, DCR, RB, MCDL, MCDR, MPI, MP, MPD, DC |
| 3-5-2     | GK, DFI, DFC, DFD, CARI, MCL, MC, MCR, CARD, DL, DR |
| 5-3-2     | GK, CARI, DCL, DCC, DCR, CARD, MCL, MC, MCR, DL, DR |

Una casilla sólo puede estar ocupada por un jugador: al asignarla se libera
automáticamente del jugador que la tuviera.

### EstadisticasEquipo

```json
{
  "equipoId": "uuid",
  "totalMiembros": 12,
  "partidosJugados": 8,
  "victorias": 5,
  "empates": 2,
  "derrotas": 1,
  "golesFavor": 18,
  "golesContra": 9,
  "diferenciaGoles": 9,
  "puntos": 17,
  "partidosProgramados": 3,
  "proximoPartido": { "...": "Partido | null" }
}
```

---

## Endpoints

### Equipos

#### `POST /equipos` — Crear equipo _(Entrenador)_

Request:

```json
{
  "nombre": "Real Noob FC",
  "descripcion": "Equipo amateur",   // opcional
  "categoria": "Sub-20",              // opcional
  "ciudad": "Quito",                  // opcional
  "escudoUrl": "https://.../e.png"    // opcional, debe ser URL válida
}
```

Response `201` → `Equipo`. Errores: `403 NotEntrenadorError`.

#### `GET /equipos` — Listar mis equipos

Devuelve los equipos donde el usuario es entrenador **o** miembro.
Response `200` → `Equipo[]`.

#### `GET /equipos/:id` — Detalle de un equipo

Requiere ser el entrenador dueño o un miembro.
Response `200` → `Equipo`. Errores: `404`, `403 ForbiddenEquipoAccessError`.

#### `PATCH /equipos/:id` — Actualizar equipo _(dueño)_

Request (todos los campos opcionales): `nombre`, `descripcion`, `categoria`,
`ciudad`, `escudoUrl`, `formacion` (una de las 5 permitidas).
Response `200` → `Equipo`. Errores: `404`, `403`, `400` (formación inválida).

#### `DELETE /equipos/:id` — Eliminar equipo _(dueño)_

Response `204` sin cuerpo. Elimina en cascada miembros, invitaciones y partidos.
Errores: `404`, `403`.

---

### Miembros

#### `GET /equipos/:id/miembros` — Plantilla del equipo

Requiere ser dueño o miembro. Response `200` → `MiembroDetalle[]`.

#### `PATCH /equipos/:id/miembros/:usuarioId` — Editar miembro _(dueño)_

Request (opcionales): `dorsal` (0–999), `posicion`, `slot`, `estado`
(`activo|inactivo`).

```json
{ "dorsal": 10, "posicion": "Delantero", "slot": "DL" }
```

`slot` debe ser una casilla válida de la formación del equipo (`400
InvalidSlotError` si no lo es). Envía `"slot": null` para mandar al jugador a la
banca.

Response `200` → `EquipoMiembro`. Errores: `404 MiembroNotFoundError`, `403`.

#### `DELETE /equipos/:id/miembros/:usuarioId` — Sacar / salir del equipo

El entrenador dueño puede eliminar a cualquier jugador; un jugador puede
eliminarse a sí mismo (`usuarioId` == el suyo). Response `204`.
Errores: `404`, `403 ForbiddenEquipoAccessError`.

---

### Invitaciones

Flujo: el **entrenador** invita a un **Futbolista** por correo → la invitación
queda `pendiente` → el **jugador** la acepta (se crea el miembro) o la rechaza.

#### `POST /equipos/:id/invitaciones` — Invitar jugador _(dueño)_

Request:

```json
{
  "jugadorEmail": "jugador@example.com",
  "mensaje": "Únete a nuestro equipo"   // opcional
}
```

Response `201` → `Invitacion`. Errores:
`404 UsuarioNotFoundError` (correo no existe), `400 InvalidPlayerError` (no es
Futbolista), `409 AlreadyMiembroError`, `409 InvitacionAlreadyExistsError`,
`403 NotEquipoOwnerError`.

#### `GET /equipos/:id/invitaciones` — Invitaciones del equipo _(dueño)_

Response `200` → `InvitacionDetalle[]`.

#### `GET /invitaciones/mias` — Mis invitaciones _(jugador)_

Query opcional: `?pendientes=true` para filtrar sólo las pendientes.
Response `200` → `InvitacionDetalle[]`.

#### `POST /invitaciones/:id/responder` — Aceptar / rechazar _(jugador invitado)_

Request:

```json
{ "aceptar": true }
```

Response `200`:

```json
{
  "invitacion": { "...": "Invitacion (estado aceptada|rechazada)" },
  "miembro": { "...": "EquipoMiembro | null (null si se rechazó)" }
}
```

Errores: `404 InvitacionNotFoundError`, `403 NotInvitacionOwnerError`,
`409 InvitacionNotPendingError`.

#### `DELETE /invitaciones/:id` — Cancelar invitación _(entrenador dueño)_

Response `200` → `Invitacion` (estado `cancelada`).
Errores: `404`, `403`, `409 InvitacionNotPendingError`.

---

### Partidos

#### `POST /equipos/:id/partidos` — Programar partido _(dueño)_

Request:

```json
{
  "rival": "Deportivo Rival",
  "fecha": "2026-08-15T18:00:00.000Z",  // ISO 8601
  "ubicacion": "Estadio Municipal",      // opcional
  "esLocal": true,                        // opcional (default true)
  "notas": "Fecha 3"                      // opcional
}
```

Response `201` → `Partido` (estado `programado`). Errores: `404`, `403`.

#### `GET /equipos/:id/partidos` — Listar partidos

Query `?tipo=`:

- `proximos` → programados con fecha futura (orden ascendente).
- `anteriores` → finalizados (orden descendente) = **resultados**.
- `todos` (default) → todos, orden descendente por fecha.

Requiere ser dueño o miembro. Response `200` → `Partido[]`.

#### `GET /partidos/:id` — Detalle del partido con goles y tarjetas

Requiere ser dueño o miembro. Response `200` → `PartidoDetalle`.
Errores: `404 PartidoNotFoundError`, `403`.

#### `POST /partidos/:id/goles` — Registrar un gol _(dueño)_

```json
{ "usuarioId": "uuid-del-jugador", "minuto": 23 }
```

Response `201` → `Gol`. Errores: `404 PartidoNotFoundError`,
`404 MiembroNotFoundError` (el goleador no es del equipo), `403`.

#### `DELETE /partidos/:id/goles/:golId` — Eliminar un gol _(dueño)_

Response `204`. Errores: `404 GolNotFoundError`, `403`.

#### `POST /partidos/:id/tarjetas` — Registrar una tarjeta _(dueño)_

```json
{ "usuarioId": "uuid-del-jugador", "tipo": "amarilla", "minuto": 67 }
```

Response `201` → `Tarjeta`. Errores: `404 PartidoNotFoundError`,
`404 MiembroNotFoundError`, `403`.

#### `DELETE /partidos/:id/tarjetas/:tarjetaId` — Eliminar una tarjeta _(dueño)_

Response `204`. Errores: `404 TarjetaNotFoundError`, `403`.

#### `PATCH /partidos/:id` — Actualizar / registrar resultado _(dueño)_

Para **registrar el resultado** de un partido:

```json
{ "estado": "finalizado", "golesFavor": 2, "golesContra": 1 }
```

Otros campos opcionales: `rival`, `fecha`, `ubicacion`, `esLocal`, `notas`.
Response `200` → `Partido`. Errores: `404 PartidoNotFoundError`, `403`.

#### `DELETE /partidos/:id` — Eliminar partido _(dueño)_

Response `204`. Errores: `404`, `403`.

---

### Estadísticas

#### `GET /equipos/:id/estadisticas` — Estadísticas generales

Calcula agregados a partir de los partidos **finalizados** (con marcador) y la
plantilla. Requiere ser dueño o miembro. Response `200` → `EstadisticasEquipo`.

- `puntos` = `victorias * 3 + empates`.
- `proximoPartido` = el partido programado más próximo a futuro (o `null`).

---

## Ejemplo de consumo (fetch)

```ts
const BASE = 'http://localhost:3002';

async function crearEquipo(accessToken: string, nombre: string) {
  const res = await fetch(`${BASE}/equipos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ nombre }),
  });
  if (!res.ok) {
    const err = await res.json(); // { statusCode, error, message }
    throw new Error(err.message);
  }
  return res.json(); // Equipo
}
```

---

## Variables de entorno (`.env`)

```
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
PORT=3002
ALLOWED_ORIGIN=http://localhost:8081
```

## Tablas (migración `supabase/migrations/0002_equipos_module.sql`)

`equipo`, `equipo_miembro`, `invitacion`, `partido` — todas en el esquema
`public`, con RLS habilitado (deny-all) ya que el acceso pasa por este
microservicio con la service-role key. FK a `public.usuario(id)`.
