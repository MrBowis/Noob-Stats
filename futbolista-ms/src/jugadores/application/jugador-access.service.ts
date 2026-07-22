import { Injectable } from '@nestjs/common';
import { Jugador } from '../domain/entities/jugador.entity';
import { Usuario } from '../domain/entities/usuario.entity';
import {
  JugadorNotFoundError,
  NotJugadorOwnerError,
  UsuarioNotFoundError,
} from '../domain/exceptions/jugadores.errors';
import { JugadoresRepository } from '../domain/repositories/jugadores.repository';

/**
 * Autorización del módulo: la información deportiva es pública para cualquier
 * usuario autenticado, pero sólo el propietario del perfil puede modificarla.
 */
@Injectable()
export class JugadorAccessService {
  constructor(private readonly repo: JugadoresRepository) {}

  async resolverUsuario(authId: string): Promise<Usuario> {
    const usuario = await this.repo.findUsuarioByAuthId(authId);
    if (!usuario) {
      throw new UsuarioNotFoundError();
    }
    return usuario;
  }

  async requireJugador(jugadorId: string): Promise<Jugador> {
    const jugador = await this.repo.findJugadorById(jugadorId);
    if (!jugador) {
      throw new JugadorNotFoundError();
    }
    return jugador;
  }

  requireOwner(jugador: Jugador, usuario: Usuario): void {
    if (jugador.userId !== usuario.id) {
      throw new NotJugadorOwnerError();
    }
  }

  /** Atajo para las rutas de escritura: resuelve, busca y valida propiedad. */
  async requireOwnedJugador(
    authId: string,
    jugadorId: string,
  ): Promise<Jugador> {
    const usuario = await this.resolverUsuario(authId);
    const jugador = await this.requireJugador(jugadorId);
    this.requireOwner(jugador, usuario);
    return jugador;
  }
}
