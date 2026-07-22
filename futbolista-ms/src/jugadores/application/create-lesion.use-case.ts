import { Injectable } from '@nestjs/common';
import { EstadoLesion, ParteCuerpo } from '../domain/catalogos';
import { JugadorLesion } from '../domain/entities/jugador.entity';
import { InvalidLesionFechasError } from '../domain/exceptions/jugadores.errors';
import { JugadoresRepository } from '../domain/repositories/jugadores.repository';
import { JugadorAccessService } from './jugador-access.service';

export interface CreateLesionInput {
  authId: string;
  jugadorId: string;
  parteCuerpo: ParteCuerpo;
  nota: string;
  fechaInicio: string;
  fechaFin?: string | null;
  estado?: EstadoLesion;
}

@Injectable()
export class CreateLesionUseCase {
  constructor(
    private readonly repo: JugadoresRepository,
    private readonly access: JugadorAccessService,
  ) {}

  async execute(input: CreateLesionInput): Promise<JugadorLesion> {
    await this.access.requireOwnedJugador(input.authId, input.jugadorId);

    if (input.fechaFin && input.fechaFin < input.fechaInicio) {
      throw new InvalidLesionFechasError();
    }

    return this.repo.createLesion({
      jugadorId: input.jugadorId,
      parteCuerpo: input.parteCuerpo,
      nota: input.nota,
      fechaInicio: input.fechaInicio,
      fechaFin: input.fechaFin,
      estado: input.estado,
    });
  }
}
