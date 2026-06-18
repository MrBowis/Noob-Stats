import { AuthSession } from '../entities/auth-session.entity';
import { AuthUser } from '../entities/auth-user.entity';
import { Persona } from '../entities/persona.entity';
import { Rol } from '../entities/rol.entity';
import { UserProfile } from '../entities/user-profile.entity';
import { Usuario } from '../entities/usuario.entity';

export interface SignUpResult {
  user: AuthUser;
  session: AuthSession | null;
}

export interface SignInResult {
  user: AuthUser;
  session: AuthSession;
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
  supabaseAuthId: string;
  email: string;
  estado?: string;
}

/**
 * Puerto del dominio que abstrae TODA interacción con Supabase: tanto Supabase
 * Auth como las tablas rol/persona/usuario. Ningún caso de uso ni controlador
 * debe usar el SDK de Supabase directamente; dependen de esta interfaz.
 *
 * Es una `abstract class` (no `interface`) para poder usarla como token de
 * inyección de NestJS.
 */
export abstract class AuthRepository {
  // ---- Supabase Auth ----
  abstract signUpWithEmail(
    email: string,
    password: string,
  ): Promise<SignUpResult>;

  abstract signInWithEmail(
    email: string,
    password: string,
  ): Promise<SignInResult>;

  abstract getOAuthSignInUrl(
    provider: string,
    redirectTo: string,
  ): Promise<string>;

  /** Verifica un access token de Supabase y devuelve el usuario, o null. */
  abstract getUserFromAccessToken(
    accessToken: string,
  ): Promise<AuthUser | null>;

  /** Renueva la sesión usando el refresh token y devuelve una nueva AuthSession. */
  abstract refreshSession(refreshToken: string): Promise<AuthSession>;

  // ---- Tablas de dominio ----
  abstract findRolById(id: string): Promise<Rol | null>;
  abstract findRolByNombre(nombre: string): Promise<Rol | null>;

  abstract createPersona(data: CreatePersonaData): Promise<Persona>;
  abstract createUsuario(data: CreateUsuarioData): Promise<Usuario>;

  abstract findUsuarioByAuthId(authId: string): Promise<Usuario | null>;
  abstract findProfileByAuthId(authId: string): Promise<UserProfile | null>;
}
