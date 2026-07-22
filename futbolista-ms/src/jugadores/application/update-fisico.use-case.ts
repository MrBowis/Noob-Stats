import { Injectable } from '@nestjs/common';
import { JugadorFisico } from '../domain/entities/jugador.entity';
import { JugadoresRepository } from '../domain/repositories/jugadores.repository';
import { JugadorAccessService } from './jugador-access.service';

export interface UpdateFisicoInput {
  authId: string;
  jugadorId: string;
  alturaCm?: number | null;
  pesoKg?: number | null;
}

/** Altura y peso viven sólo en `jugador_fisico` (relación 1:1). */
@Injectable()
export class UpdateFisicoUseCase {
  constructor(
    private readonly repo: JugadoresRepository,
    private readonly access: JugadorAccessService,
  ) {}

  async execute(input: UpdateFisicoInput): Promise<JugadorFisico> {
    await this.access.requireOwnedJugador(input.authId, input.jugadorId);

    return this.repo.upsertFisico(input.jugadorId, {
      alturaCm: input.alturaCm,
      pesoKg: input.pesoKg,
    });
  }
}
