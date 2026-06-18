import { UserProfile } from '../domain/entities/user-profile.entity';
import { ProfileNotFoundError } from '../domain/exceptions/auth.errors';
import {
  createMockAuthRepository,
  MockAuthRepository,
} from './__mocks__/auth-repository.mock';
import { GetProfileUseCase } from './get-profile.use-case';

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

describe('GetProfileUseCase', () => {
  let repo: MockAuthRepository;
  let useCase: GetProfileUseCase;

  beforeEach(() => {
    repo = createMockAuthRepository();
    useCase = new GetProfileUseCase(repo);
  });

  it('devuelve el perfil del usuario', async () => {
    repo.findProfileByAuthId.mockResolvedValue(profile);
    await expect(useCase.execute({ authId: 'auth-1' })).resolves.toEqual(
      profile,
    );
  });

  it('lanza ProfileNotFoundError si no existe', async () => {
    repo.findProfileByAuthId.mockResolvedValue(null);
    await expect(useCase.execute({ authId: 'auth-1' })).rejects.toBeInstanceOf(
      ProfileNotFoundError,
    );
  });
});
