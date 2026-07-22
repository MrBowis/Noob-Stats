/**
 * Equipo tal como lo devuelve `equipos-ms`. Se expone de paso (read-through)
 * y **no** se persiste: nombre, escudo, ciudad y partidos pertenecen a ese
 * microservicio.
 */
export interface EquipoDelJugador {
  id: string;
  nombre: string;
  descripcion: string | null;
  categoria: string | null;
  ciudad: string | null;
  escudoUrl: string | null;
  entrenadorId: string;
  createdAt: string;
}
