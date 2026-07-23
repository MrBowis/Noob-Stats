import {
  createMockJugadoresRepository,
  JUGADOR_ID,
  makeJugador,
  makePosicion,
  MockJugadoresRepository,
} from './__mocks__/jugadores-repository.mock';
import { JugadorAccessService } from './jugador-access.service';
import { ListPosicionesUseCase } from './list-posiciones.use-case';

describe('ListPosicionesUseCase', () => {
  let repo: MockJugadoresRepository;
  let useCase: ListPosicionesUseCase;

  beforeEach(() => {
    repo = createMockJugadoresRepository();
    useCase = new ListPosicionesUseCase(repo, new JugadorAccessService(repo));
    repo.findJugadorById.mockResolvedValue(makeJugador());
  });

  it('lista las posiciones del jugador', async () => {
    repo.listPosiciones.mockResolvedValue([makePosicion('PORTERO', true)]);
    await expect(useCase.execute({ jugadorId: JUGADOR_ID })).resolves.toEqual([
      makePosicion('PORTERO', true),
    ]);
  });

  it('lanza si el jugador no existe (consulta pública igualmente validada)', async () => {
    repo.findJugadorById.mockResolvedValue(null);
    await expect(useCase.execute({ jugadorId: 'no-existe' })).rejects.toThrow();
  });
});
