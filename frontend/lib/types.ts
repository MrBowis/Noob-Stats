/**
 * Tipos que reflejan los contratos del microservicio auth-ms.
 */
export interface Rol {
  id: string;
  nombreRol: string;
  descripcion: string | null;
}

export interface Persona {
  id: string;
  nombres: string;
  apellidos: string;
  correo: string | null;
  fechaNacimiento: string | null;
  createdAt: string;
}

export interface Usuario {
  id: string;
  personaId: string;
  rolId: string;
  supabaseAuthId: string | null;
  email: string;
  estado: string;
  createdAt: string;
}

export interface UserProfile {
  usuario: Usuario;
  persona: Persona;
  rol: Rol;
}

export interface AuthSessionDto {
  accessToken: string;
  refreshToken: string;
  expiresAt: number | null;
  tokenType: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  nombres: string;
  apellidos: string;
  fechaNacimiento?: string;
  rolNombre?: string;
}

export interface AuthResponse {
  session: AuthSessionDto | null;
  profile: UserProfile;
}

/**
 * Tipos que reflejan los contratos del microservicio equipos-ms.
 */
export type RolNombre = 'Entrenador' | 'Futbolista' | 'Administrador';

export interface Equipo {
  id: string;
  nombre: string;
  descripcion: string | null;
  categoria: string | null;
  ciudad: string | null;
  escudoUrl: string | null;
  formacion: string;
  entrenadorId: string;
  createdAt: string;
}

export interface MiembroDetalle {
  id: string;
  usuarioId: string;
  nombres: string;
  apellidos: string;
  email: string;
  dorsal: number | null;
  posicion: string | null;
  slot: string | null;
  estado: string;
  joinedAt: string;
}

export interface EquipoMiembro {
  id: string;
  equipoId: string;
  usuarioId: string;
  dorsal: number | null;
  posicion: string | null;
  slot: string | null;
  estado: string;
  joinedAt: string;
}

export type InvitacionEstado =
  | 'pendiente'
  | 'aceptada'
  | 'rechazada'
  | 'cancelada';

export interface Invitacion {
  id: string;
  equipoId: string;
  usuarioId: string;
  estado: InvitacionEstado;
  mensaje: string | null;
  createdAt: string;
  respondedAt: string | null;
}

export interface InvitacionDetalle {
  id: string;
  equipoId: string;
  equipoNombre: string;
  usuarioId: string;
  jugadorNombres: string;
  jugadorApellidos: string;
  jugadorEmail: string;
  estado: InvitacionEstado;
  mensaje: string | null;
  createdAt: string;
  respondedAt: string | null;
}

export interface ResponderInvitacionResult {
  invitacion: Invitacion;
  miembro: EquipoMiembro | null;
}

export type PartidoEstado = 'programado' | 'finalizado' | 'cancelado';

export interface Partido {
  id: string;
  equipoId: string;
  rival: string;
  fecha: string;
  ubicacion: string | null;
  esLocal: boolean;
  estado: PartidoEstado;
  golesFavor: number | null;
  golesContra: number | null;
  notas: string | null;
  createdAt: string;
}

export type TarjetaTipo = 'amarilla' | 'roja';

export interface Gol {
  id: string;
  partidoId: string;
  usuarioId: string | null;
  jugadorNombres: string | null;
  jugadorApellidos: string | null;
  minuto: number | null;
}

export interface Tarjeta {
  id: string;
  partidoId: string;
  usuarioId: string | null;
  jugadorNombres: string | null;
  jugadorApellidos: string | null;
  tipo: TarjetaTipo;
  minuto: number | null;
}

export interface PartidoDetalle extends Partido {
  goles: Gol[];
  tarjetas: Tarjeta[];
}

export interface RegisterGolPayload {
  usuarioId: string;
  minuto?: number;
}

export interface RegisterTarjetaPayload {
  usuarioId: string;
  tipo: TarjetaTipo;
  minuto?: number;
}

export interface EstadisticasEquipo {
  equipoId: string;
  totalMiembros: number;
  partidosJugados: number;
  victorias: number;
  empates: number;
  derrotas: number;
  golesFavor: number;
  golesContra: number;
  diferenciaGoles: number;
  puntos: number;
  partidosProgramados: number;
  proximoPartido: Partido | null;
}

export type PartidoFiltro = 'proximos' | 'anteriores' | 'todos';

// ---- Payloads de request ----

export interface CreateEquipoPayload {
  nombre: string;
  descripcion?: string;
  categoria?: string;
  ciudad?: string;
  escudoUrl?: string;
}

export type UpdateEquipoPayload = Partial<CreateEquipoPayload> & {
  formacion?: string;
};

export interface UpdateMiembroPayload {
  dorsal?: number | null;
  posicion?: string | null;
  slot?: string | null;
  estado?: string;
}

export interface InvitarJugadorPayload {
  jugadorEmail: string;
  mensaje?: string;
}

export interface CreatePartidoPayload {
  rival: string;
  fecha: string;
  ubicacion?: string;
  esLocal?: boolean;
  notas?: string;
}

export interface UpdatePartidoPayload {
  rival?: string;
  fecha?: string;
  ubicacion?: string;
  esLocal?: boolean;
  estado?: PartidoEstado;
  golesFavor?: number | null;
  golesContra?: number | null;
  notas?: string;
}

/**
 * Tipos que reflejan los contratos del microservicio admin-ms.
 * Reutiliza `Rol` y `Persona` definidos arriba.
 */
export interface UsuarioDetalle {
  id: string;
  email: string;
  estado: string;
  supabaseAuthId: string | null;
  createdAt: string;
  persona: Persona;
  rol: Rol;
}

