import { Injectable } from '@nestjs/common';
import { Posicion } from '../domain/catalogos';
import { JugadorPosicion } from '../domain/entities/jugador.entity';
import {
  PosicionAlreadyExistsError,
  PosicionNotFoundError,
} from '../domain/exceptions/jugadores.errors';
import { JugadoresRepository } from '../domain/repositories/jugadores.repository';
import { JugadorAccessService } from './jugador-access.service';

export interface UpdatePosicionInput {
  authId: string;
  jugadorId: string;
  posicionId: string;
  posicion?: Posicion;
  esPrincipal?: boolean;
}

@Injectable()
export class UpdatePosicionUseCase {
  constructor(
    private readonly repo: JugadoresRepository,
    private readonly access: JugadorAccessService,
  ) {}

  async execute(input: UpdatePosicionInput): Promise<JugadorPosicion> {
    await this.access.requireOwnedJugador(input.authId, input.jugadorId);

    const actual = await this.repo.findPosicionById(input.posicionId);
    if (!actual || actual.jugadorId !== input.jugadorId) {
      throw new PosicionNotFoundError();
    }

    if (input.posicion && input.posicion !== actual.posicion) {
      const otras = await this.repo.listPosiciones(input.jugadorId);
      if (
        otras.some(
          (p) => p.id !== input.posicionId && p.posicion === input.posicion,
        )
      ) {
        throw new PosicionAlreadyExistsError();
      }
    }

    if (input.esPrincipal) {
      await this.repo.clearPosicionPrincipal(input.jugadorId, input.posicionId);
    }

    return this.repo.updatePosicion(input.posicionId, {
      posicion: input.posicion,
      esPrincipal: input.esPrincipal,
    });
  }
}
