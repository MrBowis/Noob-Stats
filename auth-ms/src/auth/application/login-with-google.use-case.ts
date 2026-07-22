import { Injectable } from '@nestjs/common';
import { UserProfile } from '../domain/entities/user-profile.entity';
import {
  InvalidTokenError,
  RoleNotFoundError,
} from '../domain/exceptions/auth.errors';
import { AuthRepository } from '../domain/repositories/auth.repository';
import { splitFullName } from './name.util';

export interface LoginWithGoogleInput {
  /** Access token de Supabase obtenido tras el flujo OAuth de Google. */
  accessToken: string;
  /**
   * Rol a asignar sólo cuando es el primer ingreso (aprovisionamiento).
   * Si el usuario ya existe, se ignora y se conserva su rol actual.
   */
  rolNombre?: string;
}

export interface LoginWithGoogleOutput {
  profile: UserProfile;
  isNewUser: boolean;
}

const DEFAULT_ROLE = 'Futbolista';

@Injectable()
export class LoginWithGoogleUseCase {
  constructor(private readonly authRepository: AuthRepository) {}

  async execute(input: LoginWithGoogleInput): Promise<LoginWithGoogleOutput> {
    const user = await this.authRepository.getUserFromAccessToken(
      input.accessToken,
    );
    if (!user) {
      throw new InvalidTokenError();
    }

    const existing = await this.authRepository.findProfileByAuthId(user.id);
    if (existing) {
      return { profile: existing, isNewUser: false };
    }

    // Primera vez que entra con Google: aprovisionar Persona + Usuario.
    const rol = await this.authRepository.findRolByNombre(
      input.rolNombre ?? DEFAULT_ROLE,
    );
    if (!rol) {
      throw new RoleNotFoundError();
    }

    const { nombres, apellidos } = splitFullName(user.fullName);
    const persona = await this.authRepository.createPersona({
      nombres,
      apellidos,
      correo: user.email,
    });

    const usuario = await this.authRepository.createUsuario({
      personaId: persona.id,
      rolId: rol.id,
      supabaseAuthId: user.id,
      email: user.email ?? '',
    });

    return { profile: { usuario, persona, rol }, isNewUser: true };
  }
}
