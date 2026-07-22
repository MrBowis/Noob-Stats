import { Injectable } from '@nestjs/common';
import { ATRIBUTOS_POR_DEFECTO } from '../domain/catalogos';
import { ResumenAtributos } from '../domain/entities/jugador.entity';
import { JugadoresRepository } from '../domain/repositories/jugadores.repository';
import { JugadorAccessService } from './jugador-access.service';

export interface GetResumenAtributosInput {
  jugadorId: string;
}

/**
 * Respuesta mínima para pintar el pentágono en el frontend. No incluye
 * estadísticas de partidos: ésas se piden a `equipos-ms`.
 */
@Injectable()
export class GetResumenAtributosUseCase {
  constructor(
    private readonly repo: JugadoresRepository,
    private readonly access: JugadorAccessService,
  ) {}

  async execute(input: GetResumenAtributosInput): Promise<ResumenAtributos> {
    await this.access.requireJugador(input.jugadorId);
    const atributos = await this.repo.findAtributos(input.jugadorId);

    return {
      jugadorId: input.jugadorId,
      atributos: atributos
        ? {
            ataque: atributos.ataque,
            tactica: atributos.tactica,
            tecnica: atributos.tecnica,
            defensa: atributos.defensa,
            creatividad: atributos.creatividad,
          }
        : { ...ATRIBUTOS_POR_DEFECTO },
    };
  }
}
