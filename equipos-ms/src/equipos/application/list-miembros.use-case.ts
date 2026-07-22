import { Injectable } from '@nestjs/common';
import { MiembroDetalle } from '../domain/entities/equipo-miembro.entity';
import { EquiposRepository } from '../domain/repositories/equipos.repository';
import { EquipoAccessService } from './equipo-access.service';

export interface ListMiembrosInput {
  authId: string;
  equipoId: string;
}

@Injectable()
export class ListMiembrosUseCase {
  constructor(
    private readonly repo: EquiposRepository,
    private readonly access: EquipoAccessService,
  ) {}

  async execute(input: ListMiembrosInput): Promise<MiembroDetalle[]> {
    const usuario = await this.access.resolverUsuario(input.authId);
    const equipo = await this.access.requireEquipo(input.equipoId);
    await this.access.requireAccess(equipo, usuario);
    return this.repo.listMiembros(input.equipoId);
  }
}
