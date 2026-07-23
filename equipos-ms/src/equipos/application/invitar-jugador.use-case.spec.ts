import {
  AlreadyMiembroError,
  InvalidPlayerError,
  InvitacionAlreadyExistsError,
  NotEquipoOwnerError,
  UsuarioNotFoundError,
} from '../domain/exceptions/equipos.errors';
import {
  createMockEquiposRepository,
  makeEntrenador,
  makeEquipo,
  makeInvitacion,
  makeJugador,
  makeMiembro,
  MockEquiposRepository,
} from './__mocks__/equipos-repository.mock';
import { EquipoAccessService } from './equipo-access.service';
import { InvitarJugadorUseCase } from './invitar-jugador.use-case';

describe('InvitarJugadorUseCase', () => {
  let repo: MockEquiposRepository;
  let useCase: InvitarJugadorUseCase;

  beforeEach(() => {
    repo = createMockEquiposRepository();
    useCase = new InvitarJugadorUseCase(repo, new EquipoAccessService(repo));
    repo.findEquipoById.mockResolvedValue(makeEquipo());
    repo.findUsuarioByAuthId.mockResolvedValue(makeEntrenador());
  });

  it('crea la invitación cuando el correo es de un Futbolista libre', async () => {
    repo.findUsuarioByEmail.mockResolvedValue(makeJugador());
    repo.findMiembro.mockResolvedValue(null);
    repo.findInvitacionPendiente.mockResolvedValue(null);
    repo.createInvitacion.mockResolvedValue(makeInvitacion());

    await useCase.execute({
      authId: 'auth-0001',
      equipoId: 'equipo-0001',
      jugadorEmail: 'jugador@example.com',
    });

    expect(repo.createInvitacion).toHaveBeenCalledWith({
      equipoId: 'equipo-0001',
      usuarioId: 'user-jugador',
      mensaje: null,
    });
  });

  it('rechaza si el correo no corresponde a ningún usuario', async () => {
    repo.findUsuarioByEmail.mockResolvedValue(null);

    await expect(
      useCase.execute({
        authId: 'auth-0001',
        equipoId: 'equipo-0001',
        jugadorEmail: 'nadie@example.com',
      }),
    ).rejects.toBeInstanceOf(UsuarioNotFoundError);
  });

  it('rechaza si el usuario invitado no es Futbolista', async () => {
    repo.findUsuarioByEmail.mockResolvedValue(makeEntrenador());

    await expect(
      useCase.execute({
        authId: 'auth-0001',
        equipoId: 'equipo-0001',
        jugadorEmail: 'entrenador@example.com',
      }),
    ).rejects.toBeInstanceOf(InvalidPlayerError);
  });

  it('rechaza si el jugador ya es miembro del equipo', async () => {
    repo.findUsuarioByEmail.mockResolvedValue(makeJugador());
    repo.findMiembro.mockResolvedValue(makeMiembro());

    await expect(
      useCase.execute({
        authId: 'auth-0001',
        equipoId: 'equipo-0001',
        jugadorEmail: 'jugador@example.com',
      }),
    ).rejects.toBeInstanceOf(AlreadyMiembroError);
  });

  it('rechaza si ya existe una invitación pendiente', async () => {
    repo.findUsuarioByEmail.mockResolvedValue(makeJugador());
    repo.findMiembro.mockResolvedValue(null);
    repo.findInvitacionPendiente.mockResolvedValue(makeInvitacion());

    await expect(
      useCase.execute({
        authId: 'auth-0001',
        equipoId: 'equipo-0001',
        jugadorEmail: 'jugador@example.com',
      }),
    ).rejects.toBeInstanceOf(InvitacionAlreadyExistsError);
  });

  it('rechaza a un usuario que no es el entrenador dueño', async () => {
    repo.findUsuarioByAuthId.mockResolvedValue(makeJugador());

    await expect(
      useCase.execute({
        authId: 'auth-x',
        equipoId: 'equipo-0001',
        jugadorEmail: 'jugador@example.com',
      }),
    ).rejects.toBeInstanceOf(NotEquipoOwnerError);
  });
});
