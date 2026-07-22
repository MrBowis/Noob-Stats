/**
 * Relación entre un Equipo y un Jugador (Usuario) que forma parte de él.
 * `posicion` es el rol descriptivo (p. ej. "Delantero"); `slot` es la casilla
 * táctica dentro de la formación del equipo (p. ej. "DCL"), null si es suplente.
 */
export interface EquipoMiembro {
  id: string;
  equipoId: string;
  usuarioId: string;
  dorsal: number | null;
  posicion: string | null;
  slot: string | null;
  estado: string;
  joinedAt: string;
}

/**
 * Miembro del equipo con los datos de la persona ya resueltos, pensado para
 * listar la plantilla completa.
 */
export interface MiembroDetalle {
  id: string;
  usuarioId: string;
  nombres: string;
  apellidos: string;
  email: string;
  dorsal: number | null;
  posicion: string | null;
  slot: string | null;
  estado: string;
  joinedAt: string;
}
