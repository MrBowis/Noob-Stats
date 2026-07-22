import { Injectable } from '@nestjs/common';
import { EstadoLesion, ParteCuerpo } from '../domain/catalogos';
import { JugadorLesion } from '../domain/entities/jugador.entity';
import {
  InvalidLesionFechasError,
  LesionNotFoundError,
} from '../domain/exceptions/jugadores.errors';
import { JugadoresRepository } from '../domain/repositories/jugadores.repository';
import { JugadorAccessService } from './jugador-access.service';

export interface UpdateLesionInput {
  authId: string;
  jugadorId: string;
  lesionId: string;
  parteCuerpo?: ParteCuerpo;
  nota?: string;
  fechaInicio?: string;
  fechaFin?: string | null;
  estado?: EstadoLesion;
}

@Injectable()
export class UpdateLesionUseCase {
  constructor(
    private readonly repo: JugadoresRepository,
    private readonly access: JugadorAccessService,
  ) {}

  async execute(input: UpdateLesionInput): Promise<JugadorLesion> {
    await this.access.requireOwnedJugador(input.authId, input.jugadorId);

    const lesion = await this.repo.findLesionById(input.lesionId);
    if (!lesion || lesion.jugadorId !== input.jugadorId) {
      throw new LesionNotFoundError();
    }

    // Se valida contra el estado resultante, no sólo contra lo enviado.
    const fechaInicio = input.fechaInicio ?? lesion.fechaInicio;
    const fechaFin =
      input.fechaFin === undefined ? lesion.fechaFin : input.fechaFin;
    if (fechaFin && fechaFin < fechaInicio) {
      throw new InvalidLesionFechasError();
    }

    return this.repo.updateLesion(input.lesionId, {
      parteCuerpo: input.parteCuerpo,
      nota: input.nota,
      fechaInicio: input.fechaInicio,
      fechaFin: input.fechaFin,
      estado: input.estado,
    });
  }
}
