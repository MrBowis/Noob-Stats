import { Injectable } from '@nestjs/common';
import { JugadorPosicion } from '../domain/entities/jugador.entity';
import { JugadoresRepository } from '../domain/repositories/jugadores.repository';
import { JugadorAccessService } from './jugador-access.service';

export interface ListPosicionesInput {
  jugadorId: string;
}

@Injectable()
export class ListPosicionesUseCase {
  constructor(
    private readonly repo: JugadoresRepository,
    private readonly access: JugadorAccessService,
  ) {}

  async execute(input: ListPosicionesInput): Promise<JugadorPosicion[]> {
    await this.access.requireJugador(input.jugadorId);
    return this.repo.listPosiciones(input.jugadorId);
  }
}
