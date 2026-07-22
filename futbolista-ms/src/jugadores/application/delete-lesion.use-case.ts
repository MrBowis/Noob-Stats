import { Injectable } from '@nestjs/common';
import { LesionNotFoundError } from '../domain/exceptions/jugadores.errors';
import { JugadoresRepository } from '../domain/repositories/jugadores.repository';
import { JugadorAccessService } from './jugador-access.service';

export interface DeleteLesionInput {
  authId: string;
  jugadorId: string;
  lesionId: string;
}

@Injectable()
export class DeleteLesionUseCase {
  constructor(
    private readonly repo: JugadoresRepository,
    private readonly access: JugadorAccessService,
  ) {}

  async execute(input: DeleteLesionInput): Promise<void> {
    await this.access.requireOwnedJugador(input.authId, input.jugadorId);

    const lesion = await this.repo.findLesionById(input.lesionId);
    if (!lesion || lesion.jugadorId !== input.jugadorId) {
      throw new LesionNotFoundError();
    }

    await this.repo.deleteLesion(input.lesionId);
  }
}
