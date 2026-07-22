# Jugadores MS — Referencia de API para el Frontend

Microservicio del **perfil deportivo del futbolista amateur** de Noob Stats.
Sigue arquitectura limpia y comparte la base de datos Supabase con `auth-ms` y
`equipos-ms`.

- **Base URL (dev):** `http://localhost:3004`
- **Swagger UI:** `http://localhost:3004/docs` · **OpenAPI JSON:** `/docs-json`
- **Formato:** JSON en request y response.

---

## Frontera del dominio

Lo que administra este microservicio y lo que **no**:

| Dato                                                        | Microservicio |
| ----------------------------------------------------------- | ------------- |
| Nombres, apellidos, correo, **fecha de nacimiento**          | `auth-ms`     |
| Posición, pierna hábil, altura, peso, atributos, lesiones    | `jugadores-ms` |
| Equipos, plantillas, partidos, goles, tarjetas, estadísticas | `equipos-ms`  |

Consecuencias prácticas:

- **No existe** `jugador.fechaNacimiento` en la tabla: la administra
  `public.persona` (auth-ms) y se lee en `GET /jugadores/:id/resumen`.
- **No existe** ninguna tabla de estadísticas de partido. Goles, asistencias,
  minutos, tarjetas, titularidades, atajadas y goles recibidos se piden a
  `equipos-ms` (`GET /partidos/:id`, `GET /equipos/:id/estadisticas`).
- Los **atributos** (`ataque`, `tactica`, `tecnica`, `defensa`, `creatividad`)
  son una **valoración del perfil** de 0 a 100, no estadísticas de partidos.

---

## Autenticación

Todas las rutas requieren el `access_token` de Supabase (el mismo que emite
`auth-ms`) en la cabecera:

```
Authorization: Bearer <access_token>
```

### Reglas de autorización

- **Lectura:** la información deportiva es pública para cualquier usuario
  autenticado (`GET` → permitido).
- **Escritura:** sólo el propietario del perfil (`auth.userId == jugador.userId`),
  de lo contrario `403 NotJugadorOwnerError`.
- El `userId` del perfil **nunca** lo envía el cliente: sale del token.

> El `userId` es el `usuario.id` de dominio (el mismo que usa `equipos-ms`),
> **no** el `supabase_auth_id`.

---

## Formato de errores

```json
{
  "statusCode": 403,
  "error": "NotJugadorOwnerError",
  "message": "Sólo el propietario puede modificar este perfil"
}
```

| statusCode | Casos                                                                              |
| ---------- | ---------------------------------------------------------------------------------- |
| 400        | `InvalidLesionFechasError`, `InvalidPosicionPrincipalError`, `InvalidFotoError`, validación de DTO |
| 401        | Token ausente, inválido o expirado                                                 |
| 403        | `NotJugadorOwnerError`                                                             |
| 404        | `JugadorNotFoundError`, `UsuarioNotFoundError`, `PosicionNotFoundError`, `LesionNotFoundError` |
| 409        | `JugadorAlreadyExistsError`, `PosicionAlreadyExistsError`                           |
| 502        | `JugadoresProviderError`, `EquiposGatewayError`                                     |

Los errores de validación de DTO (400) usan el formato estándar de NestJS
(`message` es un arreglo de strings).

---

## Catálogos (ENUM)

```text
genero        MASCULINO | FEMENINO | OTRO | PREFIERO_NO_DECIR
estado        ACTIVO | INACTIVO | LESIONADO | RETIRADO
piernaHabil   DERECHA | IZQUIERDA | AMBAS
posicion      PORTERO | DEFENSA | MEDIOCAMPISTA | DELANTERO
estadoLesion  ACTIVA | EN_RECUPERACION | RECUPERADA | CRONICA

parteCuerpo   CABEZA CUELLO HOMBRO BRAZO CODO ANTEBRAZO MUNECA MANO DEDOS_MANO
              PECHO ESPALDA CADERA INGLE MUSLO RODILLA PANTORRILLA TOBILLO PIE
              DEDOS_PIE OTRA
```

---

## Modelos de respuesta

### Jugador

```json
{
  "id": "uuid",
  "userId": "uuid",
  "genero": "MASCULINO",
  "nacionalidad": "Ecuatoriana",
  "fotoUrl": "https://cdn.example.com/foto.png",
  "piernaHabil": "DERECHA",
  "estado": "ACTIVO",
  "fechaCreacion": "2026-07-01T00:00:00.000Z",
  "fechaActualizacion": "2026-07-01T00:00:00.000Z"
}
```

### JugadorFisico

```json
{
  "id": "uuid",
  "jugadorId": "uuid",
  "alturaCm": 178.5,
  "pesoKg": 72.0,
  "fechaActualizacion": "2026-07-01T00:00:00.000Z"
}
```

`GET` devuelve `null` si el jugador todavía no ha registrado sus medidas.

### JugadorPosicion

