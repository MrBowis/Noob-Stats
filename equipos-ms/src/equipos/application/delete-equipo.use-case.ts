import { Injectable } from '@nestjs/common';
import { EquiposRepository } from '../domain/repositories/equipos.repository';
import { EquipoAccessService } from './equipo-access.service';

export interface DeleteEquipoInput {
  authId: string;
  equipoId: string;
}

@Injectable()
export class DeleteEquipoUseCase {
  constructor(
    private readonly repo: EquiposRepository,
    private readonly access: EquipoAccessService,
  ) {}

  async execute(input: DeleteEquipoInput): Promise<void> {
    const usuario = await this.access.resolverUsuario(input.authId);
    const equipo = await this.access.requireEquipo(input.equipoId);
    this.access.requireOwner(equipo, usuario);
    await this.repo.deleteEquipo(input.equipoId);
  }
}
