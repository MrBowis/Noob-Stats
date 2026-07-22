import { Injectable } from '@nestjs/common';
import { UsuarioDetalle } from '../domain/entities/usuario-detalle.entity';
import { NotAdminError } from '../domain/exceptions/admin.errors';
import { AdminRepository } from '../domain/repositories/admin.repository';

export const ROL_ADMINISTRADOR = 'Administrador';

/**
 * Autorización transversal del módulo: resuelve el usuario que hace la petición
 * a partir del `authId` del token y verifica que sea Administrador.
 */
@Injectable()
export class AdminAccessService {
  constructor(private readonly repo: AdminRepository) {}

  /** Resuelve el usuario llamante y exige rol Administrador. */
  async requireAdmin(authId: string): Promise<UsuarioDetalle> {
    const usuario = await this.repo.findUsuarioDetalleByAuthId(authId);
    if (!usuario || usuario.rol.nombreRol !== ROL_ADMINISTRADOR) {
      throw new NotAdminError();
    }
    return usuario;
  }
}
