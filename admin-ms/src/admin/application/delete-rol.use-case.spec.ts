import {
  RolInUseError,
  RolNotFoundError,
} from '../domain/exceptions/admin.errors';
import { AdminAccessService } from './admin-access.service';
import { DeleteRolUseCase } from './delete-rol.use-case';
import {
  AUTH_ID,
  createMockAdminRepository,
  makeAdminDetalle,
  makeRol,
  MockAdminRepository,
} from './__mocks__/admin-repository.mock';

describe('DeleteRolUseCase', () => {
  let repo: MockAdminRepository;
  let useCase: DeleteRolUseCase;

  beforeEach(() => {
    repo = createMockAdminRepository();
    useCase = new DeleteRolUseCase(repo, new AdminAccessService(repo));
    repo.findUsuarioDetalleByAuthId.mockResolvedValue(makeAdminDetalle());
    repo.findRolById.mockResolvedValue(makeRol());
  });

  it('elimina el rol si no tiene usuarios asignados', async () => {
    repo.countUsuariosByRol.mockResolvedValue(0);

    await useCase.execute({ authId: AUTH_ID, rolId: 'rol-0001' });

    expect(repo.deleteRol).toHaveBeenCalledWith('rol-0001');
  });

  it('lanza RolNotFoundError si no existe', async () => {
    repo.findRolById.mockResolvedValue(null);

    await expect(
      useCase.execute({ authId: AUTH_ID, rolId: 'no-existe' }),
    ).rejects.toBeInstanceOf(RolNotFoundError);
  });

  it('lanza RolInUseError si tiene usuarios asignados', async () => {
    repo.countUsuariosByRol.mockResolvedValue(3);

    await expect(
      useCase.execute({ authId: AUTH_ID, rolId: 'rol-0001' }),
    ).rejects.toBeInstanceOf(RolInUseError);
    expect(repo.deleteRol).not.toHaveBeenCalled();
  });
});
