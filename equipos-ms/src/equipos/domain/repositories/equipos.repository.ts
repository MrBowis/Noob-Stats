import { AuthUser } from '../entities/auth-user.entity';
import {
  EquipoMiembro,
  MiembroDetalle,
} from '../entities/equipo-miembro.entity';
import { Equipo } from '../entities/equipo.entity';
import {
  Invitacion,
  InvitacionDetalle,
  InvitacionEstado,
} from '../entities/invitacion.entity';
import {
  Gol,
  Partido,
  PartidoDetalle,
  Tarjeta,
  TarjetaTipo,
} from '../entities/partido.entity';
import { Usuario } from '../entities/usuario.entity';
import { Formacion } from '../formations';

export interface CreateEquipoData {
  nombre: string;
  descripcion?: string | null;
  categoria?: string | null;
  ciudad?: string | null;
  escudoUrl?: string | null;
  entrenadorId: string;
}

export interface UpdateEquipoData {
  nombre?: string;
  descripcion?: string | null;
  categoria?: string | null;
  ciudad?: string | null;
  escudoUrl?: string | null;
  formacion?: Formacion;
}

export interface AddMiembroData {
  equipoId: string;
  usuarioId: string;
  dorsal?: number | null;
  posicion?: string | null;
}

export interface UpdateMiembroData {
  dorsal?: number | null;
  posicion?: string | null;
  slot?: string | null;
  estado?: string;
}

export interface RegisterGolData {
  partidoId: string;
  usuarioId?: string | null;
  minuto?: number | null;
}

export interface RegisterTarjetaData {
  partidoId: string;
  usuarioId?: string | null;
  tipo: TarjetaTipo;
  minuto?: number | null;
}

export interface CreateInvitacionData {
  equipoId: string;
  usuarioId: string;
  mensaje?: string | null;
}

export interface CreatePartidoData {
  equipoId: string;
  rival: string;
  fecha: string;
  ubicacion?: string | null;
  esLocal?: boolean;
  notas?: string | null;
}

export interface UpdatePartidoData {
  rival?: string;
  fecha?: string;
  ubicacion?: string | null;
  esLocal?: boolean;
  estado?: string;
  golesFavor?: number | null;
  golesContra?: number | null;
  notas?: string | null;
}

export type PartidoFiltro = 'proximos' | 'anteriores' | 'todos';

/**
 * Puerto de acceso a datos del módulo de equipos. Los casos de uso dependen de
 * esta abstracción, no de Supabase.
 */
export abstract class EquiposRepository {
  // ---- Identidad ----
  abstract getUserFromAccessToken(
    accessToken: string,
  ): Promise<AuthUser | null>;
  abstract findUsuarioByAuthId(authId: string): Promise<Usuario | null>;
  abstract findUsuarioByEmail(email: string): Promise<Usuario | null>;

  // ---- Equipo ----
  abstract createEquipo(data: CreateEquipoData): Promise<Equipo>;
  abstract findEquipoById(id: string): Promise<Equipo | null>;
  abstract listEquiposByUsuario(usuarioId: string): Promise<Equipo[]>;
  abstract updateEquipo(id: string, data: UpdateEquipoData): Promise<Equipo>;
  abstract deleteEquipo(id: string): Promise<void>;

  // ---- Miembros ----
  abstract findMiembro(
    equipoId: string,
    usuarioId: string,
  ): Promise<EquipoMiembro | null>;
  abstract listMiembros(equipoId: string): Promise<MiembroDetalle[]>;
  abstract countMiembros(equipoId: string): Promise<number>;
  abstract addMiembro(data: AddMiembroData): Promise<EquipoMiembro>;
  abstract updateMiembro(
    equipoId: string,
    usuarioId: string,
    data: UpdateMiembroData,
  ): Promise<EquipoMiembro>;
  abstract removeMiembro(equipoId: string, usuarioId: string): Promise<void>;
  /** Libera un slot ocupándolo sólo por el jugador indicado (unicidad en la cancha). */
  abstract clearSlot(
    equipoId: string,
    slot: string,
    exceptUsuarioId: string,
  ): Promise<void>;

  // ---- Invitaciones ----
  abstract createInvitacion(data: CreateInvitacionData): Promise<Invitacion>;
  abstract findInvitacionById(id: string): Promise<Invitacion | null>;
  abstract findInvitacionPendiente(
    equipoId: string,
    usuarioId: string,
  ): Promise<Invitacion | null>;
  abstract listInvitacionesByEquipo(
    equipoId: string,
  ): Promise<InvitacionDetalle[]>;
  abstract listInvitacionesByUsuario(
    usuarioId: string,
    soloPendientes: boolean,
  ): Promise<InvitacionDetalle[]>;
  abstract updateInvitacionEstado(
    id: string,
    estado: InvitacionEstado,
  ): Promise<Invitacion>;

  // ---- Partidos ----
  abstract createPartido(data: CreatePartidoData): Promise<Partido>;
  abstract findPartidoById(id: string): Promise<Partido | null>;
  abstract findPartidoDetalleById(id: string): Promise<PartidoDetalle | null>;
  abstract listPartidosByEquipo(
    equipoId: string,
    filtro: PartidoFiltro,
  ): Promise<Partido[]>;
  abstract updatePartido(id: string, data: UpdatePartidoData): Promise<Partido>;
  abstract deletePartido(id: string): Promise<void>;

  // ---- Goles y tarjetas ----
  abstract addGol(data: RegisterGolData): Promise<Gol>;
  abstract findGolById(id: string): Promise<Gol | null>;
  abstract deleteGol(id: string): Promise<void>;
  abstract addTarjeta(data: RegisterTarjetaData): Promise<Tarjeta>;
  abstract findTarjetaById(id: string): Promise<Tarjeta | null>;
  abstract deleteTarjeta(id: string): Promise<void>;
}
