import { Injectable } from '@nestjs/common';
import { EstadoLesion } from '../domain/catalogos';
import { JugadorLesion } from '../domain/entities/jugador.entity';
import { JugadoresRepository } from '../domain/repositories/jugadores.repository';
import { JugadorAccessService } from './jugador-access.service';

export interface ListLesionesInput {
  jugadorId: string;
  estado?: EstadoLesion;
}

/** Historial de lesiones; consultable por cualquier usuario autenticado. */
@Injectable()
export class ListLesionesUseCase {
  constructor(
    private readonly repo: JugadoresRepository,
    private readonly access: JugadorAccessService,
  ) {}

  async execute(input: ListLesionesInput): Promise<JugadorLesion[]> {
    await this.access.requireJugador(input.jugadorId);
    const lesiones = await this.repo.listLesiones(input.jugadorId);

    return input.estado
      ? lesiones.filter((l) => l.estado === input.estado)
      : lesiones;
  }
}
