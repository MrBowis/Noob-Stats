/**
 * Usuario de dominio con su Persona y Rol resueltos. Se obtiene a partir del
 * `supabase_auth_id` del token y se usa para autorizar acciones (p. ej. sólo
 * un Entrenador puede crear equipos).
 */
export interface Usuario {
  id: string;
  personaId: string;
  rolId: string;
  rolNombre: string;
  supabaseAuthId: string | null;
  email: string;
  nombres: string;
  apellidos: string;
  estado: string;
}
