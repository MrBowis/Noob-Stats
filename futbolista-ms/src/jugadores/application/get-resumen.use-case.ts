import { Injectable } from '@nestjs/common';
import { ATRIBUTOS_POR_DEFECTO } from '../domain/catalogos';
import { ResumenJugador } from '../domain/entities/jugador.entity';
import { UsuarioNotFoundError } from '../domain/exceptions/jugadores.errors';
import { JugadoresRepository } from '../domain/repositories/jugadores.repository';
import { JugadorAccessService } from './jugador-access.service';

export interface GetResumenInput {
  jugadorId: string;
}

/**
 * Tarjeta resumida del futbolista. Nombre y fecha de nacimiento se leen de
 * `auth-ms` (persona/usuario); este microservicio no los almacena.
 */
@Injectable()
export class GetResumenUseCase {
  constructor(
    private readonly repo: JugadoresRepository,
    private readonly access: JugadorAccessService,
  ) {}

  async execute(input: GetResumenInput): Promise<ResumenJugador> {
    const jugador = await this.access.requireJugador(input.jugadorId);

    const [usuarios, fisico, posiciones, atributos] = await Promise.all([
      this.repo.findUsuariosByIds([jugador.userId]),
      this.repo.findFisico(jugador.id),
      this.repo.listPosiciones(jugador.id),
      this.repo.findAtributos(jugador.id),
    ]);

    const usuario = usuarios[0];
    if (!usuario) {
      throw new UsuarioNotFoundError();
    }

    return {
      jugadorId: jugador.id,
      userId: jugador.userId,
      nombres: usuario.nombres,
      apellidos: usuario.apellidos,
      fechaNacimiento: usuario.fechaNacimiento,
      nacionalidad: jugador.nacionalidad,
      fotoUrl: jugador.fotoUrl,
      estado: jugador.estado,
      posicionPrincipal:
        posiciones.find((p) => p.esPrincipal)?.posicion ?? null,
      posicionesSecundarias: posiciones
        .filter((p) => !p.esPrincipal)
        .map((p) => p.posicion),
      piernaHabil: jugador.piernaHabil,
      alturaCm: fisico?.alturaCm ?? null,
      pesoKg: fisico?.pesoKg ?? null,
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
