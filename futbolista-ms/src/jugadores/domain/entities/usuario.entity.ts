/**
 * Usuario de dominio administrado por `auth-ms`. Este microservicio sólo lo
 * lee para resolver la identidad del jugador; nunca lo modifica.
 */
export interface Usuario {
  id: string;
  supabaseAuthId: string | null;
  email: string;
  rolNombre: string;
  nombres: string;
  apellidos: string;
  /** Vive en `persona`; no se replica en el módulo de jugadores. */
  fechaNacimiento: string | null;
}
