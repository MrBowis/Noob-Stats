import {
  createMockEquiposRepository,
  makeJugador,
  MockEquiposRepository,
} from './__mocks__/equipos-repository.mock';
import { EquipoAccessService } from './equipo-access.service';
import { ListMisInvitacionesUseCase } from './list-mis-invitaciones.use-case';

describe('ListMisInvitacionesUseCase', () => {
  let repo: MockEquiposRepository;
  let useCase: ListMisInvitacionesUseCase;

  beforeEach(() => {
    repo = createMockEquiposRepository();
    useCase = new ListMisInvitacionesUseCase(
      repo,
      new EquipoAccessService(repo),
    );
    repo.findUsuarioByAuthId.mockResolvedValue(makeJugador());
  });

  it('lista todas las invitaciones del usuario si no pide sólo pendientes', async () => {
    repo.listInvitacionesByUsuario.mockResolvedValue([]);

    await useCase.execute({ authId: 'auth-jugador', soloPendientes: false });

    expect(repo.listInvitacionesByUsuario).toHaveBeenCalledWith(
      'user-jugador',
      false,
    );
  });

  it('filtra por pendientes cuando se solicita', async () => {
    repo.listInvitacionesByUsuario.mockResolvedValue([]);

    await useCase.execute({ authId: 'auth-jugador', soloPendientes: true });

    expect(repo.listInvitacionesByUsuario).toHaveBeenCalledWith(
      'user-jugador',
      true,
    );
  });
});
