import {
  RolNotFoundError,
  UsuarioNotFoundError,
} from '../domain/exceptions/admin.errors';
import { AdminAccessService } from './admin-access.service';
import { UpdateUsuarioUseCase } from './update-usuario.use-case';
import {
  AUTH_ID,
  createMockAdminRepository,
  makeAdminDetalle,
  makeRol,
  makeUsuario,
  makeUsuarioDetalle,
  MockAdminRepository,
} from './__mocks__/admin-repository.mock';

describe('UpdateUsuarioUseCase', () => {
  let repo: MockAdminRepository;
  let useCase: UpdateUsuarioUseCase;

  beforeEach(() => {
    repo = createMockAdminRepository();
    useCase = new UpdateUsuarioUseCase(repo, new AdminAccessService(repo));
    repo.findUsuarioDetalleByAuthId.mockResolvedValue(makeAdminDetalle());
    repo.findUsuarioById.mockResolvedValue(makeUsuario());
    repo.findUsuarioDetalleById.mockResolvedValue(makeUsuarioDetalle());
  });

  it('actualiza los datos de Persona cuando se envían', async () => {
    await useCase.execute({
      authId: AUTH_ID,
      usuarioId: 'user-0001',
      nombres: 'Nuevo Nombre',
    });

    expect(repo.updatePersona).toHaveBeenCalledWith(
      'per-0001',
      expect.objectContaining({ nombres: 'Nuevo Nombre' }),
    );
  });

  it('no llama a updatePersona si no se envía ningún dato de persona', async () => {
    await useCase.execute({ authId: AUTH_ID, usuarioId: 'user-0001' });
    expect(repo.updatePersona).not.toHaveBeenCalled();
  });

  it('reasigna el rol resolviéndolo por nombre', async () => {
    repo.findRolByNombre.mockResolvedValue(makeRol({ id: 'rol-nuevo' }));

    await useCase.execute({
      authId: AUTH_ID,
      usuarioId: 'user-0001',
      rolNombre: 'Entrenador',
    });

    expect(repo.updateUsuario).toHaveBeenCalledWith(
      'user-0001',
      expect.objectContaining({ rolId: 'rol-nuevo' }),
    );
  });

  it('actualiza sólo el estado sin tocar el rol', async () => {
    await useCase.execute({
      authId: AUTH_ID,
      usuarioId: 'user-0001',
      estado: 'inactivo',
    });

    expect(repo.updateUsuario).toHaveBeenCalledWith('user-0001', {
      rolId: undefined,
      estado: 'inactivo',
    });
  });

  it('no llama a updateUsuario si no cambian ni rol ni estado', async () => {
    await useCase.execute({
      authId: AUTH_ID,
      usuarioId: 'user-0001',
      nombres: 'Sólo nombre',
    });
    expect(repo.updateUsuario).not.toHaveBeenCalled();
  });

  it('lanza UsuarioNotFoundError si el usuario no existe', async () => {
    repo.findUsuarioById.mockResolvedValue(null);

    await expect(
      useCase.execute({ authId: AUTH_ID, usuarioId: 'no-existe' }),
    ).rejects.toBeInstanceOf(UsuarioNotFoundError);
  });

  it('lanza RolNotFoundError si el rol indicado no existe', async () => {
    repo.findRolByNombre.mockResolvedValue(null);

    await expect(
      useCase.execute({
        authId: AUTH_ID,
        usuarioId: 'user-0001',
        rolNombre: 'Inexistente',
      }),
    ).rejects.toBeInstanceOf(RolNotFoundError);
  });
});
