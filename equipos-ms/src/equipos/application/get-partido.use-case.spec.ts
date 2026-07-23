import { PartidoDetalle } from '../domain/entities/partido.entity';
import {
  ForbiddenEquipoAccessError,
  PartidoNotFoundError,
} from '../domain/exceptions/equipos.errors';
import {
  createMockEquiposRepository,
  makeEntrenador,
  makeEquipo,
  makeJugador,
  makePartido,
  MockEquiposRepository,
} from './__mocks__/equipos-repository.mock';
import { EquipoAccessService } from './equipo-access.service';
import { GetPartidoUseCase } from './get-partido.use-case';

function makeDetalle(): PartidoDetalle {
  return { ...makePartido(), goles: [], tarjetas: [] };
}

describe('GetPartidoUseCase', () => {
  let repo: MockEquiposRepository;
  let useCase: GetPartidoUseCase;

  beforeEach(() => {
    repo = createMockEquiposRepository();
    useCase = new GetPartidoUseCase(repo, new EquipoAccessService(repo));
    repo.findEquipoById.mockResolvedValue(makeEquipo());
  });

  it('devuelve el detalle del partido para quien tiene acceso al equipo', async () => {
    repo.findUsuarioByAuthId.mockResolvedValue(makeEntrenador());
    repo.findPartidoDetalleById.mockResolvedValue(makeDetalle());

    await expect(
      useCase.execute({ authId: 'auth-0001', partidoId: 'partido-0001' }),
    ).resolves.toEqual(makeDetalle());
  });

  it('lanza PartidoNotFoundError si no existe', async () => {
    repo.findUsuarioByAuthId.mockResolvedValue(makeEntrenador());
    repo.findPartidoDetalleById.mockResolvedValue(null);

    await expect(
      useCase.execute({ authId: 'auth-0001', partidoId: 'no-existe' }),
    ).rejects.toBeInstanceOf(PartidoNotFoundError);
  });

  it('rechaza a quien no tiene acceso al equipo del partido', async () => {
    repo.findUsuarioByAuthId.mockResolvedValue(makeJugador());
    repo.findPartidoDetalleById.mockResolvedValue(makeDetalle());
    repo.findMiembro.mockResolvedValue(null);

    await expect(
      useCase.execute({ authId: 'auth-x', partidoId: 'partido-0001' }),
    ).rejects.toBeInstanceOf(ForbiddenEquipoAccessError);
  });
});
