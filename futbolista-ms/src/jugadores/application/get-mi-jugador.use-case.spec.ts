import {
  AUTH_ID,
  createMockJugadoresRepository,
  makeJugador,
  makeUsuario,
  MockJugadoresRepository,
} from './__mocks__/jugadores-repository.mock';
import { GetMiJugadorUseCase } from './get-mi-jugador.use-case';
import { JugadorAccessService } from './jugador-access.service';

describe('GetMiJugadorUseCase', () => {
  let repo: MockJugadoresRepository;
  let useCase: GetMiJugadorUseCase;

  beforeEach(() => {
    repo = createMockJugadoresRepository();
    useCase = new GetMiJugadorUseCase(repo, new JugadorAccessService(repo));
    repo.findUsuarioByAuthId.mockResolvedValue(makeUsuario());
  });

  it('devuelve el perfil del usuario resuelto por el token', async () => {
    repo.findJugadorByUserId.mockResolvedValue(makeJugador());
    await expect(useCase.execute({ authId: AUTH_ID })).resolves.toEqual(
      makeJugador(),
    );
  });

  it('lanza JugadorNotFoundError con mensaje de "aún no creado" si no existe', async () => {
    repo.findJugadorByUserId.mockResolvedValue(null);
    await expect(useCase.execute({ authId: AUTH_ID })).rejects.toThrow(
      'Todavía no has creado tu perfil',
    );
  });
});
