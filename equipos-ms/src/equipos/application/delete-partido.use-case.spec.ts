import {
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
import { DeletePartidoUseCase } from './delete-partido.use-case';
import { EquipoAccessService } from './equipo-access.service';

describe('DeletePartidoUseCase', () => {
  let repo: MockEquiposRepository;
  let useCase: DeletePartidoUseCase;

  beforeEach(() => {
    repo = createMockEquiposRepository();
    useCase = new DeletePartidoUseCase(repo, new EquipoAccessService(repo));
    repo.findEquipoById.mockResolvedValue(makeEquipo());
    repo.findPartidoById.mockResolvedValue(makePartido());
  });

  it('elimina el partido para el entrenador dueño', async () => {
    repo.findUsuarioByAuthId.mockResolvedValue(makeEntrenador());

    await useCase.execute({ authId: 'auth-0001', partidoId: 'partido-0001' });

    expect(repo.deletePartido).toHaveBeenCalledWith('partido-0001');
  });

  it('lanza PartidoNotFoundError si no existe', async () => {
    repo.findUsuarioByAuthId.mockResolvedValue(makeEntrenador());
    repo.findPartidoById.mockResolvedValue(null);

    await expect(
      useCase.execute({ authId: 'auth-0001', partidoId: 'no-existe' }),
    ).rejects.toBeInstanceOf(PartidoNotFoundError);
  });

  it('rechaza a un usuario que no es el entrenador dueño', async () => {
    repo.findUsuarioByAuthId.mockResolvedValue(makeJugador());

    await expect(
      useCase.execute({ authId: 'auth-x', partidoId: 'partido-0001' }),
    ).rejects.toBeInstanceOf(NotEquipoOwnerError);
  });
});
