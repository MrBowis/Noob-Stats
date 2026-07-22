import { Injectable } from '@nestjs/common';
import { Jugador } from '../domain/entities/jugador.entity';
import { JugadorNotFoundError } from '../domain/exceptions/jugadores.errors';
import { JugadoresRepository } from '../domain/repositories/jugadores.repository';
import { JugadorAccessService } from './jugador-access.service';

export interface GetMiJugadorInput {
  authId: string;
}

/** Perfil del usuario autenticado, para que el frontend no adivine su id. */
@Injectable()
export class GetMiJugadorUseCase {
  constructor(
    private readonly repo: JugadoresRepository,
    private readonly access: JugadorAccessService,
  ) {}

  async execute(input: GetMiJugadorInput): Promise<Jugador> {
    const usuario = await this.access.resolverUsuario(input.authId);
    const jugador = await this.repo.findJugadorByUserId(usuario.id);
    if (!jugador) {
      throw new JugadorNotFoundError('Todavía no has creado tu perfil');
    }
    return jugador;
  }
}
