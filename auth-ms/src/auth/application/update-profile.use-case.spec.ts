import { Usuario } from '../domain/entities/usuario.entity';
import { UserProfile } from '../domain/entities/user-profile.entity';
import { ProfileNotFoundError } from '../domain/exceptions/auth.errors';
import {
  createMockAuthRepository,
  MockAuthRepository,
} from './__mocks__/auth-repository.mock';
import { UpdateProfileUseCase } from './update-profile.use-case';

const usuario: Usuario = {
  id: 'usr-1',
  personaId: 'per-1',
  rolId: 'rol-1',
  supabaseAuthId: 'auth-1',
  email: 'juan@test.com',
  estado: 'activo',
  createdAt: '2026-01-01',
};

const profile: UserProfile = {
  usuario,
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

describe('UpdateProfileUseCase', () => {
  let repo: MockAuthRepository;
  let useCase: UpdateProfileUseCase;

  beforeEach(() => {
    repo = createMockAuthRepository();
    useCase = new UpdateProfileUseCase(repo);
  });

  it('actualiza la persona y devuelve el perfil actualizado', async () => {
    repo.findUsuarioByAuthId.mockResolvedValue(usuario);
    repo.findProfileByAuthId.mockResolvedValue(profile);

    const resultado = await useCase.execute({
      authId: 'auth-1',
      nombres: 'Juan Carlos',
      correo: 'nuevo@test.com',
    });

    expect(repo.updatePersona).toHaveBeenCalledWith('per-1', {
      nombres: 'Juan Carlos',
      apellidos: undefined,
      correo: 'nuevo@test.com',
      fechaNacimiento: undefined,
    });
    expect(resultado).toEqual(profile);
  });

  it('lanza ProfileNotFoundError si el usuario del token no existe', async () => {
    repo.findUsuarioByAuthId.mockResolvedValue(null);

    await expect(
      useCase.execute({ authId: 'auth-1', nombres: 'Juan' }),
    ).rejects.toBeInstanceOf(ProfileNotFoundError);
    expect(repo.updatePersona).not.toHaveBeenCalled();
  });

  it('lanza ProfileNotFoundError si el perfil desaparece tras actualizar', async () => {
    repo.findUsuarioByAuthId.mockResolvedValue(usuario);
    repo.findProfileByAuthId.mockResolvedValue(null);

    await expect(
      useCase.execute({ authId: 'auth-1', nombres: 'Juan' }),
    ).rejects.toBeInstanceOf(ProfileNotFoundError);
  });
});
