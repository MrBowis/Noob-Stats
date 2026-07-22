import { Injectable } from '@nestjs/common';
import { EquipoMiembro } from '../domain/entities/equipo-miembro.entity';
import { Invitacion } from '../domain/entities/invitacion.entity';
import {
  InvitacionNotFoundError,
  InvitacionNotPendingError,
  NotInvitacionOwnerError,
} from '../domain/exceptions/equipos.errors';
import { EquiposRepository } from '../domain/repositories/equipos.repository';
import { EquipoAccessService } from './equipo-access.service';

export interface ResponderInvitacionInput {
  authId: string;
  invitacionId: string;
  aceptar: boolean;
}

export interface ResponderInvitacionOutput {
  invitacion: Invitacion;
  miembro: EquipoMiembro | null;
}

@Injectable()
export class ResponderInvitacionUseCase {
  constructor(
    private readonly repo: EquiposRepository,
    private readonly access: EquipoAccessService,
  ) {}

  async execute(
    input: ResponderInvitacionInput,
  ): Promise<ResponderInvitacionOutput> {
    const usuario = await this.access.resolverUsuario(input.authId);

    const invitacion = await this.repo.findInvitacionById(input.invitacionId);
    if (!invitacion) {
      throw new InvitacionNotFoundError();
    }
    if (invitacion.usuarioId !== usuario.id) {
      throw new NotInvitacionOwnerError();
    }
    if (invitacion.estado !== 'pendiente') {
      throw new InvitacionNotPendingError();
    }

    if (!input.aceptar) {
      const rechazada = await this.repo.updateInvitacionEstado(
        invitacion.id,
        'rechazada',
      );
      return { invitacion: rechazada, miembro: null };
    }

    const yaMiembro = await this.repo.findMiembro(
      invitacion.equipoId,
      usuario.id,
    );
    const miembro =
      yaMiembro ??
      (await this.repo.addMiembro({
        equipoId: invitacion.equipoId,
        usuarioId: usuario.id,
      }));

    const aceptada = await this.repo.updateInvitacionEstado(
      invitacion.id,
      'aceptada',
    );
    return { invitacion: aceptada, miembro };
  }
}
