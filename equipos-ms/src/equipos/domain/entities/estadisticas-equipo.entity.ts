import { Partido } from './partido.entity';

/**
 * Estadísticas generales agregadas de un equipo, calculadas a partir de sus
 * partidos finalizados y su plantilla.
 */
export interface EstadisticasEquipo {
  equipoId: string;
  totalMiembros: number;
  partidosJugados: number;
  victorias: number;
  empates: number;
  derrotas: number;
  golesFavor: number;
  golesContra: number;
  diferenciaGoles: number;
  puntos: number;
  partidosProgramados: number;
  proximoPartido: Partido | null;
}
