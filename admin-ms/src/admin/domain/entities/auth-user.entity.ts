/**
 * Usuario tal como lo conoce Supabase Auth (tabla auth.users).
 * `id` corresponde a `usuario.supabase_auth_id` en el dominio.
 */
export interface AuthUser {
  id: string;
  email: string | null;
  fullName: string | null;
}