```json
{
  "id": "uuid",
  "jugadorId": "uuid",
  "posicion": "PORTERO",
  "esPrincipal": true
}
```

### JugadorAtributo

```json
{
  "id": "uuid",
  "jugadorId": "uuid",
  "ataque": 82,
  "tactica": 70,
  "tecnica": 88,
  "defensa": 45,
  "creatividad": 91,
  "fechaActualizacion": "2026-07-01T00:00:00.000Z"
}
```

### JugadorLesion

```json
{
  "id": "uuid",
  "jugadorId": "uuid",
  "parteCuerpo": "TOBILLO",
  "nota": "Esguince de tobillo",
  "fechaInicio": "2026-05-15",
  "fechaFin": null,
  "estado": "ACTIVA",
  "fechaCreacion": "2026-05-15T00:00:00.000Z",
  "fechaActualizacion": "2026-05-15T00:00:00.000Z"
}
```

---

## Endpoints

### Perfil

#### `POST /jugadores` — Crear mi perfil

Request (todos los campos opcionales):

```json
{
  "genero": "MASCULINO",
  "nacionalidad": "Ecuatoriana",
  "fotoUrl": "https://cdn.example.com/foto.png",
  "piernaHabil": "DERECHA",
  "estado": "ACTIVO"
}
```

El propietario sale del token. Response `201` → `Jugador`.
Errores: `409 JugadorAlreadyExistsError`.

#### `GET /jugadores` — Listar jugadores

Query opcionales: `?posicion=`, `?piernaHabil=`, `?estado=`. El filtro por
posición incluye principal **y** secundarias.

```
GET /jugadores?posicion=PORTERO&estado=ACTIVO
```

Response `200` → `Jugador[]`.

#### `GET /jugadores/me` — Mi propio perfil

Atajo para que el frontend no tenga que conocer su `jugadorId`.
Response `200` → `Jugador`. Errores: `404` si aún no lo ha creado.

#### `GET /jugadores/:jugadorId` — Perfil público

Response `200` → `Jugador`. Errores: `404 JugadorNotFoundError`.

#### `PUT /jugadores/:jugadorId` — Actualizar mi perfil _(propietario)_

Mismos campos que `POST`, todos opcionales. **No** acepta `userId` ni nada del
dominio de `equipos-ms`. Response `200` → `Jugador`. Errores: `403`, `404`.

#### `POST /jugadores/:jugadorId/foto` — Subir mi foto _(propietario)_

`multipart/form-data` con un único campo `file`.

```bash
curl -X POST "$BASE/jugadores/$ID/foto" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@perfil.jpg"
```

Guarda la imagen en el bucket público `Perfil` de Supabase Storage bajo
`jugadores/{jugadorId}/perfil-{timestamp}.{ext}` y actualiza `fotoUrl`.

Formatos: JPG, PNG, WEBP o GIF. Tamaño máximo: 5 MB.

Response `200` → `Jugador` (con la nueva `fotoUrl`).
Errores: `400 InvalidFotoError` (tipo o tamaño inválido, archivo ausente),
`403`, `502 JugadoresProviderError` (fallo del Storage).

---

### Datos físicos

#### `GET /jugadores/:jugadorId/fisico`

Response `200` → `JugadorFisico | null`.

#### `PUT /jugadores/:jugadorId/fisico` — _(propietario)_

```json
{ "alturaCm": 178.5, "pesoKg": 72 }
```

Crea el registro si no existe (upsert 1:1). Response `200` → `JugadorFisico`.
Errores: `403`, `404`.

---

### Posiciones

#### `GET /jugadores/:jugadorId/posiciones`

Response `200` → `JugadorPosicion[]` (la principal primero).

#### `POST /jugadores/:jugadorId/posiciones` — _(propietario)_

```json
{ "posicion": "PORTERO", "esPrincipal": true }
```

Reglas:

- La **primera** posición registrada se marca como principal automáticamente si
  no se envía `esPrincipal`.
- Al marcar una nueva principal, la anterior pasa a secundaria (**máximo una
  principal por jugador**).

Response `201` → `JugadorPosicion`. Errores: `409 PosicionAlreadyExistsError`,
`403`.

#### `PUT /jugadores/:jugadorId/posiciones/:posicionId` — _(propietario)_

Campos opcionales: `posicion`, `esPrincipal`. Response `200` →
`JugadorPosicion`. Errores: `404 PosicionNotFoundError`, `409`, `403`.

#### `DELETE /jugadores/:jugadorId/posiciones/:posicionId` — _(propietario)_

Response `204` sin cuerpo. Errores: `404`, `403`.

---

### Atributos

#### `GET /jugadores/:jugadorId/atributos`

Response `200` → `JugadorAtributo | null`.

#### `PUT /jugadores/:jugadorId/atributos` — _(propietario)_

Los cinco valores son **obligatorios** y deben estar entre 0 y 100:

```json
{
  "ataque": 82,
  "tactica": 70,
  "tecnica": 88,
  "defensa": 45,
  "creatividad": 91
}
```

