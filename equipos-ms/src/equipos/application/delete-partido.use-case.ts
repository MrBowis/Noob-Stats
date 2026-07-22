import { Injectable } from '@nestjs/common';
import { PartidoNotFoundError } from '../domain/exceptions/equipos.errors';
import { EquiposRepository } from '../domain/repositories/equipos.repository';
import { EquipoAccessService } from './equipo-access.service';

export interface DeletePartidoInput {
  authId: string;
  partidoId: string;
}

@Injectable()
export class DeletePartidoUseCase {
  constructor(
    private readonly repo: EquiposRepository,
    private readonly access: EquipoAccessService,
  ) {}

  async execute(input: DeletePartidoInput): Promise<void> {
    const usuario = await this.access.resolverUsuario(input.authId);
    const partido = await this.repo.findPartidoById(input.partidoId);
    if (!partido) {
      throw new PartidoNotFoundError();
    }
    const equipo = await this.access.requireEquipo(partido.equipoId);
    this.access.requireOwner(equipo, usuario);
    await this.repo.deletePartido(input.partidoId);
  }
}
