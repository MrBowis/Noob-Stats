import {
  ForbiddenEquipoAccessError,
  MiembroNotFoundError,
} from '../domain/exceptions/equipos.errors';
import {
  createMockEquiposRepository,
  makeEntrenador,
  makeEquipo,
  makeJugador,
  makeMiembro,
  MockEquiposRepository,
} from './__mocks__/equipos-repository.mock';
import { EquipoAccessService } from './equipo-access.service';
import { RemoveMiembroUseCase } from './remove-miembro.use-case';

describe('RemoveMiembroUseCase', () => {
  let repo: MockEquiposRepository;
  let useCase: RemoveMiembroUseCase;

  beforeEach(() => {
    repo = createMockEquiposRepository();
    useCase = new RemoveMiembroUseCase(repo, new EquipoAccessService(repo));
    repo.findEquipoById.mockResolvedValue(makeEquipo());
  });

  it('el entrenador dueño puede sacar a cualquier jugador', async () => {
    repo.findUsuarioByAuthId.mockResolvedValue(makeEntrenador());
    repo.findMiembro.mockResolvedValue(makeMiembro());

    await useCase.execute({
      authId: 'auth-0001',
      equipoId: 'equipo-0001',
      usuarioId: 'user-jugador',
    });

    expect(repo.removeMiembro).toHaveBeenCalledWith(
      'equipo-0001',
      'user-jugador',
    );
  });

  it('un jugador puede salir del equipo por sí mismo', async () => {
    repo.findUsuarioByAuthId.mockResolvedValue(makeJugador());
    repo.findMiembro.mockResolvedValue(makeMiembro());

    await useCase.execute({
      authId: 'auth-jugador',
      equipoId: 'equipo-0001',
      usuarioId: 'user-jugador',
    });

    expect(repo.removeMiembro).toHaveBeenCalledWith(
      'equipo-0001',
      'user-jugador',
    );
  });

  it('rechaza a un jugador que intenta sacar a otro', async () => {
    repo.findUsuarioByAuthId.mockResolvedValue(
      makeJugador({ id: 'otro-jugador' }),
    );

    await expect(
      useCase.execute({
        authId: 'auth-otro',
        equipoId: 'equipo-0001',
        usuarioId: 'user-jugador',
      }),
    ).rejects.toBeInstanceOf(ForbiddenEquipoAccessError);
    expect(repo.removeMiembro).not.toHaveBeenCalled();
  });

  it('lanza MiembroNotFoundError si el jugador no pertenece al equipo', async () => {
    repo.findUsuarioByAuthId.mockResolvedValue(makeEntrenador());
    repo.findMiembro.mockResolvedValue(null);

    await expect(
      useCase.execute({
        authId: 'auth-0001',
        equipoId: 'equipo-0001',
        usuarioId: 'user-jugador',
      }),
    ).rejects.toBeInstanceOf(MiembroNotFoundError);
  });
});
