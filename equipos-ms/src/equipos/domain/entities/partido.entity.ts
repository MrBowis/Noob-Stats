export type PartidoEstado = 'programado' | 'finalizado' | 'cancelado';
export type TarjetaTipo = 'amarilla' | 'roja';

/**
 * Partido de un equipo: programado (próximo) o finalizado (con resultado).
 */
export interface Partido {
  id: string;
  equipoId: string;
  rival: string;
  fecha: string;
  ubicacion: string | null;
  esLocal: boolean;
  estado: PartidoEstado;
  golesFavor: number | null;
  golesContra: number | null;
  notas: string | null;
  createdAt: string;
}

/** Gol anotado por un jugador del equipo en un partido. */
export interface Gol {
  id: string;
  partidoId: string;
  usuarioId: string | null;
  jugadorNombres: string | null;
  jugadorApellidos: string | null;
  minuto: number | null;
}

/** Tarjeta (amarilla/roja) mostrada a un jugador del equipo en un partido. */
export interface Tarjeta {
  id: string;
  partidoId: string;
  usuarioId: string | null;
  jugadorNombres: string | null;
  jugadorApellidos: string | null;
  tipo: TarjetaTipo;
  minuto: number | null;
}

/** Partido con el detalle de sus goleadores y tarjetas. */
export interface PartidoDetalle extends Partido {
  goles: Gol[];
  tarjetas: Tarjeta[];
}
