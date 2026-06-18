import { Injectable } from '@nestjs/common';
import { AuthSession } from '../domain/entities/auth-session.entity';
import { AuthRepository } from '../domain/repositories/auth.repository';

@Injectable()
export class RefreshTokenUseCase {
  constructor(private readonly repo: AuthRepository) {}

  execute({ refreshToken }: { refreshToken: string }): Promise<AuthSession> {
    return this.repo.refreshSession(refreshToken);
  }
}
