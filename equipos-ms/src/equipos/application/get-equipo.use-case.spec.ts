import { ForbiddenEquipoAccessError } from '../domain/exceptions/equipos.errors';
import {
  createMockEquiposRepository,
  makeEntrenador,
  makeEquipo,
  makeJugador,
  MockEquiposRepository,
} from './__mocks__/equipos-repository.mock';
import { EquipoAccessService } from './equipo-access.service';
import { GetEquipoUseCase } from './get-equipo.use-case';

describe('GetEquipoUseCase', () => {
  let repo: MockEquiposRepository;
  let useCase: GetEquipoUseCase;

  beforeEach(() => {
    repo = createMockEquiposRepository();
    useCase = new GetEquipoUseCase(new EquipoAccessService(repo));
    repo.findEquipoById.mockResolvedValue(makeEquipo());
  });

  it('devuelve el equipo al entrenador dueño', async () => {
    repo.findUsuarioByAuthId.mockResolvedValue(makeEntrenador());

    await expect(
      useCase.execute({ authId: 'auth-0001', equipoId: 'equipo-0001' }),
    ).resolves.toEqual(makeEquipo());
  });

  it('rechaza a un usuario que no es dueño ni miembro', async () => {
    repo.findUsuarioByAuthId.mockResolvedValue(makeJugador());
    repo.findMiembro.mockResolvedValue(null);

    await expect(
      useCase.execute({ authId: 'auth-x', equipoId: 'equipo-0001' }),
    ).rejects.toBeInstanceOf(ForbiddenEquipoAccessError);
  });
});
