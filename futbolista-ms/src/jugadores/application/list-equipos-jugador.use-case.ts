import { Injectable } from '@nestjs/common';
import { EquipoDelJugador } from '../domain/entities/equipo-jugador.entity';
import { EquiposGateway } from '../domain/repositories/equipos.gateway';
import { JugadorAccessService } from './jugador-access.service';

export interface ListEquiposJugadorInput {
  authId: string;
  accessToken: string;
  jugadorId: string;
}

/**
 * Equipos del jugador, servidos por `equipos-ms`. Nada de esto se persiste
 * aquí: nombre, escudo, ciudad y partidos son de ese microservicio.
 *
 * `equipos-ms` sólo expone `GET /equipos` para el usuario del token, así que
 * esta ruta se limita al propietario del perfil.
 */
@Injectable()
export class ListEquiposJugadorUseCase {
  constructor(
    private readonly access: JugadorAccessService,
    private readonly equipos: EquiposGateway,
  ) {}

  async execute(input: ListEquiposJugadorInput): Promise<EquipoDelJugador[]> {
    await this.access.requireOwnedJugador(input.authId, input.jugadorId);
    return this.equipos.listEquiposDelUsuario(input.accessToken);
  }
}
