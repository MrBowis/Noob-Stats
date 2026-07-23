import {
  createMockJugadoresRepository,
  JUGADOR_ID,
  makeAtributos,
  makeJugador,
  MockJugadoresRepository,
} from './__mocks__/jugadores-repository.mock';
import { GetAtributosUseCase } from './get-atributos.use-case';
import { JugadorAccessService } from './jugador-access.service';

describe('GetAtributosUseCase', () => {
  let repo: MockJugadoresRepository;
  let useCase: GetAtributosUseCase;

  beforeEach(() => {
    repo = createMockJugadoresRepository();
    useCase = new GetAtributosUseCase(repo, new JugadorAccessService(repo));
    repo.findJugadorById.mockResolvedValue(makeJugador());
  });

  it('devuelve los atributos del jugador', async () => {
    repo.findAtributos.mockResolvedValue(makeAtributos());
    await expect(useCase.execute({ jugadorId: JUGADOR_ID })).resolves.toEqual(
      makeAtributos(),
    );
  });

  it('devuelve null si el jugador no los ha guardado', async () => {
    repo.findAtributos.mockResolvedValue(null);
    await expect(
      useCase.execute({ jugadorId: JUGADOR_ID }),
    ).resolves.toBeNull();
  });
});
