import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createClient,
  Session,
  SupabaseClient,
  User,
} from '@supabase/supabase-js';
import { AuthSession } from '../domain/entities/auth-session.entity';
import { AuthUser } from '../domain/entities/auth-user.entity';
import { Persona } from '../domain/entities/persona.entity';
import { Rol } from '../domain/entities/rol.entity';
import { UserProfile } from '../domain/entities/user-profile.entity';
import { Usuario } from '../domain/entities/usuario.entity';
import {
  AuthProviderError,
  EmailAlreadyInUseError,
  InvalidCredentialsError,
} from '../domain/exceptions/auth.errors';
import {
  AuthRepository,
  CreatePersonaData,
  CreateUsuarioData,
  SignInResult,
  SignUpResult,
} from '../domain/repositories/auth.repository';

interface PersonaRow {
  id: string;
  nombres: string;
  apellidos: string;
  correo: string | null;
  fecha_nacimiento: string | null;
  created_at: string;
}

interface RolRow {
  id: string;
  nombre_rol: string;
  descripcion: string | null;
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

/**
 * Implementación del puerto AuthRepository sobre Supabase.
 *
 * Mantiene dos clientes:
 *  - `authClient` (anon key): operaciones de Supabase Auth (signUp/signIn/OAuth)
 *    y verificación de tokens.
 *  - `dbClient` (service role key): operaciones sobre las tablas de dominio,
 *    omitiendo RLS de forma controlada desde el backend.
 */
@Injectable()
export class SupabaseAuthRepository extends AuthRepository {
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

  // ---------------------------------------------------------------------------
  // Supabase Auth
  // ---------------------------------------------------------------------------

  async signUpWithEmail(
    email: string,
    password: string,
  ): Promise<SignUpResult> {
    const { data, error } = await this.authClient.auth.signUp({
      email,
      password,
    });

    if (error) {
      if (/registered|already|exists/i.test(error.message)) {
        throw new EmailAlreadyInUseError();
      }
      throw new AuthProviderError(error.message);
    }
    if (!data.user) {
      throw new AuthProviderError('No se pudo crear el usuario');
    }

    return {
      user: this.mapAuthUser(data.user),
      session: this.mapSession(data.session),
    };
  }

  async signInWithEmail(
    email: string,
    password: string,
  ): Promise<SignInResult> {
    const { data, error } = await this.authClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session || !data.user) {
      throw new InvalidCredentialsError(error?.message);
    }

    return {
      user: this.mapAuthUser(data.user),
      session: this.mapSession(data.session)!,
    };
  }

  async getOAuthSignInUrl(
    provider: string,
    redirectTo: string,
  ): Promise<string> {
    const { data, error } = await this.authClient.auth.signInWithOAuth({
      provider: provider as 'google',
      options: { redirectTo, skipBrowserRedirect: true },
    });

    if (error || !data?.url) {
      throw new AuthProviderError(error?.message);
    }
    return data.url;
  }

  async getUserFromAccessToken(accessToken: string): Promise<AuthUser | null> {
    const { data, error } = await this.authClient.auth.getUser(accessToken);
    if (error || !data.user) {
      return null;
    }
    return this.mapAuthUser(data.user);
  }

  async refreshSession(refreshToken: string): Promise<AuthSession> {
    const { data, error } = await this.authClient.auth.refreshSession({
      refresh_token: refreshToken,
    });
    if (error || !data.session) {
      throw new InvalidCredentialsError(error?.message);
    }
    return this.mapSession(data.session)!;
  }

  // ---------------------------------------------------------------------------
  // Tablas de dominio
  // ---------------------------------------------------------------------------

  async findRolById(id: string): Promise<Rol | null> {
    const { data, error } = await this.dbClient
      .from('rol')
      .select('*')
      .eq('id', id)
      .maybeSingle<RolRow>();
    if (error) {
      throw new AuthProviderError(error.message);
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
      throw new AuthProviderError(error.message);
    }
    return data ? this.mapRol(data) : null;
  }

  async createPersona(input: CreatePersonaData): Promise<Persona> {
    const { data, error } = await this.dbClient
      .from('persona')
      .insert({
        nombres: input.nombres,
        apellidos: input.apellidos,
        correo: input.correo ?? null,
        fecha_nacimiento: input.fechaNacimiento ?? null,
      })
      .select('*')
      .single<PersonaRow>();
    if (error || !data) {
      throw new AuthProviderError(error?.message ?? 'No se pudo crear Persona');
    }
    return this.mapPersona(data);
  }

  async createUsuario(input: CreateUsuarioData): Promise<Usuario> {
    const { data, error } = await this.dbClient
      .from('usuario')
      .insert({
        persona_id: input.personaId,
        rol_id: input.rolId,
        supabase_auth_id: input.supabaseAuthId,
        email: input.email,
        estado: input.estado ?? 'activo',
      })
      .select('*')
      .single<UsuarioRow>();
    if (error || !data) {
      throw new AuthProviderError(error?.message ?? 'No se pudo crear Usuario');
    }
    return this.mapUsuario(data);
  }

  async findUsuarioByAuthId(authId: string): Promise<Usuario | null> {
    const { data, error } = await this.dbClient
      .from('usuario')
      .select('*')
      .eq('supabase_auth_id', authId)
      .maybeSingle<UsuarioRow>();
    if (error) {
      throw new AuthProviderError(error.message);
    }
    return data ? this.mapUsuario(data) : null;
  }

  async findProfileByAuthId(authId: string): Promise<UserProfile | null> {
    const { data, error } = await this.dbClient
      .from('usuario')
      .select('*, persona:persona_id(*), rol:rol_id(*)')
      .eq('supabase_auth_id', authId)
      .maybeSingle<UsuarioRow & { persona: PersonaRow; rol: RolRow }>();
    if (error) {
      throw new AuthProviderError(error.message);
    }
    if (!data) {
      return null;
    }
    return {
      usuario: this.mapUsuario(data),
      persona: this.mapPersona(data.persona),
      rol: this.mapRol(data.rol),
    };
  }

  // ---------------------------------------------------------------------------
  // Mappers (snake_case de Supabase -> camelCase de dominio)
  // ---------------------------------------------------------------------------

  private mapAuthUser(user: User): AuthUser {
    const metadata = user.user_metadata ?? {};
    return {
      id: user.id,
      email: user.email ?? null,
      fullName:
        (metadata.full_name as string) ?? (metadata.name as string) ?? null,
    };
  }

  private mapSession(session: Session | null): AuthSession | null {
    if (!session) {
      return null;
    }
    return {
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      expiresAt: session.expires_at ?? null,
      tokenType: session.token_type,
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
}
