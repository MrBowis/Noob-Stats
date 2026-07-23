import {
  NotEquipoOwnerError,
  PartidoNotFoundError,
  TarjetaNotFoundError,
} from '../domain/exceptions/equipos.errors';
import {
  createMockEquiposRepository,
  makeEntrenador,
  makeEquipo,
  makeJugador,
  makePartido,
  MockEquiposRepository,
} from './__mocks__/equipos-repository.mock';
import { DeleteTarjetaUseCase } from './delete-tarjeta.use-case';
import { EquipoAccessService } from './equipo-access.service';

const tarjeta = {
  id: 'tarjeta-0001',
  partidoId: 'partido-0001',
  usuarioId: 'user-jugador',
  jugadorNombres: 'Diego',
  jugadorApellidos: 'Chalá',
  tipo: 'amarilla' as const,
  minuto: 67,
};

describe('DeleteTarjetaUseCase', () => {
  let repo: MockEquiposRepository;
  let useCase: DeleteTarjetaUseCase;

  beforeEach(() => {
    repo = createMockEquiposRepository();
    useCase = new DeleteTarjetaUseCase(repo, new EquipoAccessService(repo));
    repo.findTarjetaById.mockResolvedValue(tarjeta);
    repo.findPartidoById.mockResolvedValue(makePartido());
    repo.findEquipoById.mockResolvedValue(makeEquipo());
    repo.findUsuarioByAuthId.mockResolvedValue(makeEntrenador());
  });

  it('elimina la tarjeta para el entrenador dueño', async () => {
    await useCase.execute({ authId: 'auth-0001', tarjetaId: 'tarjeta-0001' });

    expect(repo.deleteTarjeta).toHaveBeenCalledWith('tarjeta-0001');
  });

  it('lanza TarjetaNotFoundError si no existe', async () => {
    repo.findTarjetaById.mockResolvedValue(null);

    await expect(
      useCase.execute({ authId: 'auth-0001', tarjetaId: 'no-existe' }),
    ).rejects.toBeInstanceOf(TarjetaNotFoundError);
  });

  it('lanza PartidoNotFoundError si el partido de la tarjeta desapareció', async () => {
    repo.findPartidoById.mockResolvedValue(null);

    await expect(
      useCase.execute({ authId: 'auth-0001', tarjetaId: 'tarjeta-0001' }),
    ).rejects.toBeInstanceOf(PartidoNotFoundError);
  });

  it('rechaza a un usuario que no es el entrenador dueño', async () => {
    repo.findUsuarioByAuthId.mockResolvedValue(makeJugador());

    await expect(
      useCase.execute({ authId: 'auth-x', tarjetaId: 'tarjeta-0001' }),
    ).rejects.toBeInstanceOf(NotEquipoOwnerError);
  });
});
