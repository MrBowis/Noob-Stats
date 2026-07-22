import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { AuthUser } from '../domain/entities/auth-user.entity';
import { Persona } from '../domain/entities/persona.entity';
import { Rol } from '../domain/entities/rol.entity';
import { Usuario } from '../domain/entities/usuario.entity';
import { UsuarioDetalle } from '../domain/entities/usuario-detalle.entity';
import {
  AdminProviderError,
  EmailAlreadyInUseError,
  RolAlreadyExistsError,
} from '../domain/exceptions/admin.errors';
import {
  AdminRepository,
  CreatePersonaData,
  CreateRolData,
  CreateUsuarioData,
  EquipoResumen,
  PartidoFinalizado,
  UpdatePersonaData,
  UpdateRolData,
  UpdateUsuarioData,
} from '../domain/repositories/admin.repository';

interface RolRow {
  id: string;
  nombre_rol: string;
  descripcion: string | null;
}

interface PersonaRow {
  id: string;
  nombres: string;
  apellidos: string;
  correo: string | null;
  fecha_nacimiento: string | null;
  created_at: string;
}

interface UsuarioRow {
  id: string;
  persona_id: string;
  rol_id: string;
  supabase_auth_id: string | null;
  email: string;
  estado: string;
  created_at: string;
}

interface UsuarioJoinRow extends UsuarioRow {
  persona: PersonaRow;
  rol: RolRow;
}

const USUARIO_JOIN = '*, persona:persona_id(*), rol:rol_id(*)';

/** Código de Postgres para violación de restricción única. */
const UNIQUE_VIOLATION = '23505';

@Injectable()
export class SupabaseAdminRepository extends AdminRepository {
  private readonly authClient: SupabaseClient;
  private readonly dbClient: SupabaseClient;

