import { Injectable } from '@nestjs/common';
import { Jugador } from '../domain/entities/jugador.entity';
import { JugadorAccessService } from './jugador-access.service';

export interface GetJugadorInput {
  jugadorId: string;
}

/** Consulta pública: cualquier usuario autenticado puede leer el perfil. */
@Injectable()
export class GetJugadorUseCase {
  constructor(private readonly access: JugadorAccessService) {}

  execute(input: GetJugadorInput): Promise<Jugador> {
    return this.access.requireJugador(input.jugadorId);
  }
}
