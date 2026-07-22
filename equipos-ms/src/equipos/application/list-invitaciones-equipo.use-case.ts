import { Injectable } from '@nestjs/common';
import { InvitacionDetalle } from '../domain/entities/invitacion.entity';
import { EquiposRepository } from '../domain/repositories/equipos.repository';
import { EquipoAccessService } from './equipo-access.service';

export interface ListInvitacionesEquipoInput {
  authId: string;
  equipoId: string;
}

@Injectable()
export class ListInvitacionesEquipoUseCase {
  constructor(
    private readonly repo: EquiposRepository,
    private readonly access: EquipoAccessService,
  ) {}

  async execute(
    input: ListInvitacionesEquipoInput,
  ): Promise<InvitacionDetalle[]> {
    const usuario = await this.access.resolverUsuario(input.authId);
    const equipo = await this.access.requireEquipo(input.equipoId);
    this.access.requireOwner(equipo, usuario);
    return this.repo.listInvitacionesByEquipo(input.equipoId);
  }
}
