import {
  InvalidSlotError,
  MiembroNotFoundError,
  NotEquipoOwnerError,
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
import { UpdateMiembroUseCase } from './update-miembro.use-case';

describe('UpdateMiembroUseCase', () => {
  let repo: MockEquiposRepository;
  let useCase: UpdateMiembroUseCase;

  beforeEach(() => {
    repo = createMockEquiposRepository();
    useCase = new UpdateMiembroUseCase(repo, new EquipoAccessService(repo));
    repo.findEquipoById.mockResolvedValue(makeEquipo());
    repo.findUsuarioByAuthId.mockResolvedValue(makeEntrenador());
  });

  it('actualiza dorsal/posición sin slot', async () => {
    repo.findMiembro.mockResolvedValue(makeMiembro());
    repo.updateMiembro.mockResolvedValue(makeMiembro({ dorsal: 10 }));

    await useCase.execute({
      authId: 'auth-0001',
      equipoId: 'equipo-0001',
      usuarioId: 'user-jugador',
      dorsal: 10,
    });

    expect(repo.updateMiembro).toHaveBeenCalledWith(
      'equipo-0001',
      'user-jugador',
      expect.objectContaining({ dorsal: 10 }),
    );
    expect(repo.clearSlot).not.toHaveBeenCalled();
  });

  it('asigna un slot válido para la formación y libera a quien lo ocupaba', async () => {
    repo.findMiembro.mockResolvedValue(makeMiembro());
    repo.updateMiembro.mockResolvedValue(makeMiembro({ slot: 'DCL' }));

    await useCase.execute({
      authId: 'auth-0001',
      equipoId: 'equipo-0001',
      usuarioId: 'user-jugador',
      slot: 'DCL',
    });

    expect(repo.clearSlot).toHaveBeenCalledWith(
      'equipo-0001',
      'DCL',
      'user-jugador',
    );
  });

  it('rechaza un slot que no pertenece a la formación del equipo', async () => {
    repo.findMiembro.mockResolvedValue(makeMiembro());

    await expect(
      useCase.execute({
        authId: 'auth-0001',
        equipoId: 'equipo-0001',
        usuarioId: 'user-jugador',
        slot: 'SLOT-INEXISTENTE',
      }),
    ).rejects.toBeInstanceOf(InvalidSlotError);
    expect(repo.updateMiembro).not.toHaveBeenCalled();
  });

  it('lanza MiembroNotFoundError si el jugador no pertenece al equipo', async () => {
    repo.findMiembro.mockResolvedValue(null);

    await expect(
      useCase.execute({
        authId: 'auth-0001',
        equipoId: 'equipo-0001',
        usuarioId: 'user-jugador',
      }),
    ).rejects.toBeInstanceOf(MiembroNotFoundError);
  });

  it('rechaza a un usuario que no es el entrenador dueño', async () => {
    repo.findUsuarioByAuthId.mockResolvedValue(makeJugador());

    await expect(
      useCase.execute({
        authId: 'auth-x',
        equipoId: 'equipo-0001',
        usuarioId: 'user-jugador',
      }),
    ).rejects.toBeInstanceOf(NotEquipoOwnerError);
  });
});
