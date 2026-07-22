import { Injectable } from '@nestjs/common';
import { EstadoJugador, Genero, PiernaHabil } from '../domain/catalogos';
import { Jugador } from '../domain/entities/jugador.entity';
import { JugadorAlreadyExistsError } from '../domain/exceptions/jugadores.errors';
import { JugadoresRepository } from '../domain/repositories/jugadores.repository';
import { JugadorAccessService } from './jugador-access.service';

export interface CreateJugadorInput {
  authId: string;
  genero?: Genero | null;
  nacionalidad?: string | null;
  fotoUrl?: string | null;
  piernaHabil?: PiernaHabil | null;
  estado?: EstadoJugador;
}

/**
 * Crea el perfil deportivo del usuario autenticado. El propietario sale del
 * token: el cliente nunca puede elegir de quién es el perfil.
 */
@Injectable()
export class CreateJugadorUseCase {
  constructor(
    private readonly repo: JugadoresRepository,
    private readonly access: JugadorAccessService,
  ) {}

  async execute(input: CreateJugadorInput): Promise<Jugador> {
    const usuario = await this.access.resolverUsuario(input.authId);

    const existente = await this.repo.findJugadorByUserId(usuario.id);
    if (existente) {
      throw new JugadorAlreadyExistsError();
    }

    return this.repo.createJugador({
      userId: usuario.id,
      genero: input.genero,
      nacionalidad: input.nacionalidad,
      fotoUrl: input.fotoUrl,
      piernaHabil: input.piernaHabil,
      estado: input.estado,
    });
  }
}
