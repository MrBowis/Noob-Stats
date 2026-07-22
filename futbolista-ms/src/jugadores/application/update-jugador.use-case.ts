import { Injectable } from '@nestjs/common';
import { EstadoJugador, Genero, PiernaHabil } from '../domain/catalogos';
import { Jugador } from '../domain/entities/jugador.entity';
import { JugadoresRepository } from '../domain/repositories/jugadores.repository';
import { JugadorAccessService } from './jugador-access.service';

export interface UpdateJugadorInput {
  authId: string;
  jugadorId: string;
  genero?: Genero | null;
  nacionalidad?: string | null;
  fotoUrl?: string | null;
  piernaHabil?: PiernaHabil | null;
  estado?: EstadoJugador;
}

/**
 * Sólo el propietario edita su perfil. `userId` no es actualizable: la
 * pertenencia a equipos y las estadísticas son dominio de `equipos-ms`.
 */
@Injectable()
export class UpdateJugadorUseCase {
  constructor(
    private readonly repo: JugadoresRepository,
    private readonly access: JugadorAccessService,
  ) {}

  async execute(input: UpdateJugadorInput): Promise<Jugador> {
    await this.access.requireOwnedJugador(input.authId, input.jugadorId);

    return this.repo.updateJugador(input.jugadorId, {
      genero: input.genero,
      nacionalidad: input.nacionalidad,
      fotoUrl: input.fotoUrl,
      piernaHabil: input.piernaHabil,
      estado: input.estado,
    });
  }
}
