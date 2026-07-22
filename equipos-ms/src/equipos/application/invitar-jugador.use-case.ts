import { Injectable } from '@nestjs/common';
import { Invitacion } from '../domain/entities/invitacion.entity';
import {
  AlreadyMiembroError,
  InvalidPlayerError,
  InvitacionAlreadyExistsError,
  UsuarioNotFoundError,
} from '../domain/exceptions/equipos.errors';
import { EquiposRepository } from '../domain/repositories/equipos.repository';
import { EquipoAccessService, ROL_FUTBOLISTA } from './equipo-access.service';

export interface InvitarJugadorInput {
  authId: string;
  equipoId: string;
  jugadorEmail: string;
  mensaje?: string | null;
}

@Injectable()
export class InvitarJugadorUseCase {
  constructor(
    private readonly repo: EquiposRepository,
    private readonly access: EquipoAccessService,
  ) {}

  async execute(input: InvitarJugadorInput): Promise<Invitacion> {
    const usuario = await this.access.resolverUsuario(input.authId);
    const equipo = await this.access.requireEquipo(input.equipoId);
    this.access.requireOwner(equipo, usuario);

    const jugador = await this.repo.findUsuarioByEmail(input.jugadorEmail);
    if (!jugador) {
      throw new UsuarioNotFoundError('No existe un usuario con ese correo');
    }
    if (jugador.rolNombre !== ROL_FUTBOLISTA) {
      throw new InvalidPlayerError();
    }

    const yaMiembro = await this.repo.findMiembro(input.equipoId, jugador.id);
    if (yaMiembro) {
      throw new AlreadyMiembroError();
    }

    const pendiente = await this.repo.findInvitacionPendiente(
      input.equipoId,
      jugador.id,
    );
    if (pendiente) {
      throw new InvitacionAlreadyExistsError();
    }

    return this.repo.createInvitacion({
      equipoId: input.equipoId,
      usuarioId: jugador.id,
      mensaje: input.mensaje ?? null,
    });
  }
}
