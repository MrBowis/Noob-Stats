import { NotEquipoOwnerError } from '../domain/exceptions/equipos.errors';
import {
  createMockEquiposRepository,
  makeEntrenador,
  makeEquipo,
  makeJugador,
  MockEquiposRepository,
} from './__mocks__/equipos-repository.mock';
import { DeleteEquipoUseCase } from './delete-equipo.use-case';
import { EquipoAccessService } from './equipo-access.service';

describe('DeleteEquipoUseCase', () => {
  let repo: MockEquiposRepository;
  let useCase: DeleteEquipoUseCase;

  beforeEach(() => {
    repo = createMockEquiposRepository();
    useCase = new DeleteEquipoUseCase(repo, new EquipoAccessService(repo));
    repo.findEquipoById.mockResolvedValue(makeEquipo());
  });

  it('elimina el equipo cuando el solicitante es el dueño', async () => {
    repo.findUsuarioByAuthId.mockResolvedValue(makeEntrenador());

    await useCase.execute({ authId: 'auth-0001', equipoId: 'equipo-0001' });

    expect(repo.deleteEquipo).toHaveBeenCalledWith('equipo-0001');
  });

  it('rechaza a un usuario que no es el entrenador dueño', async () => {
    repo.findUsuarioByAuthId.mockResolvedValue(makeJugador());

    await expect(
      useCase.execute({ authId: 'auth-x', equipoId: 'equipo-0001' }),
    ).rejects.toBeInstanceOf(NotEquipoOwnerError);
    expect(repo.deleteEquipo).not.toHaveBeenCalled();
  });
});
