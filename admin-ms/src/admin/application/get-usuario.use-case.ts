import { Injectable } from '@nestjs/common';
import { UsuarioDetalle } from '../domain/entities/usuario-detalle.entity';
import { UsuarioNotFoundError } from '../domain/exceptions/admin.errors';
import { AdminRepository } from '../domain/repositories/admin.repository';
import { AdminAccessService } from './admin-access.service';

@Injectable()
export class GetUsuarioUseCase {
  constructor(
    private readonly repo: AdminRepository,
    private readonly access: AdminAccessService,
  ) {}

  async execute(input: {
    authId: string;
    usuarioId: string;
  }): Promise<UsuarioDetalle> {
    await this.access.requireAdmin(input.authId);
    const usuario = await this.repo.findUsuarioDetalleById(input.usuarioId);
    if (!usuario) {
      throw new UsuarioNotFoundError();
    }
    return usuario;
  }
}
