import { UsuarioNotFoundError } from '../domain/exceptions/admin.errors';
import { AdminAccessService } from './admin-access.service';
import { DeactivateUsuarioUseCase } from './deactivate-usuario.use-case';
import {
  AUTH_ID,
  createMockAdminRepository,
  makeAdminDetalle,
  makeUsuario,
  makeUsuarioDetalle,
  MockAdminRepository,
} from './__mocks__/admin-repository.mock';

describe('DeactivateUsuarioUseCase', () => {
  let repo: MockAdminRepository;
  let useCase: DeactivateUsuarioUseCase;

  beforeEach(() => {
    repo = createMockAdminRepository();
    useCase = new DeactivateUsuarioUseCase(repo, new AdminAccessService(repo));
    repo.findUsuarioDetalleByAuthId.mockResolvedValue(makeAdminDetalle());
  });

  it('cambia el estado a inactivo (borrado lógico)', async () => {
    repo.findUsuarioById.mockResolvedValue(makeUsuario());
    repo.findUsuarioDetalleById.mockResolvedValue(
      makeUsuarioDetalle({ estado: 'inactivo' }),
    );

    const detalle = await useCase.execute({
      authId: AUTH_ID,
      usuarioId: 'user-0001',
    });

    expect(repo.updateUsuario).toHaveBeenCalledWith('user-0001', {
      estado: 'inactivo',
    });
    expect(detalle.estado).toBe('inactivo');
  });

  it('lanza UsuarioNotFoundError si el usuario no existe', async () => {
    repo.findUsuarioById.mockResolvedValue(null);

    await expect(
      useCase.execute({ authId: AUTH_ID, usuarioId: 'no-existe' }),
    ).rejects.toBeInstanceOf(UsuarioNotFoundError);
  });
});
