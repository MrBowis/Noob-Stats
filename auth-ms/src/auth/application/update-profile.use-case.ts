import { Injectable } from '@nestjs/common';
import { UserProfile } from '../domain/entities/user-profile.entity';
import { ProfileNotFoundError } from '../domain/exceptions/auth.errors';
import { AuthRepository } from '../domain/repositories/auth.repository';

export interface UpdateProfileInput {
  authId: string;
  nombres?: string;
  apellidos?: string;
  correo?: string | null;
  fechaNacimiento?: string | null;
}

@Injectable()
export class UpdateProfileUseCase {
  constructor(private readonly authRepository: AuthRepository) {}

  async execute(input: UpdateProfileInput): Promise<UserProfile> {
    const usuario = await this.authRepository.findUsuarioByAuthId(input.authId);
    if (!usuario) {
      throw new ProfileNotFoundError();
    }

    await this.authRepository.updatePersona(usuario.personaId, {
      nombres: input.nombres,
      apellidos: input.apellidos,
      correo: input.correo,
      fechaNacimiento: input.fechaNacimiento,
    });

    const profile = await this.authRepository.findProfileByAuthId(input.authId);
    if (!profile) {
      throw new ProfileNotFoundError();
    }
    return profile;
  }
}
