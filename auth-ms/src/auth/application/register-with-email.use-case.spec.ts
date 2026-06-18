import { AuthSession } from '../domain/entities/auth-session.entity';
import { Persona } from '../domain/entities/persona.entity';
import { Rol } from '../domain/entities/rol.entity';
import { Usuario } from '../domain/entities/usuario.entity';
import { RoleNotFoundError } from '../domain/exceptions/auth.errors';
import {
  createMockAuthRepository,
  MockAuthRepository,
} from './__mocks__/auth-repository.mock';
import { RegisterWithEmailUseCase } from './register-with-email.use-case';

const rol: Rol = { id: 'rol-1', nombreRol: 'Futbolista', descripcion: null };
const persona: Persona = {
  id: 'per-1',
  nombres: 'Juan',
  apellidos: 'Pérez',
  correo: 'juan@test.com',
  fechaNacimiento: null,
  createdAt: '2026-01-01',
};
const usuario: Usuario = {
  id: 'usr-1',
  personaId: 'per-1',
  rolId: 'rol-1',
  supabaseAuthId: 'auth-1',
  email: 'juan@test.com',
  estado: 'activo',
  createdAt: '2026-01-01',
};
const session: AuthSession = {
  accessToken: 'at',
  refreshToken: 'rt',
  expiresAt: 123,
  tokenType: 'bearer',
};

describe('RegisterWithEmailUseCase', () => {
  let repo: MockAuthRepository;
  let useCase: RegisterWithEmailUseCase;

  beforeEach(() => {
    repo = createMockAuthRepository();
    useCase = new RegisterWithEmailUseCase(repo);
  });

  it('registra al usuario y crea Persona + Usuario con el rol por defecto', async () => {
    repo.signUpWithEmail.mockResolvedValue({
      user: { id: 'auth-1', email: 'juan@test.com', fullName: null },
      session,
    });
    repo.findRolByNombre.mockResolvedValue(rol);
    repo.createPersona.mockResolvedValue(persona);
    repo.createUsuario.mockResolvedValue(usuario);

    const result = await useCase.execute({
      email: 'juan@test.com',
      password: 'secret123',
      nombres: 'Juan',
      apellidos: 'Pérez',
    });

    expect(repo.signUpWithEmail).toHaveBeenCalledWith(
      'juan@test.com',
      'secret123',
    );
    expect(repo.findRolByNombre).toHaveBeenCalledWith('Futbolista');
    expect(repo.createUsuario).toHaveBeenCalledWith(
      expect.objectContaining({ supabaseAuthId: 'auth-1', rolId: 'rol-1' }),
    );
    expect(result).toEqual({ session, profile: { usuario, persona, rol } });
  });

  it('respeta el rol indicado en la entrada', async () => {
    repo.signUpWithEmail.mockResolvedValue({
      user: { id: 'auth-1', email: 'juan@test.com', fullName: null },
      session,
    });
    repo.findRolByNombre.mockResolvedValue({ ...rol, nombreRol: 'Entrenador' });
    repo.createPersona.mockResolvedValue(persona);
    repo.createUsuario.mockResolvedValue(usuario);

    await useCase.execute({
      email: 'juan@test.com',
      password: 'secret123',
      nombres: 'Juan',
      apellidos: 'Pérez',
      rolNombre: 'Entrenador',
    });

    expect(repo.findRolByNombre).toHaveBeenCalledWith('Entrenador');
  });

  it('lanza RoleNotFoundError si el rol no existe', async () => {
    repo.signUpWithEmail.mockResolvedValue({
      user: { id: 'auth-1', email: 'juan@test.com', fullName: null },
      session,
    });
    repo.findRolByNombre.mockResolvedValue(null);

    await expect(
      useCase.execute({
        email: 'juan@test.com',
        password: 'secret123',
        nombres: 'Juan',
        apellidos: 'Pérez',
      }),
    ).rejects.toBeInstanceOf(RoleNotFoundError);
    expect(repo.createPersona).not.toHaveBeenCalled();
  });
});
