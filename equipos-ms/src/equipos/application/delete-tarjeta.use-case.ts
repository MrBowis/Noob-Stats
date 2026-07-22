import { Injectable } from '@nestjs/common';
import {
  PartidoNotFoundError,
  TarjetaNotFoundError,
} from '../domain/exceptions/equipos.errors';
import { EquiposRepository } from '../domain/repositories/equipos.repository';
import { EquipoAccessService } from './equipo-access.service';

@Injectable()
export class DeleteTarjetaUseCase {
  constructor(
    private readonly repo: EquiposRepository,
    private readonly access: EquipoAccessService,
  ) {}

  async execute(input: { authId: string; tarjetaId: string }): Promise<void> {
    const usuario = await this.access.resolverUsuario(input.authId);
    const tarjeta = await this.repo.findTarjetaById(input.tarjetaId);
    if (!tarjeta) {
      throw new TarjetaNotFoundError();
    }
    const partido = await this.repo.findPartidoById(tarjeta.partidoId);
    if (!partido) {
      throw new PartidoNotFoundError();
    }
    const equipo = await this.access.requireEquipo(partido.equipoId);
    this.access.requireOwner(equipo, usuario);

    await this.repo.deleteTarjeta(input.tarjetaId);
  }
}
