import { Injectable } from '@nestjs/common';
import { Equipo } from '../domain/entities/equipo.entity';
import { Usuario } from '../domain/entities/usuario.entity';
import {
  EquipoNotFoundError,
  ForbiddenEquipoAccessError,
  NotEntrenadorError,
  NotEquipoOwnerError,
  UsuarioNotFoundError,
} from '../domain/exceptions/equipos.errors';
import { EquiposRepository } from '../domain/repositories/equipos.repository';

export const ROL_ENTRENADOR = 'Entrenador';
export const ROL_FUTBOLISTA = 'Futbolista';

/**
 * Utilidades de autorización reutilizadas por los casos de uso: resuelve al
 * usuario de dominio a partir del token y verifica rol, existencia del equipo,
 * propiedad y pertenencia.
 */
@Injectable()
export class EquipoAccessService {
  constructor(private readonly repo: EquiposRepository) {}

  async resolverUsuario(authId: string): Promise<Usuario> {
    const usuario = await this.repo.findUsuarioByAuthId(authId);
    if (!usuario) {
      throw new UsuarioNotFoundError();
    }
    return usuario;
  }

  requireEntrenador(usuario: Usuario): void {
    if (usuario.rolNombre !== ROL_ENTRENADOR) {
      throw new NotEntrenadorError();
    }
  }

  async requireEquipo(equipoId: string): Promise<Equipo> {
    const equipo = await this.repo.findEquipoById(equipoId);
    if (!equipo) {
      throw new EquipoNotFoundError();
    }
    return equipo;
  }

  requireOwner(equipo: Equipo, usuario: Usuario): void {
    if (equipo.entrenadorId !== usuario.id) {
      throw new NotEquipoOwnerError();
    }
  }

  /** El usuario debe ser el entrenador dueño o un miembro del equipo. */
  async requireAccess(equipo: Equipo, usuario: Usuario): Promise<void> {
    if (equipo.entrenadorId === usuario.id) {
      return;
    }
    const miembro = await this.repo.findMiembro(equipo.id, usuario.id);
    if (!miembro) {
      throw new ForbiddenEquipoAccessError();
    }
  }
}
