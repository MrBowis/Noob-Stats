import { Injectable } from '@nestjs/common';
import { UsuarioDetalle } from '../domain/entities/usuario-detalle.entity';
import { AdminRepository } from '../domain/repositories/admin.repository';
import { AdminAccessService } from './admin-access.service';

export interface ListUsuariosInput {
  authId: string;
  estado?: string;
}

@Injectable()
export class ListUsuariosUseCase {
  constructor(
    private readonly repo: AdminRepository,
    private readonly access: AdminAccessService,
  ) {}

  async execute(input: ListUsuariosInput): Promise<UsuarioDetalle[]> {
    await this.access.requireAdmin(input.authId);
    return this.repo.listUsuarios(input.estado);
  }
}
