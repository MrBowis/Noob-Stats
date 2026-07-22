# Admin MS — Referencia de API para el Frontend

Microservicio de **administración de usuarios y roles** de Noob Stats. Sigue
arquitectura limpia y comparte la base de datos Supabase con `auth-ms` y
`equipos-ms` (opera sobre las tablas `rol`, `persona` y `usuario`; no crea
tablas nuevas).

- **Base URL (dev):** `http://localhost:3003`
- **Swagger UI:** `http://localhost:3003/docs` · **OpenAPI JSON:** `/docs-json`
- **Formato:** JSON en request y response.

---

## Autenticación y autorización

**Todas** las rutas requieren el `access_token` de Supabase (el que emite
`auth-ms`) en la cabecera, y el usuario debe tener rol **Administrador**:

```
Authorization: Bearer <access_token>
```

Si el token es válido pero el usuario no es Administrador, la respuesta es
`403 NotAdminError`.

---

## Formato de errores

```json
{ "statusCode": 404, "error": "RolNotFoundError", "message": "El rol no existe" }
```

| statusCode | Casos                                                                            |
| ---------- | -------------------------------------------------------------------------------- |
| 400        | Validación de DTO (`message` es un arreglo de strings)                           |
| 401        | Token ausente, inválido o expirado                                               |
| 403        | `NotAdminError` (el usuario no es Administrador)                                  |
| 404        | `RolNotFoundError`, `UsuarioNotFoundError`                                        |
| 409        | `RolAlreadyExistsError`, `RolInUseError`, `EmailAlreadyInUseError`               |
| 502        | `AdminProviderError` (error del proveedor de datos)                              |

---

## Modelos de respuesta

### Rol

```json
{ "id": "uuid", "nombreRol": "Entrenador", "descripcion": "Dirige equipos" }
```

### UsuarioDetalle

```json
{
  "id": "uuid-usuario",
  "email": "juan@example.com",
  "estado": "activo",
  "supabaseAuthId": "uuid-auth | null",
  "createdAt": "2026-07-09T12:00:00.000Z",
  "persona": {
    "id": "uuid",
    "nombres": "Juan",
    "apellidos": "Pérez",
    "correo": "juan@example.com",
    "fechaNacimiento": "2000-01-01",
    "createdAt": "2026-07-09T12:00:00.000Z"
  },
  "rol": { "id": "uuid", "nombreRol": "Futbolista", "descripcion": null }
}
```

`estado` ∈ `activo | inactivo`.

---

## Endpoints — Roles (`/roles`)

CRUD completo de la tabla `rol`.

#### `POST /roles` — Crear rol

```json
{ "nombreRol": "Arbitro", "descripcion": "Gestiona el arbitraje" }
```

Response `201` → `Rol`. Errores: `409 RolAlreadyExistsError`.

#### `GET /roles` — Listar roles

Response `200` → `Rol[]` (orden alfabético por `nombreRol`).

#### `GET /roles/:id` — Detalle de un rol

Response `200` → `Rol`. Errores: `404 RolNotFoundError`.

#### `PATCH /roles/:id` — Actualizar rol

Campos opcionales: `nombreRol`, `descripcion`.
Response `200` → `Rol`. Errores: `404`, `409 RolAlreadyExistsError`.

#### `DELETE /roles/:id` — Eliminar rol (borrado físico)

Response `204` sin cuerpo. Errores: `404`, **`409 RolInUseError`** si el rol
tiene usuarios asignados (no se elimina para no romper la integridad).

---

## Endpoints — Usuarios (`/usuarios`)

CRUD de la tabla `usuario`. **El borrado es lógico**: cambia `estado` a
`inactivo`, no elimina el registro.

#### `POST /usuarios` — Crear usuario

Crea la `Persona` y el `Usuario` de dominio con el rol indicado. **No** crea una
cuenta de acceso en Supabase Auth (`supabaseAuthId` queda `null`); el acceso se
provisiona por separado vía `auth-ms`.

```json
{
  "email": "nuevo@example.com",
  "nombres": "Ana",
  "apellidos": "López",
  "rolNombre": "Futbolista",
  "correo": "contacto@example.com",   // opcional (por defecto = email)
  "fechaNacimiento": "2001-05-10"     // opcional
}
```

Response `201` → `UsuarioDetalle`. Errores: `404 RolNotFoundError` (rol
inexistente), `409 EmailAlreadyInUseError`.

#### `GET /usuarios` — Listar usuarios

Query opcional `?estado=activo|inactivo` para filtrar.
Response `200` → `UsuarioDetalle[]` (orden por fecha de creación desc).

#### `GET /usuarios/:id` — Detalle de un usuario

Response `200` → `UsuarioDetalle`. Errores: `404 UsuarioNotFoundError`.

#### `PATCH /usuarios/:id` — Actualizar usuario

Permite editar datos de la persona, reasignar rol y cambiar estado. Todos los
campos son opcionales:

```json
{
  "nombres": "Ana María",
  "apellidos": "López",
  "correo": "nuevo-correo@example.com",
  "fechaNacimiento": "2001-05-10",
  "rolNombre": "Entrenador",
  "estado": "activo"
}
```

Response `200` → `UsuarioDetalle`. Errores: `404 UsuarioNotFoundError`,
`404 RolNotFoundError`.

> Reactivar un usuario dado de baja = `PATCH /usuarios/:id` con
> `{ "estado": "activo" }`.

#### `DELETE /usuarios/:id` — Desactivar usuario (borrado lógico)

No elimina el registro: cambia `estado` a `inactivo`.
Response `200` → `UsuarioDetalle` (con `estado: "inactivo"`).
Errores: `404 UsuarioNotFoundError`.

---

## Endpoints — Estadísticas (`/estadisticas`)

#### `GET /estadisticas` — Panel de administración

Devuelve métricas globales: usuarios registrados, total de equipos y la tabla
de posiciones (ranking de equipos por puntos, calculado con sus partidos
finalizados).

Response `200`:

```json
{
  "usuarios": { "total": 42, "activos": 38, "inactivos": 4 },
  "equipos": { "total": 7 },
  "tablaPosiciones": [
    {
      "equipoId": "uuid",
      "nombre": "Real Noob FC",
      "partidosJugados": 8,
      "victorias": 5,
      "empates": 2,
      "derrotas": 1,
      "golesFavor": 18,
      "golesContra": 9,
      "diferenciaGoles": 9,
      "puntos": 17
    }
  ]
}
```

Orden: `puntos` desc → `diferenciaGoles` desc → `golesFavor` desc → nombre.
`puntos` = `victorias * 3 + empates`. Errores: `403 NotAdminError`.

---

## Ejemplo de consumo (fetch)

```ts
const BASE = 'http://localhost:3003';

async function desactivarUsuario(accessToken: string, usuarioId: string) {
  const res = await fetch(`${BASE}/usuarios/${usuarioId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const err = await res.json(); // { statusCode, error, message }
    throw new Error(err.message);
  }
  return res.json(); // UsuarioDetalle con estado "inactivo"
}
```

---

## Variables de entorno (`.env`)

```
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
PORT=3003
ALLOWED_ORIGIN=http://localhost:8081
```
