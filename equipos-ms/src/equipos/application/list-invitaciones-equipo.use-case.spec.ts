import { NotEquipoOwnerError } from '../domain/exceptions/equipos.errors';
import {
  createMockEquiposRepository,
  makeEntrenador,
  makeEquipo,
  makeJugador,
  MockEquiposRepository,
} from './__mocks__/equipos-repository.mock';
import { EquipoAccessService } from './equipo-access.service';
import { ListInvitacionesEquipoUseCase } from './list-invitaciones-equipo.use-case';

describe('ListInvitacionesEquipoUseCase', () => {
  let repo: MockEquiposRepository;
  let useCase: ListInvitacionesEquipoUseCase;

  beforeEach(() => {
    repo = createMockEquiposRepository();
    useCase = new ListInvitacionesEquipoUseCase(
      repo,
      new EquipoAccessService(repo),
    );
    repo.findEquipoById.mockResolvedValue(makeEquipo());
  });

  it('lista las invitaciones para el entrenador dueño', async () => {
    repo.findUsuarioByAuthId.mockResolvedValue(makeEntrenador());
    repo.listInvitacionesByEquipo.mockResolvedValue([]);

    await useCase.execute({ authId: 'auth-0001', equipoId: 'equipo-0001' });

    expect(repo.listInvitacionesByEquipo).toHaveBeenCalledWith('equipo-0001');
  });

  it('rechaza a un usuario que no es el entrenador dueño', async () => {
    repo.findUsuarioByAuthId.mockResolvedValue(makeJugador());

    await expect(
      useCase.execute({ authId: 'auth-x', equipoId: 'equipo-0001' }),
    ).rejects.toBeInstanceOf(NotEquipoOwnerError);
  });
});
