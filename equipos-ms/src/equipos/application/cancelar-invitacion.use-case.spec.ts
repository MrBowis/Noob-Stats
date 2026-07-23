import {
  InvitacionNotFoundError,
  InvitacionNotPendingError,
  NotEquipoOwnerError,
} from '../domain/exceptions/equipos.errors';
import {
  createMockEquiposRepository,
  makeEntrenador,
  makeEquipo,
  makeInvitacion,
  makeJugador,
  MockEquiposRepository,
} from './__mocks__/equipos-repository.mock';
import { CancelarInvitacionUseCase } from './cancelar-invitacion.use-case';
import { EquipoAccessService } from './equipo-access.service';

describe('CancelarInvitacionUseCase', () => {
  let repo: MockEquiposRepository;
  let useCase: CancelarInvitacionUseCase;

  beforeEach(() => {
    repo = createMockEquiposRepository();
    useCase = new CancelarInvitacionUseCase(
      repo,
      new EquipoAccessService(repo),
    );
    repo.findEquipoById.mockResolvedValue(makeEquipo());
  });

  it('cancela una invitación pendiente para el entrenador dueño', async () => {
    repo.findUsuarioByAuthId.mockResolvedValue(makeEntrenador());
    repo.findInvitacionById.mockResolvedValue(makeInvitacion());
    repo.updateInvitacionEstado.mockResolvedValue(
      makeInvitacion({ estado: 'cancelada' }),
    );

    await useCase.execute({
      authId: 'auth-0001',
      invitacionId: 'invitacion-0001',
    });

    expect(repo.updateInvitacionEstado).toHaveBeenCalledWith(
      'invitacion-0001',
      'cancelada',
    );
  });

  it('lanza InvitacionNotFoundError si no existe', async () => {
    repo.findUsuarioByAuthId.mockResolvedValue(makeEntrenador());
    repo.findInvitacionById.mockResolvedValue(null);

    await expect(
      useCase.execute({ authId: 'auth-0001', invitacionId: 'no-existe' }),
    ).rejects.toBeInstanceOf(InvitacionNotFoundError);
  });

  it('rechaza a un usuario que no es el entrenador dueño', async () => {
    repo.findUsuarioByAuthId.mockResolvedValue(makeJugador());
    repo.findInvitacionById.mockResolvedValue(makeInvitacion());

    await expect(
      useCase.execute({ authId: 'auth-x', invitacionId: 'invitacion-0001' }),
    ).rejects.toBeInstanceOf(NotEquipoOwnerError);
  });

  it('lanza InvitacionNotPendingError si ya fue respondida', async () => {
    repo.findUsuarioByAuthId.mockResolvedValue(makeEntrenador());
    repo.findInvitacionById.mockResolvedValue(
      makeInvitacion({ estado: 'aceptada' }),
    );

    await expect(
      useCase.execute({ authId: 'auth-0001', invitacionId: 'invitacion-0001' }),
    ).rejects.toBeInstanceOf(InvitacionNotPendingError);
  });
});
