import { Injectable } from '@nestjs/common';
import { Rol } from '../domain/entities/rol.entity';
import { AdminRepository } from '../domain/repositories/admin.repository';
import { AdminAccessService } from './admin-access.service';

@Injectable()
export class ListRolesUseCase {
  constructor(
    private readonly repo: AdminRepository,
    private readonly access: AdminAccessService,
  ) {}

  async execute(input: { authId: string }): Promise<Rol[]> {
    await this.access.requireAdmin(input.authId);
    return this.repo.listRoles();
  }
}
