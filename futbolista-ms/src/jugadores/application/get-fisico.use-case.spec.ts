import {
  createMockJugadoresRepository,
  JUGADOR_ID,
  makeFisico,
  makeJugador,
  MockJugadoresRepository,
} from './__mocks__/jugadores-repository.mock';
import { GetFisicoUseCase } from './get-fisico.use-case';
import { JugadorAccessService } from './jugador-access.service';

describe('GetFisicoUseCase', () => {
  let repo: MockJugadoresRepository;
  let useCase: GetFisicoUseCase;

  beforeEach(() => {
    repo = createMockJugadoresRepository();
    useCase = new GetFisicoUseCase(repo, new JugadorAccessService(repo));
    repo.findJugadorById.mockResolvedValue(makeJugador());
  });

  it('devuelve los datos físicos del jugador', async () => {
    repo.findFisico.mockResolvedValue(makeFisico());
    await expect(useCase.execute({ jugadorId: JUGADOR_ID })).resolves.toEqual(
      makeFisico(),
    );
  });

  it('devuelve null si el jugador no ha registrado datos físicos', async () => {
    repo.findFisico.mockResolvedValue(null);
    await expect(
      useCase.execute({ jugadorId: JUGADOR_ID }),
    ).resolves.toBeNull();
  });
});
