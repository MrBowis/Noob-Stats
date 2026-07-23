import { AdminAccessService } from './admin-access.service';
import { ListUsuariosUseCase } from './list-usuarios.use-case';
import {
  AUTH_ID,
  createMockAdminRepository,
  makeAdminDetalle,
  makeUsuarioDetalle,
  MockAdminRepository,
} from './__mocks__/admin-repository.mock';

describe('ListUsuariosUseCase', () => {
  let repo: MockAdminRepository;
  let useCase: ListUsuariosUseCase;

  beforeEach(() => {
    repo = createMockAdminRepository();
    useCase = new ListUsuariosUseCase(repo, new AdminAccessService(repo));
    repo.findUsuarioDetalleByAuthId.mockResolvedValue(makeAdminDetalle());
  });

  it('lista los usuarios propagando el filtro de estado', async () => {
    repo.listUsuarios.mockResolvedValue([makeUsuarioDetalle()]);

    await useCase.execute({ authId: AUTH_ID, estado: 'activo' });

    expect(repo.listUsuarios).toHaveBeenCalledWith('activo');
  });

  it('lista sin filtro cuando no se indica estado', async () => {
    repo.listUsuarios.mockResolvedValue([]);
    await useCase.execute({ authId: AUTH_ID });
    expect(repo.listUsuarios).toHaveBeenCalledWith(undefined);
  });
});
