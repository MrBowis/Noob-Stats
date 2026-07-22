import { Injectable } from '@nestjs/common';
import { Partido } from '../domain/entities/partido.entity';
import { PartidoNotFoundError } from '../domain/exceptions/equipos.errors';
import { EquiposRepository } from '../domain/repositories/equipos.repository';
import { EquipoAccessService } from './equipo-access.service';

export interface UpdatePartidoInput {
  authId: string;
  partidoId: string;
  rival?: string;
  fecha?: string;
  ubicacion?: string | null;
  esLocal?: boolean;
  estado?: string;
  golesFavor?: number | null;
  golesContra?: number | null;
  notas?: string | null;
}

@Injectable()
export class UpdatePartidoUseCase {
  constructor(
    private readonly repo: EquiposRepository,
    private readonly access: EquipoAccessService,
  ) {}

  async execute(input: UpdatePartidoInput): Promise<Partido> {
    const usuario = await this.access.resolverUsuario(input.authId);
    const partido = await this.repo.findPartidoById(input.partidoId);
    if (!partido) {
      throw new PartidoNotFoundError();
    }
    const equipo = await this.access.requireEquipo(partido.equipoId);
    this.access.requireOwner(equipo, usuario);

    return this.repo.updatePartido(input.partidoId, {
      rival: input.rival,
      fecha: input.fecha,
      ubicacion: input.ubicacion,
      esLocal: input.esLocal,
      estado: input.estado,
      golesFavor: input.golesFavor,
      golesContra: input.golesContra,
      notas: input.notas,
    });
  }
}
