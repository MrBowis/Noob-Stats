import { NotAdminError } from '../domain/exceptions/admin.errors';
import { AdminAccessService } from './admin-access.service';
import { ListRolesUseCase } from './list-roles.use-case';
import {
  AUTH_ID,
  createMockAdminRepository,
  makeAdminDetalle,
  makeRol,
  makeUsuarioDetalle,
  MockAdminRepository,
} from './__mocks__/admin-repository.mock';

describe('ListRolesUseCase', () => {
  let repo: MockAdminRepository;
  let useCase: ListRolesUseCase;

  beforeEach(() => {
    repo = createMockAdminRepository();
    useCase = new ListRolesUseCase(repo, new AdminAccessService(repo));
  });

  it('lista los roles para un Administrador', async () => {
    repo.findUsuarioDetalleByAuthId.mockResolvedValue(makeAdminDetalle());
    repo.listRoles.mockResolvedValue([makeRol()]);

    await expect(useCase.execute({ authId: AUTH_ID })).resolves.toEqual([
      makeRol(),
    ]);
  });

  it('rechaza a quien no es Administrador', async () => {
    repo.findUsuarioDetalleByAuthId.mockResolvedValue(makeUsuarioDetalle());

    await expect(useCase.execute({ authId: AUTH_ID })).rejects.toBeInstanceOf(
      NotAdminError,
    );
  });
});
