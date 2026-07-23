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
import { RegisterTarjetaUseCase } from './register-tarjeta.use-case';

const tarjeta = {
  id: 'tarjeta-0001',
  partidoId: 'partido-0001',
  usuarioId: 'user-jugador',
  jugadorNombres: 'Diego',
  jugadorApellidos: 'Chalá',
  tipo: 'amarilla' as const,
  minuto: 67,
};

describe('RegisterTarjetaUseCase', () => {
  let repo: MockEquiposRepository;
  let useCase: RegisterTarjetaUseCase;

  beforeEach(() => {
    repo = createMockEquiposRepository();
    useCase = new RegisterTarjetaUseCase(repo, new EquipoAccessService(repo));
    repo.findEquipoById.mockResolvedValue(makeEquipo());
    repo.findPartidoById.mockResolvedValue(makePartido());
    repo.findUsuarioByAuthId.mockResolvedValue(makeEntrenador());
  });

  it('registra la tarjeta cuando el jugador pertenece al equipo', async () => {
    repo.findMiembro.mockResolvedValue(makeMiembro());
    repo.addTarjeta.mockResolvedValue(tarjeta);

    await useCase.execute({
      authId: 'auth-0001',
      partidoId: 'partido-0001',
      usuarioId: 'user-jugador',
      tipo: 'amarilla',
      minuto: 67,
    });

    expect(repo.addTarjeta).toHaveBeenCalledWith({
      partidoId: 'partido-0001',
      usuarioId: 'user-jugador',
      tipo: 'amarilla',
      minuto: 67,
    });
  });

  it('lanza MiembroNotFoundError si el amonestado no es del equipo', async () => {
    repo.findMiembro.mockResolvedValue(null);

    await expect(
      useCase.execute({
        authId: 'auth-0001',
        partidoId: 'partido-0001',
        usuarioId: 'user-ajeno',
        tipo: 'roja',
      }),
    ).rejects.toBeInstanceOf(MiembroNotFoundError);
  });

  it('lanza PartidoNotFoundError si el partido no existe', async () => {
    repo.findPartidoById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        authId: 'auth-0001',
        partidoId: 'no-existe',
        tipo: 'amarilla',
      }),
    ).rejects.toBeInstanceOf(PartidoNotFoundError);
  });

  it('rechaza a un usuario que no es el entrenador dueño', async () => {
    repo.findUsuarioByAuthId.mockResolvedValue(makeJugador());

    await expect(
      useCase.execute({
        authId: 'auth-x',
        partidoId: 'partido-0001',
        tipo: 'amarilla',
      }),
    ).rejects.toBeInstanceOf(NotEquipoOwnerError);
  });
});
