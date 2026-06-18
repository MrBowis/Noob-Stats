import { Injectable } from '@nestjs/common';
import { AuthRepository } from '../domain/repositories/auth.repository';

export interface GetGoogleAuthUrlInput {
  redirectTo: string;
}

@Injectable()
export class GetGoogleAuthUrlUseCase {
  constructor(private readonly authRepository: AuthRepository) {}

  async execute(input: GetGoogleAuthUrlInput): Promise<{ url: string }> {
    const url = await this.authRepository.getOAuthSignInUrl(
      'google',
      input.redirectTo,
    );
    return { url };
  }
}
