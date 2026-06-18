import { Injectable } from '@nestjs/common';
import { AuthSession } from '../domain/entities/auth-session.entity';
import { UserProfile } from '../domain/entities/user-profile.entity';
import { ProfileNotFoundError } from '../domain/exceptions/auth.errors';
import { AuthRepository } from '../domain/repositories/auth.repository';

export interface LoginWithEmailInput {
  email: string;
  password: string;
}

export interface LoginWithEmailOutput {
  session: AuthSession;
  profile: UserProfile;
}

@Injectable()
export class LoginWithEmailUseCase {
  constructor(private readonly authRepository: AuthRepository) {}

  async execute(input: LoginWithEmailInput): Promise<LoginWithEmailOutput> {
    const { user, session } = await this.authRepository.signInWithEmail(
      input.email,
      input.password,
    );

    const profile = await this.authRepository.findProfileByAuthId(user.id);
    if (!profile) {
      throw new ProfileNotFoundError();
    }

    return { session, profile };
  }
}
