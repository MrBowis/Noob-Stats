import { Persona } from '../domain/entities/persona.entity';
import { Rol } from '../domain/entities/rol.entity';
import { UserProfile } from '../domain/entities/user-profile.entity';
import { Usuario } from '../domain/entities/usuario.entity';
import {
  InvalidTokenError,
  RoleNotFoundError,
} from '../domain/exceptions/auth.errors';
import {
  createMockAuthRepository,
  MockAuthRepository,
} from './__mocks__/auth-repository.mock';
import { LoginWithGoogleUseCase } from './login-with-google.use-case';

const rol: Rol = { id: 'rol-1', nombreRol: 'Futbolista', descripcion: null };
const persona: Persona = {
  id: 'per-1',
  nombres: 'Juan Carlos',
  apellidos: 'Pérez',
  correo: 'juan@gmail.com',
  fechaNacimiento: null,
  createdAt: '2026-01-01',
};
const usuario: Usuario = {
  id: 'usr-1',
  personaId: 'per-1',
  rolId: 'rol-1',
  supabaseAuthId: 'auth-1',
  email: 'juan@gmail.com',
  estado: 'activo',
  createdAt: '2026-01-01',
};
const profile: UserProfile = { usuario, persona, rol };

describe('LoginWithGoogleUseCase', () => {
  let repo: MockAuthRepository;
  let useCase: LoginWithGoogleUseCase;

  beforeEach(() => {
    repo = createMockAuthRepository();
    useCase = new LoginWithGoogleUseCase(repo);
  });

  it('lanza InvalidTokenError si el token no es válido', async () => {
    repo.getUserFromAccessToken.mockResolvedValue(null);

    await expect(
      useCase.execute({ accessToken: 'bad' }),
    ).rejects.toBeInstanceOf(InvalidTokenError);
  });

  it('devuelve el perfil existente sin reaprovisionar', async () => {
    repo.getUserFromAccessToken.mockResolvedValue({
      id: 'auth-1',
      email: 'juan@gmail.com',
      fullName: 'Juan Carlos Pérez',
    });
    repo.findProfileByAuthId.mockResolvedValue(profile);

    const result = await useCase.execute({ accessToken: 'good' });

    expect(result).toEqual({ profile, isNewUser: false });
    expect(repo.createPersona).not.toHaveBeenCalled();
  });

  it('aprovisiona Persona + Usuario en el primer login con Google', async () => {
    repo.getUserFromAccessToken.mockResolvedValue({
      id: 'auth-1',
      email: 'juan@gmail.com',
      fullName: 'Juan Carlos Pérez',
    });
    repo.findProfileByAuthId.mockResolvedValue(null);
    repo.findRolByNombre.mockResolvedValue(rol);
    repo.createPersona.mockResolvedValue(persona);
    repo.createUsuario.mockResolvedValue(usuario);

    const result = await useCase.execute({ accessToken: 'good' });

    expect(repo.createPersona).toHaveBeenCalledWith(
      expect.objectContaining({ nombres: 'Juan Carlos', apellidos: 'Pérez' }),
    );
    expect(result).toEqual({ profile, isNewUser: true });
  });

  it('lanza RoleNotFoundError si falta el rol por defecto al aprovisionar', async () => {
    repo.getUserFromAccessToken.mockResolvedValue({
      id: 'auth-1',
      email: 'juan@gmail.com',
      fullName: 'Juan',
    });
    repo.findProfileByAuthId.mockResolvedValue(null);
    repo.findRolByNombre.mockResolvedValue(null);

    await expect(
      useCase.execute({ accessToken: 'good' }),
    ).rejects.toBeInstanceOf(RoleNotFoundError);
  });
});
