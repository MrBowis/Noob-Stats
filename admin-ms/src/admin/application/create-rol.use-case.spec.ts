import { NotAdminError } from '../domain/exceptions/admin.errors';
import { CreateRolUseCase } from './create-rol.use-case';
import {
  AUTH_ID,
  createMockAdminRepository,
  makeAdminDetalle,
  makeRol,
  makeUsuarioDetalle,
  MockAdminRepository,
} from './__mocks__/admin-repository.mock';
import { AdminAccessService } from './admin-access.service';

describe('CreateRolUseCase', () => {
  let repo: MockAdminRepository;
  let useCase: CreateRolUseCase;

  beforeEach(() => {
    repo = createMockAdminRepository();
    useCase = new CreateRolUseCase(repo, new AdminAccessService(repo));
  });

  it('crea el rol con descripción por defecto null', async () => {
    repo.findUsuarioDetalleByAuthId.mockResolvedValue(makeAdminDetalle());
    repo.createRol.mockResolvedValue(makeRol());

    await useCase.execute({ authId: AUTH_ID, nombreRol: 'Futbolista' });

    expect(repo.createRol).toHaveBeenCalledWith({
      nombreRol: 'Futbolista',
      descripcion: null,
    });
  });

  it('rechaza a un usuario que no es Administrador', async () => {
    repo.findUsuarioDetalleByAuthId.mockResolvedValue(makeUsuarioDetalle());

    await expect(
      useCase.execute({ authId: AUTH_ID, nombreRol: 'Futbolista' }),
    ).rejects.toBeInstanceOf(NotAdminError);
    expect(repo.createRol).not.toHaveBeenCalled();
  });
});
