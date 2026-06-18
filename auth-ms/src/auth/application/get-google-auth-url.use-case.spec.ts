import {
  createMockAuthRepository,
  MockAuthRepository,
} from './__mocks__/auth-repository.mock';
import { GetGoogleAuthUrlUseCase } from './get-google-auth-url.use-case';

describe('GetGoogleAuthUrlUseCase', () => {
  let repo: MockAuthRepository;
  let useCase: GetGoogleAuthUrlUseCase;

  beforeEach(() => {
    repo = createMockAuthRepository();
    useCase = new GetGoogleAuthUrlUseCase(repo);
  });

  it('devuelve la URL OAuth de Google', async () => {
    repo.getOAuthSignInUrl.mockResolvedValue(
      'https://supabase/oauth?provider=google',
    );

    const result = await useCase.execute({
      redirectTo: 'noobstats://auth-callback',
    });

    expect(repo.getOAuthSignInUrl).toHaveBeenCalledWith(
      'google',
      'noobstats://auth-callback',
    );
    expect(result).toBe('https://supabase/oauth?provider=google');
  });
});
