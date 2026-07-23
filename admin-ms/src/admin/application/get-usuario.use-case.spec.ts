import { UsuarioNotFoundError } from '../domain/exceptions/admin.errors';
import { AdminAccessService } from './admin-access.service';
import { GetUsuarioUseCase } from './get-usuario.use-case';
import {
  AUTH_ID,
  createMockAdminRepository,
  makeAdminDetalle,
  makeUsuarioDetalle,
  MockAdminRepository,
} from './__mocks__/admin-repository.mock';

describe('GetUsuarioUseCase', () => {
  let repo: MockAdminRepository;
  let useCase: GetUsuarioUseCase;

  beforeEach(() => {
    repo = createMockAdminRepository();
    useCase = new GetUsuarioUseCase(repo, new AdminAccessService(repo));
    repo.findUsuarioDetalleByAuthId.mockResolvedValue(makeAdminDetalle());
  });

  it('devuelve el detalle del usuario', async () => {
    repo.findUsuarioDetalleById.mockResolvedValue(makeUsuarioDetalle());
    await expect(
      useCase.execute({ authId: AUTH_ID, usuarioId: 'user-0001' }),
    ).resolves.toEqual(makeUsuarioDetalle());
  });

  it('lanza UsuarioNotFoundError si no existe', async () => {
    repo.findUsuarioDetalleById.mockResolvedValue(null);
    await expect(
      useCase.execute({ authId: AUTH_ID, usuarioId: 'no-existe' }),
    ).rejects.toBeInstanceOf(UsuarioNotFoundError);
  });
});
