import { Injectable } from '@nestjs/common';
import { Invitacion } from '../domain/entities/invitacion.entity';
import {
  InvitacionNotFoundError,
  InvitacionNotPendingError,
} from '../domain/exceptions/equipos.errors';
import { EquiposRepository } from '../domain/repositories/equipos.repository';
import { EquipoAccessService } from './equipo-access.service';

export interface CancelarInvitacionInput {
  authId: string;
  invitacionId: string;
}

@Injectable()
export class CancelarInvitacionUseCase {
  constructor(
    private readonly repo: EquiposRepository,
    private readonly access: EquipoAccessService,
  ) {}

  async execute(input: CancelarInvitacionInput): Promise<Invitacion> {
    const usuario = await this.access.resolverUsuario(input.authId);

    const invitacion = await this.repo.findInvitacionById(input.invitacionId);
    if (!invitacion) {
      throw new InvitacionNotFoundError();
    }
    const equipo = await this.access.requireEquipo(invitacion.equipoId);
    this.access.requireOwner(equipo, usuario);

    if (invitacion.estado !== 'pendiente') {
      throw new InvitacionNotPendingError();
    }
    return this.repo.updateInvitacionEstado(invitacion.id, 'cancelada');
  }
}
