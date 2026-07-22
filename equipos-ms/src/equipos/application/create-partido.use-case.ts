import { Injectable } from '@nestjs/common';
import { Partido } from '../domain/entities/partido.entity';
import { EquiposRepository } from '../domain/repositories/equipos.repository';
import { EquipoAccessService } from './equipo-access.service';

export interface CreatePartidoInput {
  authId: string;
  equipoId: string;
  rival: string;
  fecha: string;
  ubicacion?: string | null;
  esLocal?: boolean;
  notas?: string | null;
}

@Injectable()
export class CreatePartidoUseCase {
  constructor(
    private readonly repo: EquiposRepository,
    private readonly access: EquipoAccessService,
  ) {}

  async execute(input: CreatePartidoInput): Promise<Partido> {
    const usuario = await this.access.resolverUsuario(input.authId);
    const equipo = await this.access.requireEquipo(input.equipoId);
    this.access.requireOwner(equipo, usuario);

    return this.repo.createPartido({
      equipoId: input.equipoId,
      rival: input.rival,
      fecha: input.fecha,
      ubicacion: input.ubicacion ?? null,
      esLocal: input.esLocal ?? true,
      notas: input.notas ?? null,
    });
  }
}
