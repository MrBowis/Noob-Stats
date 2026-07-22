import { Injectable } from '@nestjs/common';
import {
  RolInUseError,
  RolNotFoundError,
} from '../domain/exceptions/admin.errors';
import { AdminRepository } from '../domain/repositories/admin.repository';
import { AdminAccessService } from './admin-access.service';

@Injectable()
export class DeleteRolUseCase {
  constructor(
    private readonly repo: AdminRepository,
    private readonly access: AdminAccessService,
  ) {}

  async execute(input: { authId: string; rolId: string }): Promise<void> {
    await this.access.requireAdmin(input.authId);
    const rol = await this.repo.findRolById(input.rolId);
    if (!rol) {
      throw new RolNotFoundError();
    }
    const enUso = await this.repo.countUsuariosByRol(input.rolId);
    if (enUso > 0) {
      throw new RolInUseError();
    }
    await this.repo.deleteRol(input.rolId);
  }
}
