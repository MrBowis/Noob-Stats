import { NotEquipoOwnerError } from '../domain/exceptions/equipos.errors';
import {
  createMockEquiposRepository,
  makeEntrenador,
  makeEquipo,
  makeJugador,
  MockEquiposRepository,
} from './__mocks__/equipos-repository.mock';
import { EquipoAccessService } from './equipo-access.service';
import { UpdateEquipoUseCase } from './update-equipo.use-case';

describe('UpdateEquipoUseCase', () => {
  let repo: MockEquiposRepository;
  let useCase: UpdateEquipoUseCase;

  beforeEach(() => {
    repo = createMockEquiposRepository();
    useCase = new UpdateEquipoUseCase(repo, new EquipoAccessService(repo));
    repo.findEquipoById.mockResolvedValue(makeEquipo());
  });

  it('actualiza el equipo cuando el solicitante es el dueño', async () => {
    repo.findUsuarioByAuthId.mockResolvedValue(makeEntrenador());
    repo.updateEquipo.mockResolvedValue(makeEquipo({ nombre: 'Nuevo Nombre' }));

    await useCase.execute({
      authId: 'auth-0001',
      equipoId: 'equipo-0001',
      nombre: 'Nuevo Nombre',
    });

    expect(repo.updateEquipo).toHaveBeenCalledWith(
      'equipo-0001',
      expect.objectContaining({ nombre: 'Nuevo Nombre' }),
    );
  });

  it('rechaza a un usuario que no es el entrenador dueño', async () => {
    repo.findUsuarioByAuthId.mockResolvedValue(makeJugador());

    await expect(
      useCase.execute({ authId: 'auth-x', equipoId: 'equipo-0001' }),
    ).rejects.toBeInstanceOf(NotEquipoOwnerError);
    expect(repo.updateEquipo).not.toHaveBeenCalled();
  });
});
