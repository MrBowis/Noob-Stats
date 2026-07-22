import { Injectable } from '@nestjs/common';
import { Equipo } from '../domain/entities/equipo.entity';
import { EquiposRepository } from '../domain/repositories/equipos.repository';
import { EquipoAccessService } from './equipo-access.service';

export interface ListMisEquiposInput {
  authId: string;
}

@Injectable()
export class ListMisEquiposUseCase {
  constructor(
    private readonly repo: EquiposRepository,
    private readonly access: EquipoAccessService,
  ) {}

  async execute(input: ListMisEquiposInput): Promise<Equipo[]> {
    const usuario = await this.access.resolverUsuario(input.authId);
    return this.repo.listEquiposByUsuario(usuario.id);
  }
}
