import { Injectable } from '@nestjs/common';
import { UserProfile } from '../domain/entities/user-profile.entity';
import { ProfileNotFoundError } from '../domain/exceptions/auth.errors';
import { AuthRepository } from '../domain/repositories/auth.repository';

export interface GetProfileInput {
  authId: string;
}

@Injectable()
export class GetProfileUseCase {
  constructor(private readonly authRepository: AuthRepository) {}

  async execute(input: GetProfileInput): Promise<UserProfile> {
    const profile = await this.authRepository.findProfileByAuthId(input.authId);
    if (!profile) {
      throw new ProfileNotFoundError();
    }
    return profile;
  }
}
