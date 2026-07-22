import { EquipoDelJugador } from '../entities/equipo-jugador.entity';

/**
 * Puerto hacia `equipos-ms`. Todo lo relativo a equipos, plantillas, partidos
 * y estadísticas de partido se consulta aquí en lugar de replicarlo.
 */
export abstract class EquiposGateway {
  /**
   * Equipos del usuario autenticado. Se reenvía su propio access token porque
   * `equipos-ms` sólo expone `GET /equipos` para el usuario del token.
   */
  abstract listEquiposDelUsuario(
    accessToken: string,
  ): Promise<EquipoDelJugador[]>;
}
