export type InvitacionEstado =
  'pendiente' | 'aceptada' | 'rechazada' | 'cancelada';

/**
 * Invitación que un Entrenador envía a un Jugador para unirse a su equipo.
 */
export interface Invitacion {
  id: string;
  equipoId: string;
  usuarioId: string;
  estado: InvitacionEstado;
  mensaje: string | null;
  createdAt: string;
  respondedAt: string | null;
}

/**
 * Invitación con el nombre del equipo y los datos del jugador resueltos, para
 * listarlas tanto desde la vista del entrenador como desde la del jugador.
 */
export interface InvitacionDetalle {
  id: string;
  equipoId: string;
  equipoNombre: string;
  usuarioId: string;
  jugadorNombres: string;
  jugadorApellidos: string;
  jugadorEmail: string;
  estado: InvitacionEstado;
  mensaje: string | null;
  createdAt: string;
  respondedAt: string | null;
}
