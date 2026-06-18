import { AuthSession } from '../domain/entities/auth-session.entity';
import { createMockAuthRepository } from './__mocks__/auth-repository.mock';
import { RefreshTokenUseCase } from './refresh-token.use-case';

describe('RefreshTokenUseCase', () => {
  const repo = createMockAuthRepository();
  const useCase = new RefreshTokenUseCase(repo);

  afterEach(() => jest.clearAllMocks());

  it('devuelve la nueva sesión del repositorio', async () => {
    const newSession: AuthSession = {
      accessToken: 'new-at',
      refreshToken: 'new-rt',
      expiresAt: 9999,
      tokenType: 'bearer',
    };
    repo.refreshSession.mockResolvedValue(newSession);

    const result = await useCase.execute({ refreshToken: 'old-rt' });

    expect(result).toBe(newSession);
    expect(repo.refreshSession).toHaveBeenCalledWith('old-rt');
  });
});
