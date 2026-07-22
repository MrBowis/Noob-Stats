import { AuthUser } from '../entities/auth-user.entity';
import { Persona } from '../entities/persona.entity';
import { Rol } from '../entities/rol.entity';
import { Usuario } from '../entities/usuario.entity';
import { UsuarioDetalle } from '../entities/usuario-detalle.entity';

export interface EquipoResumen {
  id: string;
  nombre: string;
}

export interface PartidoFinalizado {
  equipoId: string;
  golesFavor: number;
  golesContra: number;
}

export interface CreateRolData {
  nombreRol: string;
  descripcion?: string | null;
}

export interface UpdateRolData {
  nombreRol?: string;
  descripcion?: string | null;
}

export interface CreatePersonaData {
  nombres: string;
  apellidos: string;
  correo?: string | null;
  fechaNacimiento?: string | null;
}

export interface CreateUsuarioData {
  personaId: string;
  rolId: string;
  email: string;
  estado?: string;
}

export interface UpdatePersonaData {
  nombres?: string;
  apellidos?: string;
  correo?: string | null;
  fechaNacimiento?: string | null;
}

export interface UpdateUsuarioData {
  rolId?: string;
  estado?: string;
}

/**
 * Puerto de acceso a datos del microservicio de administración. Los casos de
 * uso dependen de esta abstracción, no de Supabase.
 */
export abstract class AdminRepository {
  // ---- Identidad ----
  abstract getUserFromAccessToken(
    accessToken: string,
  ): Promise<AuthUser | null>;
  abstract findUsuarioDetalleByAuthId(
    authId: string,
  ): Promise<UsuarioDetalle | null>;

  // ---- Roles ----
  abstract createRol(data: CreateRolData): Promise<Rol>;
  abstract listRoles(): Promise<Rol[]>;
  abstract findRolById(id: string): Promise<Rol | null>;
  abstract findRolByNombre(nombre: string): Promise<Rol | null>;
  abstract updateRol(id: string, data: UpdateRolData): Promise<Rol>;
  abstract deleteRol(id: string): Promise<void>;
  abstract countUsuariosByRol(rolId: string): Promise<number>;

  // ---- Usuarios ----
  abstract createPersona(data: CreatePersonaData): Promise<Persona>;
  abstract createUsuario(data: CreateUsuarioData): Promise<Usuario>;
  abstract listUsuarios(estado?: string): Promise<UsuarioDetalle[]>;
  abstract findUsuarioById(id: string): Promise<Usuario | null>;
  abstract findUsuarioDetalleById(id: string): Promise<UsuarioDetalle | null>;
  abstract findUsuarioByEmail(email: string): Promise<Usuario | null>;
  abstract updatePersona(id: string, data: UpdatePersonaData): Promise<Persona>;
  abstract updateUsuario(id: string, data: UpdateUsuarioData): Promise<Usuario>;

  // ---- Estadísticas ----
  abstract countUsuarios(estado?: string): Promise<number>;
  abstract countEquipos(): Promise<number>;
  abstract listEquiposResumen(): Promise<EquipoResumen[]>;
  abstract listPartidosFinalizados(): Promise<PartidoFinalizado[]>;
}
