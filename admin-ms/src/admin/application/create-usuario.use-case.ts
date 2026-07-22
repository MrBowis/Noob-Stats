import { Injectable } from '@nestjs/common';
import { UsuarioDetalle } from '../domain/entities/usuario-detalle.entity';
import {
  EmailAlreadyInUseError,
  RolNotFoundError,
} from '../domain/exceptions/admin.errors';
import { AdminRepository } from '../domain/repositories/admin.repository';
import { AdminAccessService } from './admin-access.service';

export interface CreateUsuarioInput {
  authId: string;
  email: string;
  nombres: string;
  apellidos: string;
  rolNombre: string;
  correo?: string | null;
  fechaNacimiento?: string | null;
}

@Injectable()
export class CreateUsuarioUseCase {
  constructor(
    private readonly repo: AdminRepository,
    private readonly access: AdminAccessService,
  ) {}

  async execute(input: CreateUsuarioInput): Promise<UsuarioDetalle> {
    await this.access.requireAdmin(input.authId);

    const rol = await this.repo.findRolByNombre(input.rolNombre);
    if (!rol) {
      throw new RolNotFoundError();
    }

    const existing = await this.repo.findUsuarioByEmail(input.email);
    if (existing) {
      throw new EmailAlreadyInUseError();
    }

    const persona = await this.repo.createPersona({
      nombres: input.nombres,
      apellidos: input.apellidos,
      correo: input.correo ?? input.email,
      fechaNacimiento: input.fechaNacimiento ?? null,
    });

    const usuario = await this.repo.createUsuario({
      personaId: persona.id,
      rolId: rol.id,
      email: input.email,
    });

    return {
      id: usuario.id,
      email: usuario.email,
      estado: usuario.estado,
      supabaseAuthId: usuario.supabaseAuthId,
      createdAt: usuario.createdAt,
      persona,
      rol,
    };
  }
}
