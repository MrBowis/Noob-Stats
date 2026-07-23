import { RolNotFoundError } from '../domain/exceptions/admin.errors';
import { AdminAccessService } from './admin-access.service';
import { UpdateRolUseCase } from './update-rol.use-case';
import {
  AUTH_ID,
  createMockAdminRepository,
  makeAdminDetalle,
  makeRol,
  MockAdminRepository,
} from './__mocks__/admin-repository.mock';

describe('UpdateRolUseCase', () => {
  let repo: MockAdminRepository;
  let useCase: UpdateRolUseCase;

  beforeEach(() => {
    repo = createMockAdminRepository();
    useCase = new UpdateRolUseCase(repo, new AdminAccessService(repo));
    repo.findUsuarioDetalleByAuthId.mockResolvedValue(makeAdminDetalle());
  });

  it('actualiza el rol existente', async () => {
    repo.findRolById.mockResolvedValue(makeRol());
    repo.updateRol.mockResolvedValue(makeRol({ nombreRol: 'Editado' }));

    await useCase.execute({
      authId: AUTH_ID,
      rolId: 'rol-0001',
      nombreRol: 'Editado',
    });

    expect(repo.updateRol).toHaveBeenCalledWith(
      'rol-0001',
      expect.objectContaining({ nombreRol: 'Editado' }),
    );
  });

  it('lanza RolNotFoundError si no existe', async () => {
    repo.findRolById.mockResolvedValue(null);

    await expect(
      useCase.execute({ authId: AUTH_ID, rolId: 'no-existe' }),
    ).rejects.toBeInstanceOf(RolNotFoundError);
  });
});
