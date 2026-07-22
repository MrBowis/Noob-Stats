import { Injectable } from '@nestjs/common';
import {
  GolNotFoundError,
  PartidoNotFoundError,
} from '../domain/exceptions/equipos.errors';
import { EquiposRepository } from '../domain/repositories/equipos.repository';
import { EquipoAccessService } from './equipo-access.service';

@Injectable()
export class DeleteGolUseCase {
  constructor(
    private readonly repo: EquiposRepository,
    private readonly access: EquipoAccessService,
  ) {}

  async execute(input: { authId: string; golId: string }): Promise<void> {
    const usuario = await this.access.resolverUsuario(input.authId);
    const gol = await this.repo.findGolById(input.golId);
    if (!gol) {
      throw new GolNotFoundError();
    }
    const partido = await this.repo.findPartidoById(gol.partidoId);
    if (!partido) {
      throw new PartidoNotFoundError();
    }
    const equipo = await this.access.requireEquipo(partido.equipoId);
    this.access.requireOwner(equipo, usuario);

    await this.repo.deleteGol(input.golId);
  }
}