export interface CreateRolPayload {
  nombreRol: string;
  descripcion?: string;
}

export type UpdateRolPayload = Partial<CreateRolPayload>;

export interface CreateUsuarioAdminPayload {
  email: string;
  nombres: string;
  apellidos: string;
  rolNombre: string;
  correo?: string;
  fechaNacimiento?: string;
}

export interface UpdateUsuarioAdminPayload {
  nombres?: string;
  apellidos?: string;
  correo?: string;
  fechaNacimiento?: string;
  rolNombre?: string;
  estado?: string;
}

export interface UpdateProfilePayload {
  nombres?: string;
  apellidos?: string;
  correo?: string;
  fechaNacimiento?: string;
}

export interface PosicionEquipo {
  equipoId: string;
  nombre: string;
  partidosJugados: number;
  victorias: number;
  empates: number;
  derrotas: number;
  golesFavor: number;
  golesContra: number;
  diferenciaGoles: number;
  puntos: number;
}

export interface EstadisticasAdmin {
  usuarios: {
    total: number;
    activos: number;
    inactivos: number;
  };
  equipos: {
    total: number;
  };
  tablaPosiciones: PosicionEquipo[];
}

/**
 * Tipos que reflejan los contratos del microservicio jugadores-ms
 * (perfil deportivo del futbolista).
 */
export const GENEROS = [
  'MASCULINO',
  'FEMENINO',
  'OTRO',
  'PREFIERO_NO_DECIR',
] as const;
export type Genero = (typeof GENEROS)[number];

export const ESTADOS_JUGADOR = [
  'ACTIVO',
  'INACTIVO',
  'LESIONADO',
  'RETIRADO',
] as const;
export type EstadoJugador = (typeof ESTADOS_JUGADOR)[number];

export const PIERNAS_HABILES = ['DERECHA', 'IZQUIERDA', 'AMBAS'] as const;
export type PiernaHabil = (typeof PIERNAS_HABILES)[number];

export const POSICIONES = [
  'PORTERO',
  'DEFENSA',
  'MEDIOCAMPISTA',
  'DELANTERO',
] as const;
export type Posicion = (typeof POSICIONES)[number];

export const PARTES_CUERPO = [
  'CABEZA',
  'CUELLO',
  'HOMBRO',
  'BRAZO',
  'CODO',
  'ANTEBRAZO',
  'MUNECA',
  'MANO',
  'DEDOS_MANO',
  'PECHO',
  'ESPALDA',
  'CADERA',
  'INGLE',
  'MUSLO',
  'RODILLA',
  'PANTORRILLA',
  'TOBILLO',
  'PIE',
  'DEDOS_PIE',
  'OTRA',
] as const;
export type ParteCuerpo = (typeof PARTES_CUERPO)[number];

export const ESTADOS_LESION = [
  'ACTIVA',
  'EN_RECUPERACION',
  'RECUPERADA',
  'CRONICA',
] as const;
export type EstadoLesion = (typeof ESTADOS_LESION)[number];

export interface Jugador {
  id: string;
  userId: string;
  genero: Genero | null;
  nacionalidad: string | null;
  fotoUrl: string | null;
  piernaHabil: PiernaHabil | null;
  estado: EstadoJugador;
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface JugadorFisico {
  id: string;
  jugadorId: string;
  alturaCm: number | null;
  pesoKg: number | null;
  fechaActualizacion: string;
}

export interface JugadorPosicion {
  id: string;
  jugadorId: string;
  posicion: Posicion;
  esPrincipal: boolean;
}

export interface Atributos {
  ataque: number;
  tactica: number;
  tecnica: number;
  defensa: number;
  creatividad: number;
}

export interface JugadorAtributo extends Atributos {
  id: string;
  jugadorId: string;
  fechaActualizacion: string;
}

export interface ResumenAtributos {
  jugadorId: string;
  atributos: Atributos;
}

export interface JugadorLesion {
  id: string;
  jugadorId: string;
  parteCuerpo: ParteCuerpo;
  nota: string;
  fechaInicio: string;
  fechaFin: string | null;
  estado: EstadoLesion;
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface ResumenJugador {
  jugadorId: string;
  userId: string;
  nombres: string;
  apellidos: string;
  fechaNacimiento: string | null;
  nacionalidad: string | null;
  fotoUrl: string | null;
  estado: EstadoJugador;
  posicionPrincipal: Posicion | null;
  posicionesSecundarias: Posicion[];
  piernaHabil: PiernaHabil | null;
  alturaCm: number | null;
  pesoKg: number | null;
  atributos: Atributos;
}

export interface CreateJugadorPayload {
  genero?: Genero;
  nacionalidad?: string;
  fotoUrl?: string;
  piernaHabil?: PiernaHabil;
  estado?: EstadoJugador;
}

export type UpdateJugadorPayload = CreateJugadorPayload;

export interface UpdateFisicoPayload {
  alturaCm?: number;
  pesoKg?: number;
}

export interface CreatePosicionPayload {
  posicion: Posicion;
  esPrincipal?: boolean;
}

export interface UpdatePosicionPayload {
  posicion?: Posicion;
  esPrincipal?: boolean;
}

export interface CreateLesionPayload {
  parteCuerpo: ParteCuerpo;
  nota: string;
  fechaInicio: string;
  fechaFin?: string;
  estado?: EstadoLesion;
}

export type UpdateLesionPayload = Partial<CreateLesionPayload>;

export interface JugadorFiltro {
  posicion?: Posicion;
  piernaHabil?: PiernaHabil;
  estado?: EstadoJugador;
}
