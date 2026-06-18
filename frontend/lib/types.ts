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
