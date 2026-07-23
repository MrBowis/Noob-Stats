import { RolNotFoundError } from '../domain/exceptions/admin.errors';
import { AdminAccessService } from './admin-access.service';
import { GetRolUseCase } from './get-rol.use-case';
import {
  AUTH_ID,
  createMockAdminRepository,
  makeAdminDetalle,
  makeRol,
  MockAdminRepository,
} from './__mocks__/admin-repository.mock';

describe('GetRolUseCase', () => {
  let repo: MockAdminRepository;
  let useCase: GetRolUseCase;

  beforeEach(() => {
    repo = createMockAdminRepository();
    useCase = new GetRolUseCase(repo, new AdminAccessService(repo));
    repo.findUsuarioDetalleByAuthId.mockResolvedValue(makeAdminDetalle());
  });

  it('devuelve el rol si existe', async () => {
    repo.findRolById.mockResolvedValue(makeRol());
    await expect(
      useCase.execute({ authId: AUTH_ID, rolId: 'rol-0001' }),
    ).resolves.toEqual(makeRol());
  });

  it('lanza RolNotFoundError si no existe', async () => {
    repo.findRolById.mockResolvedValue(null);
    await expect(
      useCase.execute({ authId: AUTH_ID, rolId: 'no-existe' }),
    ).rejects.toBeInstanceOf(RolNotFoundError);
  });
});
