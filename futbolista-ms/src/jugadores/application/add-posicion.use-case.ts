import { Injectable } from '@nestjs/common';
import { Posicion } from '../domain/catalogos';
import { JugadorPosicion } from '../domain/entities/jugador.entity';
import { PosicionAlreadyExistsError } from '../domain/exceptions/jugadores.errors';
import { JugadoresRepository } from '../domain/repositories/jugadores.repository';
import { JugadorAccessService } from './jugador-access.service';

export interface AddPosicionInput {
  authId: string;
  jugadorId: string;
  posicion: Posicion;
  esPrincipal?: boolean;
}

/**
 * Añade una posición al jugador. Un jugador tiene como máximo una principal:
 * al marcar una nueva se degrada la anterior a secundaria.
 */
@Injectable()
export class AddPosicionUseCase {
  constructor(
    private readonly repo: JugadoresRepository,
    private readonly access: JugadorAccessService,
  ) {}

  async execute(input: AddPosicionInput): Promise<JugadorPosicion> {
    await this.access.requireOwnedJugador(input.authId, input.jugadorId);

    const actuales = await this.repo.listPosiciones(input.jugadorId);
    if (actuales.some((p) => p.posicion === input.posicion)) {
      throw new PosicionAlreadyExistsError();
    }

    const esPrincipal = input.esPrincipal ?? actuales.length === 0;
    if (esPrincipal) {
      await this.repo.clearPosicionPrincipal(input.jugadorId);
    }

    return this.repo.createPosicion({
      jugadorId: input.jugadorId,
      posicion: input.posicion,
      esPrincipal,
    });
  }
}
