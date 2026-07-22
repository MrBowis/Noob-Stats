import { Injectable } from '@nestjs/common';
import { JugadorFisico } from '../domain/entities/jugador.entity';
import { JugadoresRepository } from '../domain/repositories/jugadores.repository';
import { JugadorAccessService } from './jugador-access.service';

export interface GetFisicoInput {
  jugadorId: string;
}

@Injectable()
export class GetFisicoUseCase {
  constructor(
    private readonly repo: JugadoresRepository,
    private readonly access: JugadorAccessService,
  ) {}

  async execute(input: GetFisicoInput): Promise<JugadorFisico | null> {
    await this.access.requireJugador(input.jugadorId);
    return this.repo.findFisico(input.jugadorId);
  }
}
