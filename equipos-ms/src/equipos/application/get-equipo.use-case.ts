import { Injectable } from '@nestjs/common';
import { Equipo } from '../domain/entities/equipo.entity';
import { EquipoAccessService } from './equipo-access.service';

export interface GetEquipoInput {
  authId: string;
  equipoId: string;
}

@Injectable()
export class GetEquipoUseCase {
  constructor(private readonly access: EquipoAccessService) {}

  async execute(input: GetEquipoInput): Promise<Equipo> {
    const usuario = await this.access.resolverUsuario(input.authId);
    const equipo = await this.access.requireEquipo(input.equipoId);
    await this.access.requireAccess(equipo, usuario);
    return equipo;
  }
}
