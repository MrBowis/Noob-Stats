import { Injectable } from '@nestjs/common';
import { Gol } from '../domain/entities/partido.entity';
import {
  MiembroNotFoundError,
  PartidoNotFoundError,
} from '../domain/exceptions/equipos.errors';
import { EquiposRepository } from '../domain/repositories/equipos.repository';
import { EquipoAccessService } from './equipo-access.service';

export interface RegisterGolInput {
  authId: string;
  partidoId: string;
  usuarioId?: string | null;
  minuto?: number | null;
}

@Injectable()
export class RegisterGolUseCase {
  constructor(
    private readonly repo: EquiposRepository,
    private readonly access: EquipoAccessService,
  ) {}

  async execute(input: RegisterGolInput): Promise<Gol> {
    const usuario = await this.access.resolverUsuario(input.authId);
    const partido = await this.repo.findPartidoById(input.partidoId);
    if (!partido) {
      throw new PartidoNotFoundError();
    }
    const equipo = await this.access.requireEquipo(partido.equipoId);
    this.access.requireOwner(equipo, usuario);

    // El goleador debe pertenecer al equipo.
    if (input.usuarioId) {
      const miembro = await this.repo.findMiembro(equipo.id, input.usuarioId);
      if (!miembro) {
        throw new MiembroNotFoundError();
      }
    }

    return this.repo.addGol({
      partidoId: input.partidoId,
      usuarioId: input.usuarioId,
      minuto: input.minuto,
    });
  }
}
