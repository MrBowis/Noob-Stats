import { Injectable } from '@nestjs/common';
import { Tarjeta, TarjetaTipo } from '../domain/entities/partido.entity';
import {
  MiembroNotFoundError,
  PartidoNotFoundError,
} from '../domain/exceptions/equipos.errors';
import { EquiposRepository } from '../domain/repositories/equipos.repository';
import { EquipoAccessService } from './equipo-access.service';

export interface RegisterTarjetaInput {
  authId: string;
  partidoId: string;
  usuarioId?: string | null;
  tipo: TarjetaTipo;
  minuto?: number | null;
}

@Injectable()
export class RegisterTarjetaUseCase {
  constructor(
    private readonly repo: EquiposRepository,
    private readonly access: EquipoAccessService,
  ) {}

  async execute(input: RegisterTarjetaInput): Promise<Tarjeta> {
    const usuario = await this.access.resolverUsuario(input.authId);
    const partido = await this.repo.findPartidoById(input.partidoId);
    if (!partido) {
      throw new PartidoNotFoundError();
    }
    const equipo = await this.access.requireEquipo(partido.equipoId);
    this.access.requireOwner(equipo, usuario);

    // El amonestado debe pertenecer al equipo.
    if (input.usuarioId) {
      const miembro = await this.repo.findMiembro(equipo.id, input.usuarioId);
      if (!miembro) {
        throw new MiembroNotFoundError();
      }
    }

    return this.repo.addTarjeta({
      partidoId: input.partidoId,
      usuarioId: input.usuarioId,
      tipo: input.tipo,
      minuto: input.minuto,
    });
  }
}
