import {
  createMockEquiposRepository,
  makeEntrenador,
  makeEquipo,
  MockEquiposRepository,
} from './__mocks__/equipos-repository.mock';
import { EquipoAccessService } from './equipo-access.service';
import { ListMisEquiposUseCase } from './list-mis-equipos.use-case';

describe('ListMisEquiposUseCase', () => {
  let repo: MockEquiposRepository;
  let useCase: ListMisEquiposUseCase;

  beforeEach(() => {
    repo = createMockEquiposRepository();
    useCase = new ListMisEquiposUseCase(repo, new EquipoAccessService(repo));
  });

  it('lista los equipos del usuario resuelto por el token', async () => {
    repo.findUsuarioByAuthId.mockResolvedValue(makeEntrenador());
    repo.listEquiposByUsuario.mockResolvedValue([makeEquipo()]);

    const equipos = await useCase.execute({ authId: 'auth-0001' });

    expect(repo.listEquiposByUsuario).toHaveBeenCalledWith('user-entrenador');
    expect(equipos).toEqual([makeEquipo()]);
  });
});
