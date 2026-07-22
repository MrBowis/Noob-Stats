import { Injectable } from '@nestjs/common';
import { EquipoMiembro } from '../domain/entities/equipo-miembro.entity';
import {
  InvalidSlotError,
  MiembroNotFoundError,
} from '../domain/exceptions/equipos.errors';
import { isValidSlot } from '../domain/formations';
import { EquiposRepository } from '../domain/repositories/equipos.repository';
import { EquipoAccessService } from './equipo-access.service';

export interface UpdateMiembroInput {
  authId: string;
  equipoId: string;
  usuarioId: string;
  dorsal?: number | null;
  posicion?: string | null;
  slot?: string | null;
  estado?: string;
}

@Injectable()
export class UpdateMiembroUseCase {
  constructor(
    private readonly repo: EquiposRepository,
    private readonly access: EquipoAccessService,
  ) {}

  async execute(input: UpdateMiembroInput): Promise<EquipoMiembro> {
    const usuario = await this.access.resolverUsuario(input.authId);
    const equipo = await this.access.requireEquipo(input.equipoId);
    this.access.requireOwner(equipo, usuario);

    const miembro = await this.repo.findMiembro(
      input.equipoId,
      input.usuarioId,
    );
    if (!miembro) {
      throw new MiembroNotFoundError();
    }

    // Si se asigna una casilla (slot) debe pertenecer a la formación del equipo.
    if (input.slot) {
      if (!isValidSlot(equipo.formacion, input.slot)) {
        throw new InvalidSlotError();
      }
    }

    const actualizado = await this.repo.updateMiembro(
      input.equipoId,
      input.usuarioId,
      {
        dorsal: input.dorsal,
        posicion: input.posicion,
        slot: input.slot,
        estado: input.estado,
      },
    );

    // Una casilla sólo puede estar ocupada por un jugador: libera a los demás.
    if (input.slot) {
      await this.repo.clearSlot(input.equipoId, input.slot, input.usuarioId);
    }

    return actualizado;
  }
}
