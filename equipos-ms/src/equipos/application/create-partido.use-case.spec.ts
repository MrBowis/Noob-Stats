import { NotEquipoOwnerError } from '../domain/exceptions/equipos.errors';
import {
  createMockEquiposRepository,
  makeEntrenador,
  makeEquipo,
  makeJugador,
  makePartido,
  MockEquiposRepository,
} from './__mocks__/equipos-repository.mock';
import { CreatePartidoUseCase } from './create-partido.use-case';
import { EquipoAccessService } from './equipo-access.service';

describe('CreatePartidoUseCase', () => {
  let repo: MockEquiposRepository;
  let useCase: CreatePartidoUseCase;

  beforeEach(() => {
    repo = createMockEquiposRepository();
    useCase = new CreatePartidoUseCase(repo, new EquipoAccessService(repo));
    repo.findEquipoById.mockResolvedValue(makeEquipo());
  });

  it('programa el partido para el entrenador dueño con los valores por defecto', async () => {
    repo.findUsuarioByAuthId.mockResolvedValue(makeEntrenador());
    repo.createPartido.mockResolvedValue(makePartido());

    await useCase.execute({
      authId: 'auth-0001',
      equipoId: 'equipo-0001',
      rival: 'Deportivo Rival',
      fecha: '2026-08-15T18:00:00.000Z',
    });

    expect(repo.createPartido).toHaveBeenCalledWith(
      expect.objectContaining({
        equipoId: 'equipo-0001',
        rival: 'Deportivo Rival',
        esLocal: true,
        ubicacion: null,
        notas: null,
      }),
    );
  });

  it('rechaza a un usuario que no es el entrenador dueño', async () => {
    repo.findUsuarioByAuthId.mockResolvedValue(makeJugador());

    await expect(
      useCase.execute({
        authId: 'auth-x',
        equipoId: 'equipo-0001',
        rival: 'Deportivo Rival',
        fecha: '2026-08-15T18:00:00.000Z',
      }),
    ).rejects.toBeInstanceOf(NotEquipoOwnerError);
  });
});
