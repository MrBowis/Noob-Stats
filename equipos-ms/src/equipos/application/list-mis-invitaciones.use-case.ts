import { Injectable } from '@nestjs/common';
import { InvitacionDetalle } from '../domain/entities/invitacion.entity';
import { EquiposRepository } from '../domain/repositories/equipos.repository';
import { EquipoAccessService } from './equipo-access.service';

export interface ListMisInvitacionesInput {
  authId: string;
  soloPendientes: boolean;
}

@Injectable()
export class ListMisInvitacionesUseCase {
  constructor(
    private readonly repo: EquiposRepository,
    private readonly access: EquipoAccessService,
  ) {}

  async execute(input: ListMisInvitacionesInput): Promise<InvitacionDetalle[]> {
    const usuario = await this.access.resolverUsuario(input.authId);
    return this.repo.listInvitacionesByUsuario(
      usuario.id,
      input.soloPendientes,
    );
  }
}
