import { Injectable } from '@nestjs/common';
import { Rol } from '../domain/entities/rol.entity';
import { RolNotFoundError } from '../domain/exceptions/admin.errors';
import { AdminRepository } from '../domain/repositories/admin.repository';
import { AdminAccessService } from './admin-access.service';

export interface UpdateRolInput {
  authId: string;
  rolId: string;
  nombreRol?: string;
  descripcion?: string | null;
}

@Injectable()
export class UpdateRolUseCase {
  constructor(
    private readonly repo: AdminRepository,
    private readonly access: AdminAccessService,
  ) {}

  async execute(input: UpdateRolInput): Promise<Rol> {
    await this.access.requireAdmin(input.authId);
    const rol = await this.repo.findRolById(input.rolId);
    if (!rol) {
      throw new RolNotFoundError();
    }
    return this.repo.updateRol(input.rolId, {
      nombreRol: input.nombreRol,
      descripcion: input.descripcion,
    });
  }
}
