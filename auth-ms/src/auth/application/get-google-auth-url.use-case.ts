import { Injectable } from '@nestjs/common';
import { AuthRepository } from '../domain/repositories/auth.repository';

export interface GetGoogleAuthUrlInput {
  redirectTo: string;
}

@Injectable()
export class GetGoogleAuthUrlUseCase {
  constructor(private readonly authRepository: AuthRepository) {}

  execute(input: GetGoogleAuthUrlInput): Promise<string> {
    return this.authRepository.getOAuthSignInUrl('google', input.redirectTo);
  }
}
