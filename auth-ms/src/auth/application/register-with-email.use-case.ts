import { Injectable } from '@nestjs/common';
import { AuthSession } from '../domain/entities/auth-session.entity';
import { UserProfile } from '../domain/entities/user-profile.entity';
import { RoleNotFoundError } from '../domain/exceptions/auth.errors';
import { AuthRepository } from '../domain/repositories/auth.repository';

export interface RegisterWithEmailInput {
  email: string;
  password: string;
  nombres: string;
  apellidos: string;
  fechaNacimiento?: string | null;
  rolNombre?: string;
}

export interface RegisterWithEmailOutput {
  session: AuthSession | null;
  profile: UserProfile;
}

const DEFAULT_ROLE = 'Futbolista';

@Injectable()
export class RegisterWithEmailUseCase {
  constructor(private readonly authRepository: AuthRepository) {}

  async execute(
    input: RegisterWithEmailInput,
  ): Promise<RegisterWithEmailOutput> {
    const { user, session } = await this.authRepository.signUpWithEmail(
      input.email,
      input.password,
    );

    const rol = await this.authRepository.findRolByNombre(
      input.rolNombre ?? DEFAULT_ROLE,
    );
    if (!rol) {
      throw new RoleNotFoundError();
    }

    const persona = await this.authRepository.createPersona({
      nombres: input.nombres,
      apellidos: input.apellidos,
      correo: input.email,
      fechaNacimiento: input.fechaNacimiento ?? null,
    });

    const usuario = await this.authRepository.createUsuario({
      personaId: persona.id,
      rolId: rol.id,
      supabaseAuthId: user.id,
      email: input.email,
    });

    return { session, profile: { usuario, persona, rol } };
  }
}