  constructor(config: ConfigService) {
    super();
    const url = config.getOrThrow<string>('SUPABASE_URL');
    const anonKey = config.getOrThrow<string>('SUPABASE_ANON_KEY');
    const serviceKey = config.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY');

    this.authClient = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    }) as SupabaseClient;
    this.dbClient = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    }) as SupabaseClient;
  }

  // ---------------- Identidad ----------------

  async getUserFromAccessToken(accessToken: string): Promise<AuthUser | null> {
    const { data, error } = await this.authClient.auth.getUser(accessToken);
    if (error || !data.user) {
      return null;
    }
    return this.mapAuthUser(data.user);
  }

  async findUsuarioDetalleByAuthId(
    authId: string,
  ): Promise<UsuarioDetalle | null> {
    const { data, error } = await this.dbClient
      .from('usuario')
      .select(USUARIO_JOIN)
      .eq('supabase_auth_id', authId)
      .maybeSingle<UsuarioJoinRow>();
    if (error) {
      throw new AdminProviderError(error.message);
    }
    return data ? this.mapUsuarioDetalle(data) : null;
  }

  // ---------------- Roles ----------------

  async createRol(data: CreateRolData): Promise<Rol> {
    const { data: row, error } = await this.dbClient
      .from('rol')
      .insert({
        nombre_rol: data.nombreRol,
        descripcion: data.descripcion ?? null,
      })
      .select('*')
      .single<RolRow>();
    if (error) {
      if (error.code === UNIQUE_VIOLATION) {
        throw new RolAlreadyExistsError();
      }
      throw new AdminProviderError(error.message);
    }
    return this.mapRol(row);
  }

  async listRoles(): Promise<Rol[]> {
    const { data, error } = await this.dbClient
      .from('rol')
      .select('*')
      .order('nombre_rol', { ascending: true });
    if (error) {
      throw new AdminProviderError(error.message);
    }
    return ((data ?? []) as RolRow[]).map((r) => this.mapRol(r));
  }

  async findRolById(id: string): Promise<Rol | null> {
    const { data, error } = await this.dbClient
      .from('rol')
      .select('*')
      .eq('id', id)
      .maybeSingle<RolRow>();
    if (error) {
      throw new AdminProviderError(error.message);
    }
    return data ? this.mapRol(data) : null;
  }

  async findRolByNombre(nombre: string): Promise<Rol | null> {
    const { data, error } = await this.dbClient
      .from('rol')
      .select('*')
      .eq('nombre_rol', nombre)
      .maybeSingle<RolRow>();
    if (error) {
      throw new AdminProviderError(error.message);
    }
    return data ? this.mapRol(data) : null;
  }

  async updateRol(id: string, data: UpdateRolData): Promise<Rol> {
    const patch: Record<string, unknown> = {};
    if (data.nombreRol !== undefined) patch.nombre_rol = data.nombreRol;
    if (data.descripcion !== undefined) patch.descripcion = data.descripcion;

    const { data: row, error } = await this.dbClient
      .from('rol')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single<RolRow>();
    if (error) {
      if (error.code === UNIQUE_VIOLATION) {
        throw new RolAlreadyExistsError();
      }
      throw new AdminProviderError(error.message);
    }
    return this.mapRol(row);
  }

  async deleteRol(id: string): Promise<void> {
    const { error } = await this.dbClient.from('rol').delete().eq('id', id);
    if (error) {
      throw new AdminProviderError(error.message);
    }
  }

  async countUsuariosByRol(rolId: string): Promise<number> {
    const { count, error } = await this.dbClient
      .from('usuario')
      .select('*', { count: 'exact', head: true })
      .eq('rol_id', rolId);
    if (error) {
      throw new AdminProviderError(error.message);
    }
    return count ?? 0;
  }

  // ---------------- Usuarios ----------------

  async createPersona(data: CreatePersonaData): Promise<Persona> {
    const { data: row, error } = await this.dbClient
      .from('persona')
      .insert({
        nombres: data.nombres,
        apellidos: data.apellidos,
        correo: data.correo ?? null,
        fecha_nacimiento: data.fechaNacimiento ?? null,
      })
      .select('*')
      .single<PersonaRow>();
    if (error || !row) {
      throw new AdminProviderError(
        error?.message ?? 'No se pudo crear Persona',
      );
    }
    return this.mapPersona(row);
  }

  async createUsuario(data: CreateUsuarioData): Promise<Usuario> {
    const { data: row, error } = await this.dbClient
      .from('usuario')
      .insert({
        persona_id: data.personaId,
        rol_id: data.rolId,
        email: data.email,
        estado: data.estado ?? 'activo',
      })
      .select('*')
      .single<UsuarioRow>();
    if (error) {
      if (error.code === UNIQUE_VIOLATION) {
        throw new EmailAlreadyInUseError();
      }
      throw new AdminProviderError(error.message);
    }
    return this.mapUsuario(row);
  }

  async listUsuarios(estado?: string): Promise<UsuarioDetalle[]> {
    let query = this.dbClient
      .from('usuario')
      .select(USUARIO_JOIN)
      .order('created_at', { ascending: false });
    if (estado) {
      query = query.eq('estado', estado);
    }
    const { data, error } = await query.returns<UsuarioJoinRow[]>();
    if (error) {
      throw new AdminProviderError(error.message);
    }
    return (data ?? []).map((u) => this.mapUsuarioDetalle(u));
  }

  async findUsuarioById(id: string): Promise<Usuario | null> {
    const { data, error } = await this.dbClient
      .from('usuario')
      .select('*')
      .eq('id', id)
      .maybeSingle<UsuarioRow>();
    if (error) {
      throw new AdminProviderError(error.message);
    }
    return data ? this.mapUsuario(data) : null;
  }

  async findUsuarioDetalleById(id: string): Promise<UsuarioDetalle | null> {
    const { data, error } = await this.dbClient
      .from('usuario')
      .select(USUARIO_JOIN)
      .eq('id', id)
      .maybeSingle<UsuarioJoinRow>();
    if (error) {
      throw new AdminProviderError(error.message);
    }
    return data ? this.mapUsuarioDetalle(data) : null;
  }

  async findUsuarioByEmail(email: string): Promise<Usuario | null> {
    const { data, error } = await this.dbClient
      .from('usuario')
      .select('*')
      .eq('email', email)
      .maybeSingle<UsuarioRow>();
    if (error) {
      throw new AdminProviderError(error.message);
    }
    return data ? this.mapUsuario(data) : null;
  }

  async updatePersona(id: string, data: UpdatePersonaData): Promise<Persona> {
    const patch: Record<string, unknown> = {};
    if (data.nombres !== undefined) patch.nombres = data.nombres;
    if (data.apellidos !== undefined) patch.apellidos = data.apellidos;
    if (data.correo !== undefined) patch.correo = data.correo;
    if (data.fechaNacimiento !== undefined) {
      patch.fecha_nacimiento = data.fechaNacimiento;
    }

    const { data: row, error } = await this.dbClient
      .from('persona')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single<PersonaRow>();
    if (error || !row) {
      throw new AdminProviderError(
        error?.message ?? 'No se pudo actualizar Persona',
      );
    }
    return this.mapPersona(row);
  }

  async updateUsuario(id: string, data: UpdateUsuarioData): Promise<Usuario> {
    const patch: Record<string, unknown> = {};
    if (data.rolId !== undefined) patch.rol_id = data.rolId;
    if (data.estado !== undefined) patch.estado = data.estado;

    const { data: row, error } = await this.dbClient
      .from('usuario')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single<UsuarioRow>();
    if (error || !row) {
      throw new AdminProviderError(
        error?.message ?? 'No se pudo actualizar Usuario',
      );
    }
    return this.mapUsuario(row);
  }

  // ---------------- Estadísticas ----------------

  async countUsuarios(estado?: string): Promise<number> {
    let query = this.dbClient
      .from('usuario')
      .select('*', { count: 'exact', head: true });
    if (estado) {
      query = query.eq('estado', estado);
    }
    const { count, error } = await query;
    if (error) {
      throw new AdminProviderError(error.message);
    }
    return count ?? 0;
  }

  async countEquipos(): Promise<number> {
    const { count, error } = await this.dbClient
      .from('equipo')
      .select('*', { count: 'exact', head: true });
    if (error) {
      throw new AdminProviderError(error.message);
    }
    return count ?? 0;
  }

  async listEquiposResumen(): Promise<EquipoResumen[]> {
    const { data, error } = await this.dbClient
      .from('equipo')
      .select('id, nombre');
    if (error) {
      throw new AdminProviderError(error.message);
    }
    return ((data ?? []) as { id: string; nombre: string }[]).map((e) => ({
      id: e.id,
      nombre: e.nombre,
    }));
  }

  async listPartidosFinalizados(): Promise<PartidoFinalizado[]> {
    const { data, error } = await this.dbClient
      .from('partido')
      .select('equipo_id, goles_favor, goles_contra')
      .eq('estado', 'finalizado')
      .not('goles_favor', 'is', null)
      .not('goles_contra', 'is', null);
    if (error) {
      throw new AdminProviderError(error.message);
    }
    return (
      (data ?? []) as {
        equipo_id: string;
        goles_favor: number;
        goles_contra: number;
      }[]
    ).map((p) => ({
      equipoId: p.equipo_id,
      golesFavor: p.goles_favor,
      golesContra: p.goles_contra,
    }));
  }

  // ---------------- Mappers (snake_case -> camelCase) ----------------

  private mapAuthUser(user: User): AuthUser {
    const metadata = user.user_metadata ?? {};
    return {
      id: user.id,
      email: user.email ?? null,
      fullName:
        (metadata.full_name as string) ?? (metadata.name as string) ?? null,
    };
  }

  private mapRol(row: RolRow): Rol {
    return {
      id: row.id,
      nombreRol: row.nombre_rol,
      descripcion: row.descripcion,
    };
  }

  private mapPersona(row: PersonaRow): Persona {
    return {
      id: row.id,
      nombres: row.nombres,
      apellidos: row.apellidos,
      correo: row.correo,
      fechaNacimiento: row.fecha_nacimiento,
      createdAt: row.created_at,
    };
  }

  private mapUsuario(row: UsuarioRow): Usuario {
    return {
      id: row.id,
      personaId: row.persona_id,
      rolId: row.rol_id,
      supabaseAuthId: row.supabase_auth_id,
      email: row.email,
      estado: row.estado,
      createdAt: row.created_at,
    };
  }

  private mapUsuarioDetalle(row: UsuarioJoinRow): UsuarioDetalle {
    return {
      id: row.id,
      email: row.email,
      estado: row.estado,
      supabaseAuthId: row.supabase_auth_id,
      createdAt: row.created_at,
      persona: this.mapPersona(row.persona),
      rol: this.mapRol(row.rol),
    };
  }
}
