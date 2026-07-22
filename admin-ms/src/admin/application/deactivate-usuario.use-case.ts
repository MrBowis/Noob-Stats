import { Injectable } from '@nestjs/common';
import { UsuarioDetalle } from '../domain/entities/usuario-detalle.entity';
import { UsuarioNotFoundError } from '../domain/exceptions/admin.errors';
import { AdminRepository } from '../domain/repositories/admin.repository';
import { AdminAccessService } from './admin-access.service';

export const ESTADO_INACTIVO = 'inactivo';

/**
 * Borrado lógico de un usuario: cambia su estado a "inactivo" en lugar de
 * eliminar el registro.
 */
@Injectable()
export class DeactivateUsuarioUseCase {
  constructor(
    private readonly repo: AdminRepository,
    private readonly access: AdminAccessService,
  ) {}

  async execute(input: {
    authId: string;
    usuarioId: string;
  }): Promise<UsuarioDetalle> {
    await this.access.requireAdmin(input.authId);

    const usuario = await this.repo.findUsuarioById(input.usuarioId);
    if (!usuario) {
      throw new UsuarioNotFoundError();
    }

    await this.repo.updateUsuario(input.usuarioId, {
      estado: ESTADO_INACTIVO,
    });

    const detalle = await this.repo.findUsuarioDetalleById(input.usuarioId);
    if (!detalle) {
      throw new UsuarioNotFoundError();
    }
    return detalle;
  }
}
