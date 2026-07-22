import { Injectable } from '@nestjs/common';
import { Rol } from '../domain/entities/rol.entity';
import { AdminRepository } from '../domain/repositories/admin.repository';
import { AdminAccessService } from './admin-access.service';

export interface CreateRolInput {
  authId: string;
  nombreRol: string;
  descripcion?: string | null;
}

@Injectable()
export class CreateRolUseCase {
  constructor(
    private readonly repo: AdminRepository,
    private readonly access: AdminAccessService,
  ) {}

  async execute(input: CreateRolInput): Promise<Rol> {
    await this.access.requireAdmin(input.authId);
    return this.repo.createRol({
      nombreRol: input.nombreRol,
      descripcion: input.descripcion ?? null,
    });
  }
}
