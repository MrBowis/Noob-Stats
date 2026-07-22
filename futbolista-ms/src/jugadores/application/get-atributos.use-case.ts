import { Injectable } from '@nestjs/common';
import { JugadorAtributo } from '../domain/entities/jugador.entity';
import { JugadoresRepository } from '../domain/repositories/jugadores.repository';
import { JugadorAccessService } from './jugador-access.service';

export interface GetAtributosInput {
  jugadorId: string;
}

@Injectable()
export class GetAtributosUseCase {
  constructor(
    private readonly repo: JugadoresRepository,
    private readonly access: JugadorAccessService,
  ) {}

  async execute(input: GetAtributosInput): Promise<JugadorAtributo | null> {
    await this.access.requireJugador(input.jugadorId);
    return this.repo.findAtributos(input.jugadorId);
  }
}
