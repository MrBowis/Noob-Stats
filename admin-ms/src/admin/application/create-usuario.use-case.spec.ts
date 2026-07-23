import {
  EmailAlreadyInUseError,
  RolNotFoundError,
} from '../domain/exceptions/admin.errors';
import { AdminAccessService } from './admin-access.service';
import { CreateUsuarioUseCase } from './create-usuario.use-case';
import {
  AUTH_ID,
  createMockAdminRepository,
  makeAdminDetalle,
  makePersona,
  makeRol,
  makeUsuario,
  MockAdminRepository,
} from './__mocks__/admin-repository.mock';

describe('CreateUsuarioUseCase', () => {
  let repo: MockAdminRepository;
  let useCase: CreateUsuarioUseCase;

  beforeEach(() => {
    repo = createMockAdminRepository();
    useCase = new CreateUsuarioUseCase(repo, new AdminAccessService(repo));
    repo.findUsuarioDetalleByAuthId.mockResolvedValue(makeAdminDetalle());
  });

  it('crea la persona y el usuario con el rol resuelto por nombre', async () => {
    repo.findRolByNombre.mockResolvedValue(makeRol());
    repo.findUsuarioByEmail.mockResolvedValue(null);
    repo.createPersona.mockResolvedValue(makePersona());
    repo.createUsuario.mockResolvedValue(makeUsuario());

    const detalle = await useCase.execute({
      authId: AUTH_ID,
      email: 'diego@example.com',
      nombres: 'Diego',
      apellidos: 'Chalá',
      rolNombre: 'Futbolista',
    });

    expect(repo.createPersona).toHaveBeenCalledWith(
      expect.objectContaining({ correo: 'diego@example.com' }),
    );
    expect(repo.createUsuario).toHaveBeenCalledWith({
      personaId: 'per-0001',
      rolId: 'rol-0001',
      email: 'diego@example.com',
    });
    expect(detalle).toMatchObject({ id: 'user-0001', rol: makeRol() });
  });

  it('usa el correo explícito si se indica distinto al email de acceso', async () => {
    repo.findRolByNombre.mockResolvedValue(makeRol());
    repo.findUsuarioByEmail.mockResolvedValue(null);
    repo.createPersona.mockResolvedValue(makePersona());
    repo.createUsuario.mockResolvedValue(makeUsuario());

    await useCase.execute({
      authId: AUTH_ID,
      email: 'diego@example.com',
      nombres: 'Diego',
      apellidos: 'Chalá',
      rolNombre: 'Futbolista',
      correo: 'contacto@example.com',
    });

    expect(repo.createPersona).toHaveBeenCalledWith(
      expect.objectContaining({ correo: 'contacto@example.com' }),
    );
  });

  it('lanza RolNotFoundError si el rol no existe', async () => {
    repo.findRolByNombre.mockResolvedValue(null);

    await expect(
      useCase.execute({
        authId: AUTH_ID,
        email: 'x@example.com',
        nombres: 'X',
        apellidos: 'Y',
        rolNombre: 'Inexistente',
      }),
    ).rejects.toBeInstanceOf(RolNotFoundError);
  });

  it('lanza EmailAlreadyInUseError si el correo ya está registrado', async () => {
    repo.findRolByNombre.mockResolvedValue(makeRol());
    repo.findUsuarioByEmail.mockResolvedValue(makeUsuario());

    await expect(
      useCase.execute({
        authId: AUTH_ID,
        email: 'diego@example.com',
        nombres: 'Diego',
        apellidos: 'Chalá',
        rolNombre: 'Futbolista',
      }),
    ).rejects.toBeInstanceOf(EmailAlreadyInUseError);
    expect(repo.createPersona).not.toHaveBeenCalled();
  });
});