Response `200` → `JugadorAtributo`. Errores: `400` (fuera de rango), `403`.

#### `GET /jugadores/:jugadorId/resumen-atributos` — Pentágono

Respuesta mínima optimizada para el gráfico radar del frontend. Si el jugador
no ha guardado sus atributos, devuelve los valores por defecto (50).

```json
{
  "jugadorId": "550e8400-e29b-41d4-a716-446655440000",
  "atributos": {
    "ataque": 82,
    "tactica": 70,
    "tecnica": 88,
    "defensa": 45,
    "creatividad": 91
  }
}
```

No incluye estadísticas de partidos.

---

### Resumen

#### `GET /jugadores/:jugadorId/resumen` — Tarjeta de perfil

Combina el perfil, físico, posiciones y atributos, más la identidad leída de
`auth-ms`.

```json
{
  "jugadorId": "uuid",
  "userId": "uuid",
  "nombres": "Juan",
  "apellidos": "Pérez",
  "fechaNacimiento": "2002-05-15",
  "nacionalidad": "Ecuatoriana",
  "fotoUrl": "https://...",
  "estado": "ACTIVO",
  "posicionPrincipal": "DELANTERO",
  "posicionesSecundarias": ["MEDIOCAMPISTA"],
  "piernaHabil": "DERECHA",
  "alturaCm": 178.5,
  "pesoKg": 72.0,
  "atributos": {
    "ataque": 82,
    "tactica": 70,
    "tecnica": 88,
    "defensa": 45,
    "creatividad": 91
  }
}
```

---

### Lesiones

Alcance médico limitado: parte del cuerpo, estado, fechas y una nota breve.
Sin historia clínica, diagnósticos, tratamientos ni observaciones médicas.

#### `GET /jugadores/:jugadorId/lesiones`

Query opcional `?estado=ACTIVA`. Response `200` → `JugadorLesion[]`
(más reciente primero).

#### `POST /jugadores/:jugadorId/lesiones` — _(propietario)_

```json
{
  "parteCuerpo": "TOBILLO",
  "nota": "Esguince de tobillo",
  "fechaInicio": "2026-05-15",
  "fechaFin": null,
  "estado": "ACTIVA"
}
```

Response `201` → `JugadorLesion`. Errores: `400 InvalidLesionFechasError`
(`fechaFin` anterior a `fechaInicio`), `403`.

#### `PUT /jugadores/:jugadorId/lesiones/:lesionId` — _(propietario)_

Todos los campos opcionales. Las fechas se validan contra el estado resultante,
no sólo contra lo enviado. Response `200` → `JugadorLesion`.
Errores: `404 LesionNotFoundError`, `400`, `403`.

#### `DELETE /jugadores/:jugadorId/lesiones/:lesionId` — _(propietario)_

Response `204` sin cuerpo. Errores: `404`, `403`.

---

### Integración con `equipos-ms`

#### `GET /jugadores/:jugadorId/equipos` — _(propietario)_

Read-through a `equipos-ms`: reenvía el token del usuario a
`GET {EQUIPOS_API_URL}/equipos` y devuelve `Equipo[]` tal cual. Nada de esto se
persiste aquí.

Restringido al propietario porque `equipos-ms` sólo resuelve los equipos del
usuario del token. Errores: `403`, `502 EquiposGatewayError`.

Para partidos, goles, tarjetas y estadísticas, llama directamente a
`equipos-ms`.

---

## Ejemplo de consumo (fetch)

```ts
const BASE = 'http://localhost:3004';

async function getPentagono(accessToken: string, jugadorId: string) {
  const res = await fetch(`${BASE}/jugadores/${jugadorId}/resumen-atributos`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const err = await res.json(); // { statusCode, error, message }
    throw new Error(err.message);
  }
  return res.json(); // { jugadorId, atributos: { ataque, tactica, ... } }
}
```

---

## Variables de entorno (`.env`)

```
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
PORT=3004
ALLOWED_ORIGIN=http://localhost:8081
EQUIPOS_API_URL=http://localhost:3002

# Bucket público donde se guardan las fotos de perfil.
SUPABASE_STORAGE_BUCKET=Perfil

# Sólo para herramientas externas compatibles con S3 (aws-cli, rclone...).
# La subida del microservicio usa el SDK de Supabase con la service-role key.
SUPABASE_S3_ENDPOINT=
SUPABASE_S3_ACCESS_KEY_ID=
SUPABASE_S3_SECRET_ACCESS_KEY=
```

## Tablas (migración `supabase/migrations/0004_jugadores_module.sql`)

`jugador`, `jugador_fisico`, `jugador_posicion`, `jugador_atributo`,
`jugador_lesion` — todas en el esquema `public`, con IDs `uuid` y RLS
habilitado (deny-all), ya que el acceso pasa por este microservicio con la
service-role key. FK a `public.usuario(id)`.
