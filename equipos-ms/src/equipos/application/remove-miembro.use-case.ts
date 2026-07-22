import { Injectable } from '@nestjs/common';
import {
  ForbiddenEquipoAccessError,
  MiembroNotFoundError,
} from '../domain/exceptions/equipos.errors';
import { EquiposRepository } from '../domain/repositories/equipos.repository';
import { EquipoAccessService } from './equipo-access.service';

export interface RemoveMiembroInput {
  authId: string;
  equipoId: string;
  usuarioId: string;
}

@Injectable()
export class RemoveMiembroUseCase {
  constructor(
    private readonly repo: EquiposRepository,
    private readonly access: EquipoAccessService,
  ) {}

  async execute(input: RemoveMiembroInput): Promise<void> {
    const usuario = await this.access.resolverUsuario(input.authId);
    const equipo = await this.access.requireEquipo(input.equipoId);

    // El entrenador dueño puede sacar a cualquiera; un jugador sólo a sí mismo.
    const esDueno = equipo.entrenadorId === usuario.id;
    const esSalidaPropia = usuario.id === input.usuarioId;
    if (!esDueno && !esSalidaPropia) {
      throw new ForbiddenEquipoAccessError(
        'No puedes eliminar a este jugador del equipo',
      );
    }

    const miembro = await this.repo.findMiembro(
      input.equipoId,
      input.usuarioId,
    );
    if (!miembro) {
      throw new MiembroNotFoundError();
    }
    await this.repo.removeMiembro(input.equipoId, input.usuarioId);
  }
}
