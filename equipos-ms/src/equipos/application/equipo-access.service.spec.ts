import {
  EquipoNotFoundError,
  ForbiddenEquipoAccessError,
  NotEntrenadorError,
  NotEquipoOwnerError,
  UsuarioNotFoundError,
} from '../domain/exceptions/equipos.errors';
import {
  createMockEquiposRepository,
  makeEntrenador,
  makeEquipo,
  makeJugador,
  MockEquiposRepository,
} from './__mocks__/equipos-repository.mock';
import { EquipoAccessService } from './equipo-access.service';

describe('EquipoAccessService', () => {
  let repo: MockEquiposRepository;
  let access: EquipoAccessService;

  beforeEach(() => {
    repo = createMockEquiposRepository();
    access = new EquipoAccessService(repo);
  });

  describe('resolverUsuario', () => {
    it('devuelve el usuario de dominio a partir del authId', async () => {
      const usuario = makeEntrenador();
      repo.findUsuarioByAuthId.mockResolvedValue(usuario);
      await expect(access.resolverUsuario('auth-0001')).resolves.toEqual(
        usuario,
      );
    });

    it('lanza UsuarioNotFoundError si no existe', async () => {
      repo.findUsuarioByAuthId.mockResolvedValue(null);
      await expect(access.resolverUsuario('auth-x')).rejects.toBeInstanceOf(
        UsuarioNotFoundError,
      );
    });
  });

  describe('requireEntrenador', () => {
    it('no lanza si el usuario es Entrenador', () => {
      expect(() => access.requireEntrenador(makeEntrenador())).not.toThrow();
    });

    it('lanza NotEntrenadorError si el usuario no es Entrenador', () => {
      expect(() => access.requireEntrenador(makeJugador())).toThrow(
        NotEntrenadorError,
      );
    });
  });

  describe('requireEquipo', () => {
    it('devuelve el equipo si existe', async () => {
      const equipo = makeEquipo();
      repo.findEquipoById.mockResolvedValue(equipo);
      await expect(access.requireEquipo(equipo.id)).resolves.toEqual(equipo);
    });

    it('lanza EquipoNotFoundError si no existe', async () => {
      repo.findEquipoById.mockResolvedValue(null);
      await expect(access.requireEquipo('no-existe')).rejects.toBeInstanceOf(
        EquipoNotFoundError,
      );
    });
  });

  describe('requireOwner', () => {
    it('no lanza si el usuario es el entrenador dueño', () => {
      expect(() =>
        access.requireOwner(makeEquipo(), makeEntrenador()),
      ).not.toThrow();
    });

    it('lanza NotEquipoOwnerError si el usuario no es el dueño', () => {
      expect(() => access.requireOwner(makeEquipo(), makeJugador())).toThrow(
        NotEquipoOwnerError,
      );
    });
  });

  describe('requireAccess', () => {
    it('permite al entrenador dueño sin consultar membresía', async () => {
      await access.requireAccess(makeEquipo(), makeEntrenador());
      expect(repo.findMiembro).not.toHaveBeenCalled();
    });

    it('permite a un miembro del equipo', async () => {
      repo.findMiembro.mockResolvedValue({
        id: 'm1',
        equipoId: 'equipo-0001',
        usuarioId: 'user-jugador',
        dorsal: null,
        posicion: null,
        slot: null,
        estado: 'activo',
        joinedAt: '2026-07-01T00:00:00.000Z',
      });
      await expect(
        access.requireAccess(makeEquipo(), makeJugador()),
      ).resolves.toBeUndefined();
    });

    it('lanza ForbiddenEquipoAccessError si no es dueño ni miembro', async () => {
      repo.findMiembro.mockResolvedValue(null);
      await expect(
        access.requireAccess(makeEquipo(), makeJugador()),
      ).rejects.toBeInstanceOf(ForbiddenEquipoAccessError);
    });
  });
});
