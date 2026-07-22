import { Injectable } from '@nestjs/common';
import { PosicionNotFoundError } from '../domain/exceptions/jugadores.errors';
import { JugadoresRepository } from '../domain/repositories/jugadores.repository';
import { JugadorAccessService } from './jugador-access.service';

export interface DeletePosicionInput {
  authId: string;
  jugadorId: string;
  posicionId: string;
}

@Injectable()
export class DeletePosicionUseCase {
  constructor(
    private readonly repo: JugadoresRepository,
    private readonly access: JugadorAccessService,
  ) {}

  async execute(input: DeletePosicionInput): Promise<void> {
    await this.access.requireOwnedJugador(input.authId, input.jugadorId);

    const posicion = await this.repo.findPosicionById(input.posicionId);
    if (!posicion || posicion.jugadorId !== input.jugadorId) {
      throw new PosicionNotFoundError();
    }

    await this.repo.deletePosicion(input.posicionId);
  }
}
