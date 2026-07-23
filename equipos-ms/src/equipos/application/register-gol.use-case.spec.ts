import {
  MiembroNotFoundError,
  NotEquipoOwnerError,
  PartidoNotFoundError,
} from '../domain/exceptions/equipos.errors';
import {
  createMockEquiposRepository,
  makeEntrenador,
  makeEquipo,
  makeJugador,
  makeMiembro,
  makePartido,
  MockEquiposRepository,
} from './__mocks__/equipos-repository.mock';
import { EquipoAccessService } from './equipo-access.service';
import { RegisterGolUseCase } from './register-gol.use-case';

const gol = {
  id: 'gol-0001',
  partidoId: 'partido-0001',
  usuarioId: 'user-jugador',
  jugadorNombres: 'Diego',
  jugadorApellidos: 'Chalá',
  minuto: 23,
};

describe('RegisterGolUseCase', () => {
  let repo: MockEquiposRepository;
  let useCase: RegisterGolUseCase;

  beforeEach(() => {
    repo = createMockEquiposRepository();
    useCase = new RegisterGolUseCase(repo, new EquipoAccessService(repo));
    repo.findEquipoById.mockResolvedValue(makeEquipo());
    repo.findPartidoById.mockResolvedValue(makePartido());
    repo.findUsuarioByAuthId.mockResolvedValue(makeEntrenador());
  });

  it('registra el gol cuando el goleador pertenece al equipo', async () => {
    repo.findMiembro.mockResolvedValue(makeMiembro());
    repo.addGol.mockResolvedValue(gol);

    await useCase.execute({
      authId: 'auth-0001',
      partidoId: 'partido-0001',
      usuarioId: 'user-jugador',
      minuto: 23,
    });

    expect(repo.addGol).toHaveBeenCalledWith({
      partidoId: 'partido-0001',
      usuarioId: 'user-jugador',
      minuto: 23,
    });
  });

  it('permite un gol sin jugador asociado (autogol/desconocido)', async () => {
    repo.addGol.mockResolvedValue({ ...gol, usuarioId: null });

    await useCase.execute({ authId: 'auth-0001', partidoId: 'partido-0001' });

    expect(repo.findMiembro).not.toHaveBeenCalled();
    expect(repo.addGol).toHaveBeenCalled();
  });

  it('lanza MiembroNotFoundError si el goleador no es del equipo', async () => {
    repo.findMiembro.mockResolvedValue(null);

    await expect(
      useCase.execute({
        authId: 'auth-0001',
        partidoId: 'partido-0001',
        usuarioId: 'user-ajeno',
      }),
    ).rejects.toBeInstanceOf(MiembroNotFoundError);
  });

  it('lanza PartidoNotFoundError si el partido no existe', async () => {
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
