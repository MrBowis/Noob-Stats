import {
  EstadoJugador,
  EstadoLesion,
  Genero,
  ParteCuerpo,
  PiernaHabil,
  Posicion,
} from '../catalogos';
import { AuthUser } from '../entities/auth-user.entity';
import {
  Jugador,
  JugadorAtributo,
  JugadorFisico,
  JugadorLesion,
  JugadorPosicion,
} from '../entities/jugador.entity';
import { Usuario } from '../entities/usuario.entity';

export interface CreateJugadorData {
  userId: string;
  genero?: Genero | null;
  nacionalidad?: string | null;
  fotoUrl?: string | null;
  piernaHabil?: PiernaHabil | null;
  estado?: EstadoJugador;
}

export interface UpdateJugadorData {
  genero?: Genero | null;
  nacionalidad?: string | null;
  fotoUrl?: string | null;
  piernaHabil?: PiernaHabil | null;
  estado?: EstadoJugador;
}

export interface UpsertFisicoData {
  alturaCm?: number | null;
  pesoKg?: number | null;
}

export interface UpsertAtributosData {
  ataque: number;
  tactica: number;
  tecnica: number;
  defensa: number;
  creatividad: number;
}

export interface CreatePosicionData {
  jugadorId: string;
  posicion: Posicion;
  esPrincipal: boolean;
}

export interface UpdatePosicionData {
  posicion?: Posicion;
  esPrincipal?: boolean;
}

export interface CreateLesionData {
  jugadorId: string;
  parteCuerpo: ParteCuerpo;
  nota: string;
  fechaInicio: string;
  fechaFin?: string | null;
  estado?: EstadoLesion;
}

export interface UpdateLesionData {
  parteCuerpo?: ParteCuerpo;
  nota?: string;
  fechaInicio?: string;
  fechaFin?: string | null;
  estado?: EstadoLesion;
}

export interface FotoPerfil {
  buffer: Buffer;
  mimeType: string;
  /** Nombre original, sólo se usa para deducir la extensión. */
  fileName: string;
}

/** Filtros públicos de `GET /jugadores`. */
export interface JugadorFiltro {
  posicion?: Posicion;
  piernaHabil?: PiernaHabil;
  estado?: EstadoJugador;
}

/**
 * Puerto de persistencia del módulo de jugadores. Los casos de uso dependen de
 * esta interfaz, nunca de Supabase.
 */
export abstract class JugadoresRepository {
  // ---- Auth / identidad (lectura, propiedad de auth-ms) ----
  abstract getUserFromAccessToken(token: string): Promise<AuthUser | null>;
  abstract findUsuarioByAuthId(authId: string): Promise<Usuario | null>;
  abstract findUsuariosByIds(ids: string[]): Promise<Usuario[]>;

  // ---- Jugador ----
  abstract createJugador(data: CreateJugadorData): Promise<Jugador>;
  abstract findJugadorById(id: string): Promise<Jugador | null>;
  abstract findJugadorByUserId(userId: string): Promise<Jugador | null>;
  abstract listJugadores(filtro: JugadorFiltro): Promise<Jugador[]>;
  abstract updateJugador(id: string, data: UpdateJugadorData): Promise<Jugador>;

  /** Sube la foto al bucket público y devuelve su URL. */
  abstract uploadFotoPerfil(
    jugadorId: string,
    foto: FotoPerfil,
  ): Promise<string>;

  // ---- Físico ----
  abstract findFisico(jugadorId: string): Promise<JugadorFisico | null>;
  abstract findFisicoByJugadorIds(
    jugadorIds: string[],
  ): Promise<JugadorFisico[]>;
  abstract upsertFisico(
    jugadorId: string,
    data: UpsertFisicoData,
  ): Promise<JugadorFisico>;

  // ---- Posiciones ----
  abstract listPosiciones(jugadorId: string): Promise<JugadorPosicion[]>;
  abstract listPosicionesByJugadorIds(
    jugadorIds: string[],
  ): Promise<JugadorPosicion[]>;
  abstract findPosicionById(id: string): Promise<JugadorPosicion | null>;
  abstract createPosicion(data: CreatePosicionData): Promise<JugadorPosicion>;
  abstract updatePosicion(
    id: string,
    data: UpdatePosicionData,
  ): Promise<JugadorPosicion>;
  abstract deletePosicion(id: string): Promise<void>;
  /** Desmarca la principal actual para respetar el índice único parcial. */
  abstract clearPosicionPrincipal(
    jugadorId: string,
    exceptoId?: string,
  ): Promise<void>;

  // ---- Atributos ----
  abstract findAtributos(jugadorId: string): Promise<JugadorAtributo | null>;
  abstract findAtributosByJugadorIds(
    jugadorIds: string[],
  ): Promise<JugadorAtributo[]>;
  abstract upsertAtributos(
    jugadorId: string,
    data: UpsertAtributosData,
  ): Promise<JugadorAtributo>;

  // ---- Lesiones ----
  abstract listLesiones(jugadorId: string): Promise<JugadorLesion[]>;
  abstract findLesionById(id: string): Promise<JugadorLesion | null>;
  abstract createLesion(data: CreateLesionData): Promise<JugadorLesion>;
  abstract updateLesion(
    id: string,
    data: UpdateLesionData,
  ): Promise<JugadorLesion>;
  abstract deleteLesion(id: string): Promise<void>;
}
