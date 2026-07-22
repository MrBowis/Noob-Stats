import { Injectable } from '@nestjs/common';
import { JugadorAtributo } from '../domain/entities/jugador.entity';
import { JugadoresRepository } from '../domain/repositories/jugadores.repository';
import { JugadorAccessService } from './jugador-access.service';

export interface UpdateAtributosInput {
  authId: string;
  jugadorId: string;
  ataque: number;
  tactica: number;
  tecnica: number;
  defensa: number;
  creatividad: number;
}

/**
 * Los cinco atributos son valoraciones independientes (0-100) del perfil, no
 * estadísticas de partidos. El rango lo valida el DTO y también la BD.
 */
@Injectable()
export class UpdateAtributosUseCase {
  constructor(
    private readonly repo: JugadoresRepository,
    private readonly access: JugadorAccessService,
  ) {}

  async execute(input: UpdateAtributosInput): Promise<JugadorAtributo> {
    await this.access.requireOwnedJugador(input.authId, input.jugadorId);

    return this.repo.upsertAtributos(input.jugadorId, {
      ataque: input.ataque,
      tactica: input.tactica,
      tecnica: input.tecnica,
      defensa: input.defensa,
      creatividad: input.creatividad,
    });
  }
}
