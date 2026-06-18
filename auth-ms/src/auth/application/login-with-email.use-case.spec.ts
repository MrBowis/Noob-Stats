import { AuthSession } from '../domain/entities/auth-session.entity';
import { UserProfile } from '../domain/entities/user-profile.entity';
import { ProfileNotFoundError } from '../domain/exceptions/auth.errors';
import {
  createMockAuthRepository,
  MockAuthRepository,
} from './__mocks__/auth-repository.mock';
import { LoginWithEmailUseCase } from './login-with-email.use-case';

const session: AuthSession = {
  accessToken: 'at',
  refreshToken: 'rt',
  expiresAt: 123,
  tokenType: 'bearer',
};

const profile: UserProfile = {
  usuario: {
    id: 'usr-1',
    personaId: 'per-1',
    rolId: 'rol-1',
    supabaseAuthId: 'auth-1',
    email: 'juan@test.com',
    estado: 'activo',
    createdAt: '2026-01-01',
  },
  persona: {
    id: 'per-1',
    nombres: 'Juan',
    apellidos: 'Pérez',
    correo: 'juan@test.com',
    fechaNacimiento: null,
    createdAt: '2026-01-01',
  },
  rol: { id: 'rol-1', nombreRol: 'Futbolista', descripcion: null },
};

describe('LoginWithEmailUseCase', () => {
  let repo: MockAuthRepository;
  let useCase: LoginWithEmailUseCase;

  beforeEach(() => {
    repo = createMockAuthRepository();
    useCase = new LoginWithEmailUseCase(repo);
  });

  it('inicia sesión y devuelve la sesión + perfil', async () => {
    repo.signInWithEmail.mockResolvedValue({
      user: { id: 'auth-1', email: 'juan@test.com', fullName: null },
      session,
    });
    repo.findProfileByAuthId.mockResolvedValue(profile);

    const result = await useCase.execute({
      email: 'juan@test.com',
      password: 'secret123',
    });

    expect(repo.signInWithEmail).toHaveBeenCalledWith(
      'juan@test.com',
      'secret123',
    );
    expect(repo.findProfileByAuthId).toHaveBeenCalledWith('auth-1');
    expect(result).toEqual({ session, profile });
  });

  it('lanza ProfileNotFoundError si no existe el perfil', async () => {
    repo.signInWithEmail.mockResolvedValue({
      user: { id: 'auth-1', email: 'juan@test.com', fullName: null },
      session,
    });
    repo.findProfileByAuthId.mockResolvedValue(null);

    await expect(
      useCase.execute({ email: 'juan@test.com', password: 'secret123' }),
    ).rejects.toBeInstanceOf(ProfileNotFoundError);
  });
});
