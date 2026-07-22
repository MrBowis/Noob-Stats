import { Injectable } from '@nestjs/common';
import { UsuarioDetalle } from '../domain/entities/usuario-detalle.entity';
import {
  RolNotFoundError,
  UsuarioNotFoundError,
} from '../domain/exceptions/admin.errors';
import { AdminRepository } from '../domain/repositories/admin.repository';
import { AdminAccessService } from './admin-access.service';

export interface UpdateUsuarioInput {
  authId: string;
  usuarioId: string;
  nombres?: string;
  apellidos?: string;
  correo?: string | null;
  fechaNacimiento?: string | null;
  rolNombre?: string;
  estado?: string;
}

@Injectable()
export class UpdateUsuarioUseCase {
  constructor(
    private readonly repo: AdminRepository,
    private readonly access: AdminAccessService,
  ) {}

  async execute(input: UpdateUsuarioInput): Promise<UsuarioDetalle> {
    await this.access.requireAdmin(input.authId);

    const usuario = await this.repo.findUsuarioById(input.usuarioId);
    if (!usuario) {
      throw new UsuarioNotFoundError();
    }

    // Datos de Persona
    if (
      input.nombres !== undefined ||
      input.apellidos !== undefined ||
      input.correo !== undefined ||
      input.fechaNacimiento !== undefined
    ) {
      await this.repo.updatePersona(usuario.personaId, {
        nombres: input.nombres,
        apellidos: input.apellidos,
        correo: input.correo,
        fechaNacimiento: input.fechaNacimiento,
      });
    }

    // Rol y/o estado del Usuario
    let rolId: string | undefined;
    if (input.rolNombre !== undefined) {
      const rol = await this.repo.findRolByNombre(input.rolNombre);
      if (!rol) {
        throw new RolNotFoundError();
      }
      rolId = rol.id;
    }

    if (rolId !== undefined || input.estado !== undefined) {
      await this.repo.updateUsuario(input.usuarioId, {
        rolId,
        estado: input.estado,
      });
    }

    const detalle = await this.repo.findUsuarioDetalleById(input.usuarioId);
    if (!detalle) {
      throw new UsuarioNotFoundError();
    }
    return detalle;
  }
}
