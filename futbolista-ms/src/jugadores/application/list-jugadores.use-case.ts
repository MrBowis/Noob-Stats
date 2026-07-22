import { Injectable } from '@nestjs/common';
import { Jugador } from '../domain/entities/jugador.entity';
import {
  JugadorFiltro,
  JugadoresRepository,
} from '../domain/repositories/jugadores.repository';

export type ListJugadoresInput = JugadorFiltro;

/**
 * Listado público de perfiles. El filtro por posición se resuelve contra
 * `jugador_posicion` (principal o secundaria).
 */
@Injectable()
export class ListJugadoresUseCase {
  constructor(private readonly repo: JugadoresRepository) {}

  execute(input: ListJugadoresInput): Promise<Jugador[]> {
    return this.repo.listJugadores({
      posicion: input.posicion,
      piernaHabil: input.piernaHabil,
      estado: input.estado,
    });
  }
}
