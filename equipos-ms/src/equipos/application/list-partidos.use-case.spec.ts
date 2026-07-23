import { ForbiddenEquipoAccessError } from '../domain/exceptions/equipos.errors';
import {
  createMockEquiposRepository,
  makeEntrenador,
  makeEquipo,
  makeJugador,
  MockEquiposRepository,
} from './__mocks__/equipos-repository.mock';
import { EquipoAccessService } from './equipo-access.service';
import { ListPartidosUseCase } from './list-partidos.use-case';

describe('ListPartidosUseCase', () => {
  let repo: MockEquiposRepository;
  let useCase: ListPartidosUseCase;

  beforeEach(() => {
    repo = createMockEquiposRepository();
    useCase = new ListPartidosUseCase(repo, new EquipoAccessService(repo));
    repo.findEquipoById.mockResolvedValue(makeEquipo());
  });

  it('lista los partidos con el filtro solicitado para el dueño', async () => {
    repo.findUsuarioByAuthId.mockResolvedValue(makeEntrenador());
    repo.listPartidosByEquipo.mockResolvedValue([]);

    await useCase.execute({
      authId: 'auth-0001',
      equipoId: 'equipo-0001',
      filtro: 'proximos',
    });

    expect(repo.listPartidosByEquipo).toHaveBeenCalledWith(
      'equipo-0001',
      'proximos',
    );
  });

  it('rechaza a quien no tiene acceso al equipo', async () => {
    repo.findUsuarioByAuthId.mockResolvedValue(makeJugador());
    repo.findMiembro.mockResolvedValue(null);

    await expect(
      useCase.execute({
        authId: 'auth-x',
        equipoId: 'equipo-0001',
        filtro: 'todos',
      }),
    ).rejects.toBeInstanceOf(ForbiddenEquipoAccessError);
  });
});
