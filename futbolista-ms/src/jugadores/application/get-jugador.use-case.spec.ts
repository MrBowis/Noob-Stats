import { JugadorNotFoundError } from '../domain/exceptions/jugadores.errors';
import {
  createMockJugadoresRepository,
  JUGADOR_ID,
  makeJugador,
  MockJugadoresRepository,
} from './__mocks__/jugadores-repository.mock';
import { GetJugadorUseCase } from './get-jugador.use-case';
import { JugadorAccessService } from './jugador-access.service';

describe('GetJugadorUseCase', () => {
  let repo: MockJugadoresRepository;
  let useCase: GetJugadorUseCase;

  beforeEach(() => {
    repo = createMockJugadoresRepository();
    useCase = new GetJugadorUseCase(new JugadorAccessService(repo));
  });

  it('devuelve el perfil público del jugador', async () => {
    repo.findJugadorById.mockResolvedValue(makeJugador());
    await expect(useCase.execute({ jugadorId: JUGADOR_ID })).resolves.toEqual(
      makeJugador(),
    );
  });

  it('lanza JugadorNotFoundError si no existe', async () => {
    repo.findJugadorById.mockResolvedValue(null);
    await expect(
      useCase.execute({ jugadorId: 'no-existe' }),
    ).rejects.toBeInstanceOf(JugadorNotFoundError);
  });
});
