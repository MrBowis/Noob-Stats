import { NotEntrenadorError } from '../domain/exceptions/equipos.errors';
import {
  createMockEquiposRepository,
  makeEntrenador,
  makeEquipo,
  makeJugador,
  MockEquiposRepository,
} from './__mocks__/equipos-repository.mock';
import { CreateEquipoUseCase } from './create-equipo.use-case';
import { EquipoAccessService } from './equipo-access.service';

describe('CreateEquipoUseCase', () => {
  let repo: MockEquiposRepository;
  let useCase: CreateEquipoUseCase;

  beforeEach(() => {
    repo = createMockEquiposRepository();
    useCase = new CreateEquipoUseCase(repo, new EquipoAccessService(repo));
  });

  it('crea el equipo con el entrenador del token como dueño', async () => {
    repo.findUsuarioByAuthId.mockResolvedValue(makeEntrenador());
    repo.createEquipo.mockResolvedValue(makeEquipo());

    await useCase.execute({ authId: 'auth-0001', nombre: 'Noob FC' });

    expect(repo.createEquipo).toHaveBeenCalledWith(
      expect.objectContaining({
        nombre: 'Noob FC',
        entrenadorId: 'user-entrenador',
      }),
    );
  });

  it('rechaza a un usuario que no es Entrenador', async () => {
    repo.findUsuarioByAuthId.mockResolvedValue(makeJugador());

    await expect(
      useCase.execute({ authId: 'auth-0001', nombre: 'Noob FC' }),
    ).rejects.toBeInstanceOf(NotEntrenadorError);
    expect(repo.createEquipo).not.toHaveBeenCalled();
  });
});
