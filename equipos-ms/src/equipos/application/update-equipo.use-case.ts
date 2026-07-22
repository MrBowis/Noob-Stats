import { Injectable } from '@nestjs/common';
import { Equipo } from '../domain/entities/equipo.entity';
import { EquiposRepository } from '../domain/repositories/equipos.repository';
import { Formacion } from '../domain/formations';
import { EquipoAccessService } from './equipo-access.service';

export interface UpdateEquipoInput {
  authId: string;
  equipoId: string;
  nombre?: string;
  descripcion?: string | null;
  categoria?: string | null;
  ciudad?: string | null;
  escudoUrl?: string | null;
  formacion?: Formacion;
}

@Injectable()
export class UpdateEquipoUseCase {
  constructor(
    private readonly repo: EquiposRepository,
    private readonly access: EquipoAccessService,
  ) {}

  async execute(input: UpdateEquipoInput): Promise<Equipo> {
    const usuario = await this.access.resolverUsuario(input.authId);
    const equipo = await this.access.requireEquipo(input.equipoId);
    this.access.requireOwner(equipo, usuario);

    return this.repo.updateEquipo(input.equipoId, {
      nombre: input.nombre,
      descripcion: input.descripcion,
      categoria: input.categoria,
      ciudad: input.ciudad,
      escudoUrl: input.escudoUrl,
      formacion: input.formacion,
    });
  }
}
