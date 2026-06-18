/**
 * Usuario tal como lo conoce Supabase Auth (tabla auth.users).
 * Es distinto del Usuario de dominio (tabla public.usuario).
 */
export interface AuthUser {
  id: string;
  email: string | null;
  fullName: string | null;
}
