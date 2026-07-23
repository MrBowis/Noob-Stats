import {
  GolNotFoundError,
  NotEquipoOwnerError,
  PartidoNotFoundError,
} from '../domain/exceptions/equipos.errors';
import {
  createMockEquiposRepository,
  makeEntrenador,
  makeEquipo,
  makeJugador,
  makePartido,
  MockEquiposRepository,
} from './__mocks__/equipos-repository.mock';
import { DeleteGolUseCase } from './delete-gol.use-case';
import { EquipoAccessService } from './equipo-access.service';

const gol = {
  id: 'gol-0001',
  partidoId: 'partido-0001',
  usuarioId: 'user-jugador',
  jugadorNombres: 'Diego',
  jugadorApellidos: 'Chalá',
  minuto: 23,
};

describe('DeleteGolUseCase', () => {
  let repo: MockEquiposRepository;
  let useCase: DeleteGolUseCase;

  beforeEach(() => {
    repo = createMockEquiposRepository();
    useCase = new DeleteGolUseCase(repo, new EquipoAccessService(repo));
    repo.findGolById.mockResolvedValue(gol);
    repo.findPartidoById.mockResolvedValue(makePartido());
    repo.findEquipoById.mockResolvedValue(makeEquipo());
    repo.findUsuarioByAuthId.mockResolvedValue(makeEntrenador());
  });

  it('elimina el gol para el entrenador dueño', async () => {
    await useCase.execute({ authId: 'auth-0001', golId: 'gol-0001' });

    expect(repo.deleteGol).toHaveBeenCalledWith('gol-0001');
  });

  it('lanza GolNotFoundError si no existe', async () => {
    repo.findGolById.mockResolvedValue(null);

    await expect(
      useCase.execute({ authId: 'auth-0001', golId: 'no-existe' }),
    ).rejects.toBeInstanceOf(GolNotFoundError);
  });

  it('lanza PartidoNotFoundError si el partido del gol desapareció', async () => {
    repo.findPartidoById.mockResolvedValue(null);

    await expect(
      useCase.execute({ authId: 'auth-0001', golId: 'gol-0001' }),
    ).rejects.toBeInstanceOf(PartidoNotFoundError);
  });

  it('rechaza a un usuario que no es el entrenador dueño', async () => {
    repo.findUsuarioByAuthId.mockResolvedValue(makeJugador());

    await expect(
      useCase.execute({ authId: 'auth-x', golId: 'gol-0001' }),
    ).rejects.toBeInstanceOf(NotEquipoOwnerError);
  });
});
