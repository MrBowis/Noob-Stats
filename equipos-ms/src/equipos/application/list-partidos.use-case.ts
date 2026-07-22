import { Injectable } from '@nestjs/common';
import { Partido } from '../domain/entities/partido.entity';
import {
  EquiposRepository,
  PartidoFiltro,
} from '../domain/repositories/equipos.repository';
import { EquipoAccessService } from './equipo-access.service';

export interface ListPartidosInput {
  authId: string;
  equipoId: string;
  filtro: PartidoFiltro;
}

@Injectable()
export class ListPartidosUseCase {
  constructor(
    private readonly repo: EquiposRepository,
    private readonly access: EquipoAccessService,
  ) {}

  async execute(input: ListPartidosInput): Promise<Partido[]> {
    const usuario = await this.access.resolverUsuario(input.authId);
    const equipo = await this.access.requireEquipo(input.equipoId);
    await this.access.requireAccess(equipo, usuario);
    return this.repo.listPartidosByEquipo(input.equipoId, input.filtro);
  }
}
