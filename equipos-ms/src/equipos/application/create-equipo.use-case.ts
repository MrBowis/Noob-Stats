import { Injectable } from '@nestjs/common';
import { Equipo } from '../domain/entities/equipo.entity';
import { EquiposRepository } from '../domain/repositories/equipos.repository';
import { EquipoAccessService } from './equipo-access.service';

export interface CreateEquipoInput {
  authId: string;
  nombre: string;
  descripcion?: string | null;
  categoria?: string | null;
  ciudad?: string | null;
  escudoUrl?: string | null;
}

@Injectable()
export class CreateEquipoUseCase {
  constructor(
    private readonly repo: EquiposRepository,
    private readonly access: EquipoAccessService,
  ) {}

  async execute(input: CreateEquipoInput): Promise<Equipo> {
    const usuario = await this.access.resolverUsuario(input.authId);
    this.access.requireEntrenador(usuario);

    return this.repo.createEquipo({
      nombre: input.nombre,
      descripcion: input.descripcion ?? null,
      categoria: input.categoria ?? null,
      ciudad: input.ciudad ?? null,
      escudoUrl: input.escudoUrl ?? null,
      entrenadorId: usuario.id,
    });
  }
}
