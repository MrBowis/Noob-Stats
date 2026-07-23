import {
  InvitacionNotFoundError,
  InvitacionNotPendingError,
  NotInvitacionOwnerError,
} from '../domain/exceptions/equipos.errors';
import {
  createMockEquiposRepository,
  makeInvitacion,
  makeJugador,
  makeMiembro,
  MockEquiposRepository,
} from './__mocks__/equipos-repository.mock';
import { EquipoAccessService } from './equipo-access.service';
import { ResponderInvitacionUseCase } from './responder-invitacion.use-case';

describe('ResponderInvitacionUseCase', () => {
  let repo: MockEquiposRepository;
  let useCase: ResponderInvitacionUseCase;

  beforeEach(() => {
    repo = createMockEquiposRepository();
    useCase = new ResponderInvitacionUseCase(
      repo,
      new EquipoAccessService(repo),
    );
    repo.findUsuarioByAuthId.mockResolvedValue(makeJugador());
  });

  it('rechazar la invitación no crea un miembro', async () => {
    repo.findInvitacionById.mockResolvedValue(makeInvitacion());
    repo.updateInvitacionEstado.mockResolvedValue(
      makeInvitacion({ estado: 'rechazada' }),
    );

    const resultado = await useCase.execute({
      authId: 'auth-jugador',
      invitacionId: 'invitacion-0001',
      aceptar: false,
    });

    expect(repo.updateInvitacionEstado).toHaveBeenCalledWith(
      'invitacion-0001',
      'rechazada',
    );
    expect(repo.addMiembro).not.toHaveBeenCalled();
    expect(resultado.miembro).toBeNull();
  });

  it('aceptar crea el miembro si aún no pertenece al equipo', async () => {
    repo.findInvitacionById.mockResolvedValue(makeInvitacion());
    repo.findMiembro.mockResolvedValue(null);
    repo.addMiembro.mockResolvedValue(makeMiembro());
    repo.updateInvitacionEstado.mockResolvedValue(
      makeInvitacion({ estado: 'aceptada' }),
    );

    const resultado = await useCase.execute({
      authId: 'auth-jugador',
      invitacionId: 'invitacion-0001',
      aceptar: true,
    });

    expect(repo.addMiembro).toHaveBeenCalledWith({
      equipoId: 'equipo-0001',
      usuarioId: 'user-jugador',
    });
    expect(resultado.miembro).toEqual(makeMiembro());
  });

  it('aceptar no duplica el miembro si ya pertenece al equipo', async () => {
    repo.findInvitacionById.mockResolvedValue(makeInvitacion());
    repo.findMiembro.mockResolvedValue(makeMiembro());
    repo.updateInvitacionEstado.mockResolvedValue(
      makeInvitacion({ estado: 'aceptada' }),
    );

    await useCase.execute({
      authId: 'auth-jugador',
      invitacionId: 'invitacion-0001',
      aceptar: true,
    });

    expect(repo.addMiembro).not.toHaveBeenCalled();
  });

  it('lanza InvitacionNotFoundError si no existe', async () => {
    repo.findInvitacionById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        authId: 'auth-jugador',
        invitacionId: 'no-existe',
        aceptar: true,
      }),
    ).rejects.toBeInstanceOf(InvitacionNotFoundError);
  });

  it('lanza NotInvitacionOwnerError si la invitación no es del usuario', async () => {
    repo.findInvitacionById.mockResolvedValue(
      makeInvitacion({ usuarioId: 'otro-usuario' }),
    );

    await expect(
      useCase.execute({
        authId: 'auth-jugador',
        invitacionId: 'invitacion-0001',
        aceptar: true,
      }),
    ).rejects.toBeInstanceOf(NotInvitacionOwnerError);
  });

  it('lanza InvitacionNotPendingError si ya fue respondida', async () => {
    repo.findInvitacionById.mockResolvedValue(
      makeInvitacion({ estado: 'aceptada' }),
    );

    await expect(
      useCase.execute({
        authId: 'auth-jugador',
        invitacionId: 'invitacion-0001',
        aceptar: true,
      }),
    ).rejects.toBeInstanceOf(InvitacionNotPendingError);
  });
});
