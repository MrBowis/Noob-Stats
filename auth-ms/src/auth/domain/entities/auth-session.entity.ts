/**
 * Sesión emitida por Supabase Auth tras un login/registro exitoso.
 */
export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number | null;
  tokenType: string;
}
