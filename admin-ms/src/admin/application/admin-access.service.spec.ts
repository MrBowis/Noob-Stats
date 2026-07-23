import { NotAdminError } from '../domain/exceptions/admin.errors';
import { AdminAccessService } from './admin-access.service';
import {
  AUTH_ID,
  createMockAdminRepository,
  makeAdminDetalle,
  makeUsuarioDetalle,
  MockAdminRepository,
} from './__mocks__/admin-repository.mock';

describe('AdminAccessService', () => {
  let repo: MockAdminRepository;
  let access: AdminAccessService;

  beforeEach(() => {
    repo = createMockAdminRepository();
    access = new AdminAccessService(repo);
  });

  it('devuelve el usuario cuando su rol es Administrador', async () => {
    repo.findUsuarioDetalleByAuthId.mockResolvedValue(makeAdminDetalle());
    await expect(access.requireAdmin(AUTH_ID)).resolves.toEqual(
      makeAdminDetalle(),
    );
  });

  it('lanza NotAdminError si el usuario no existe', async () => {
    repo.findUsuarioDetalleByAuthId.mockResolvedValue(null);
    await expect(access.requireAdmin(AUTH_ID)).rejects.toBeInstanceOf(
      NotAdminError,
    );
  });

  it('lanza NotAdminError si el usuario no tiene rol Administrador', async () => {
    repo.findUsuarioDetalleByAuthId.mockResolvedValue(makeUsuarioDetalle());
    await expect(access.requireAdmin(AUTH_ID)).rejects.toBeInstanceOf(
      NotAdminError,
    );
  });
});
