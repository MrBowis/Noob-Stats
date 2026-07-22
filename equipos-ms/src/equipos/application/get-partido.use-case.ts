import { Injectable } from '@nestjs/common';
import { PartidoDetalle } from '../domain/entities/partido.entity';
import { PartidoNotFoundError } from '../domain/exceptions/equipos.errors';
import { EquiposRepository } from '../domain/repositories/equipos.repository';
import { EquipoAccessService } from './equipo-access.service';

@Injectable()
export class GetPartidoUseCase {
  constructor(
    private readonly repo: EquiposRepository,
    private readonly access: EquipoAccessService,
  ) {}

  async execute(input: {
    authId: string;
    partidoId: string;
  }): Promise<PartidoDetalle> {
    const usuario = await this.access.resolverUsuario(input.authId);
    const detalle = await this.repo.findPartidoDetalleById(input.partidoId);
    if (!detalle) {
      throw new PartidoNotFoundError();
    }
    const equipo = await this.access.requireEquipo(detalle.equipoId);
    await this.access.requireAccess(equipo, usuario);
    return detalle;
  }
}
