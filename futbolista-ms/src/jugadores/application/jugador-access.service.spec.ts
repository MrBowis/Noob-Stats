import {
  JugadorNotFoundError,
  NotJugadorOwnerError,
  UsuarioNotFoundError,
} from '../domain/exceptions/jugadores.errors';
import {
  AUTH_ID,
  JUGADOR_ID,
  MockJugadoresRepository,
  createMockJugadoresRepository,
  makeJugador,
  makeUsuario,
} from './__mocks__/jugadores-repository.mock';
import { JugadorAccessService } from './jugador-access.service';

describe('JugadorAccessService', () => {
  let repo: MockJugadoresRepository;
  let access: JugadorAccessService;

  beforeEach(() => {
    repo = createMockJugadoresRepository();
    access = new JugadorAccessService(repo);
  });

  it('resuelve el usuario de dominio a partir del authId', async () => {
    const usuario = makeUsuario();
    repo.findUsuarioByAuthId.mockResolvedValue(usuario);

    await expect(access.resolverUsuario(AUTH_ID)).resolves.toEqual(usuario);
  });

  it('lanza UsuarioNotFoundError si el token no corresponde a un usuario', async () => {
    repo.findUsuarioByAuthId.mockResolvedValue(null);

    await expect(access.resolverUsuario(AUTH_ID)).rejects.toBeInstanceOf(
      UsuarioNotFoundError,
    );
  });

  it('lanza JugadorNotFoundError si el perfil no existe', async () => {
    repo.findJugadorById.mockResolvedValue(null);

    await expect(access.requireJugador(JUGADOR_ID)).rejects.toBeInstanceOf(
      JugadorNotFoundError,
    );
  });

  it('permite al propietario del perfil', () => {
    expect(() =>
      access.requireOwner(makeJugador(), makeUsuario()),
    ).not.toThrow();
  });

  it('rechaza a un usuario que no es el propietario', () => {
    const otro = makeUsuario({ id: 'user-9999' });

    expect(() => access.requireOwner(makeJugador(), otro)).toThrow(
      NotJugadorOwnerError,
    );
  });

  it('requireOwnedJugador encadena resolución, búsqueda y propiedad', async () => {
    repo.findUsuarioByAuthId.mockResolvedValue(makeUsuario());
    repo.findJugadorById.mockResolvedValue(makeJugador());

    await expect(
      access.requireOwnedJugador(AUTH_ID, JUGADOR_ID),
    ).resolves.toEqual(makeJugador());
  });

  it('requireOwnedJugador rechaza si el perfil es de otro usuario', async () => {
    repo.findUsuarioByAuthId.mockResolvedValue(makeUsuario());
    repo.findJugadorById.mockResolvedValue(
      makeJugador({ userId: 'user-9999' }),
    );

    await expect(
      access.requireOwnedJugador(AUTH_ID, JUGADOR_ID),
    ).rejects.toBeInstanceOf(NotJugadorOwnerError);
  });
});
