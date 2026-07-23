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
import { EquipoAccessService } from './equipo-access.service';
import { UpdatePartidoUseCase } from './update-partido.use-case';

describe('UpdatePartidoUseCase', () => {
  let repo: MockEquiposRepository;
  let useCase: UpdatePartidoUseCase;

  beforeEach(() => {
    repo = createMockEquiposRepository();
    useCase = new UpdatePartidoUseCase(repo, new EquipoAccessService(repo));
    repo.findEquipoById.mockResolvedValue(makeEquipo());
    repo.findPartidoById.mockResolvedValue(makePartido());
    repo.findUsuarioByAuthId.mockResolvedValue(makeEntrenador());
  });

  it('registra el resultado de un partido finalizado', async () => {
    repo.updatePartido.mockResolvedValue(
      makePartido({ estado: 'finalizado', golesFavor: 2, golesContra: 1 }),
    );

    await useCase.execute({
      authId: 'auth-0001',
      partidoId: 'partido-0001',
      estado: 'finalizado',
      golesFavor: 2,
      golesContra: 1,
    });

    expect(repo.updatePartido).toHaveBeenCalledWith(
      'partido-0001',
      expect.objectContaining({
        estado: 'finalizado',
        golesFavor: 2,
        golesContra: 1,
      }),
    );
  });

  it('lanza PartidoNotFoundError si no existe', async () => {
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
