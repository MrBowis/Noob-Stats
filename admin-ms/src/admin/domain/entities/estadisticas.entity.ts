/**
 * Fila de la tabla de posiciones: rendimiento agregado de un equipo a partir de
 * sus partidos finalizados.
 */
export interface PosicionEquipo {
  equipoId: string;
  nombre: string;
  partidosJugados: number;
  victorias: number;
  empates: number;
  derrotas: number;
  golesFavor: number;
  golesContra: number;
  diferenciaGoles: number;
  puntos: number;
}

/**
 * Estadísticas globales para el panel de administración.
 */
export interface EstadisticasAdmin {
  usuarios: {
    total: number;
    activos: number;
    inactivos: number;
  };
  equipos: {
    total: number;
  };
  tablaPosiciones: PosicionEquipo[];
}
