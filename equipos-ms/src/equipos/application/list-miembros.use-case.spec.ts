import { ForbiddenEquipoAccessError } from '../domain/exceptions/equipos.errors';
import {
  createMockEquiposRepository,
  makeEntrenador,
  makeEquipo,
  makeJugador,
  MockEquiposRepository,
} from './__mocks__/equipos-repository.mock';
import { EquipoAccessService } from './equipo-access.service';
import { ListMiembrosUseCase } from './list-miembros.use-case';

describe('ListMiembrosUseCase', () => {
  let repo: MockEquiposRepository;
  let useCase: ListMiembrosUseCase;

  beforeEach(() => {
    repo = createMockEquiposRepository();
    useCase = new ListMiembrosUseCase(repo, new EquipoAccessService(repo));
    repo.findEquipoById.mockResolvedValue(makeEquipo());
  });

  it('lista la plantilla para el entrenador dueño', async () => {
    repo.findUsuarioByAuthId.mockResolvedValue(makeEntrenador());
    repo.listMiembros.mockResolvedValue([]);

    await useCase.execute({ authId: 'auth-0001', equipoId: 'equipo-0001' });

    expect(repo.listMiembros).toHaveBeenCalledWith('equipo-0001');
  });

  it('rechaza a quien no tiene acceso al equipo', async () => {
    repo.findUsuarioByAuthId.mockResolvedValue(makeJugador());
    repo.findMiembro.mockResolvedValue(null);

    await expect(
      useCase.execute({ authId: 'auth-x', equipoId: 'equipo-0001' }),
    ).rejects.toBeInstanceOf(ForbiddenEquipoAccessError);
  });
});
