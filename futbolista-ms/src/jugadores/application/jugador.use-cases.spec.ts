import { ATRIBUTOS_POR_DEFECTO } from '../domain/catalogos';
import {
  JugadorAlreadyExistsError,
  NotJugadorOwnerError,
  UsuarioNotFoundError,
} from '../domain/exceptions/jugadores.errors';
import {
  AUTH_ID,
  JUGADOR_ID,
  MockEquiposGateway,
  MockJugadoresRepository,
  USER_ID,
  createMockEquiposGateway,
  createMockJugadoresRepository,
  makeAtributos,
  makeFisico,
  makeJugador,
  makePosicion,
  makeUsuario,
} from './__mocks__/jugadores-repository.mock';
import { CreateJugadorUseCase } from './create-jugador.use-case';
import { GetResumenAtributosUseCase } from './get-resumen-atributos.use-case';
import { GetResumenUseCase } from './get-resumen.use-case';
import { JugadorAccessService } from './jugador-access.service';
import { ListEquiposJugadorUseCase } from './list-equipos-jugador.use-case';
import { ListJugadoresUseCase } from './list-jugadores.use-case';
import { UpdateAtributosUseCase } from './update-atributos.use-case';
import { UpdateFisicoUseCase } from './update-fisico.use-case';
import { UpdateJugadorUseCase } from './update-jugador.use-case';

describe('Casos de uso del perfil de jugador', () => {
  let repo: MockJugadoresRepository;
  let access: JugadorAccessService;

  beforeEach(() => {
    repo = createMockJugadoresRepository();
    access = new JugadorAccessService(repo);
  });

  describe('CreateJugadorUseCase', () => {
    let useCase: CreateJugadorUseCase;

    beforeEach(() => {
      useCase = new CreateJugadorUseCase(repo, access);
    });

    it('toma el propietario del token, no del cliente', async () => {
      repo.findUsuarioByAuthId.mockResolvedValue(makeUsuario());
      repo.findJugadorByUserId.mockResolvedValue(null);
      repo.createJugador.mockResolvedValue(makeJugador());

      await useCase.execute({ authId: AUTH_ID, nacionalidad: 'Ecuatoriana' });

      expect(repo.createJugador).toHaveBeenCalledWith(
        expect.objectContaining({ userId: USER_ID }),
      );
    });

    it('rechaza un segundo perfil para el mismo usuario', async () => {
      repo.findUsuarioByAuthId.mockResolvedValue(makeUsuario());
      repo.findJugadorByUserId.mockResolvedValue(makeJugador());

      await expect(useCase.execute({ authId: AUTH_ID })).rejects.toBeInstanceOf(
        JugadorAlreadyExistsError,
      );
      expect(repo.createJugador).not.toHaveBeenCalled();
    });

    it('falla si el token no corresponde a un usuario de dominio', async () => {
      repo.findUsuarioByAuthId.mockResolvedValue(null);

      await expect(useCase.execute({ authId: AUTH_ID })).rejects.toBeInstanceOf(
        UsuarioNotFoundError,
      );
    });
  });

  describe('ListJugadoresUseCase', () => {
    it('propaga los filtros públicos al repositorio', async () => {
      repo.listJugadores.mockResolvedValue([makeJugador()]);
      const useCase = new ListJugadoresUseCase(repo);

      await useCase.execute({ posicion: 'PORTERO', estado: 'ACTIVO' });

      expect(repo.listJugadores).toHaveBeenCalledWith({
        posicion: 'PORTERO',
        piernaHabil: undefined,
        estado: 'ACTIVO',
      });
    });
  });

  describe('UpdateJugadorUseCase', () => {
    it('sólo permite editar al propietario', async () => {
      repo.findUsuarioByAuthId.mockResolvedValue(makeUsuario());
      repo.findJugadorById.mockResolvedValue(
        makeJugador({ userId: 'user-9999' }),
      );
      const useCase = new UpdateJugadorUseCase(repo, access);

      await expect(
        useCase.execute({
          authId: AUTH_ID,
          jugadorId: JUGADOR_ID,
          nacionalidad: 'Colombiana',
        }),
      ).rejects.toBeInstanceOf(NotJugadorOwnerError);
      expect(repo.updateJugador).not.toHaveBeenCalled();
    });
  });

  describe('UpdateFisicoUseCase', () => {
    it('hace upsert de altura y peso del propietario', async () => {
      repo.findUsuarioByAuthId.mockResolvedValue(makeUsuario());
      repo.findJugadorById.mockResolvedValue(makeJugador());
      repo.upsertFisico.mockResolvedValue(makeFisico());
      const useCase = new UpdateFisicoUseCase(repo, access);

      await useCase.execute({
        authId: AUTH_ID,
        jugadorId: JUGADOR_ID,
        alturaCm: 180,
      });

      expect(repo.upsertFisico).toHaveBeenCalledWith(JUGADOR_ID, {
        alturaCm: 180,
        pesoKg: undefined,
      });
    });
  });

  describe('UpdateAtributosUseCase', () => {
    it('guarda los cinco atributos del propietario', async () => {
      repo.findUsuarioByAuthId.mockResolvedValue(makeUsuario());
      repo.findJugadorById.mockResolvedValue(makeJugador());
      repo.upsertAtributos.mockResolvedValue(makeAtributos());
      const useCase = new UpdateAtributosUseCase(repo, access);

      await useCase.execute({
        authId: AUTH_ID,
        jugadorId: JUGADOR_ID,
        ataque: 82,
        tactica: 70,
        tecnica: 88,
        defensa: 45,
        creatividad: 91,
      });

      expect(repo.upsertAtributos).toHaveBeenCalledWith(JUGADOR_ID, {
        ataque: 82,
        tactica: 70,
        tecnica: 88,
        defensa: 45,
        creatividad: 91,
      });
    });
  });

  describe('GetResumenAtributosUseCase', () => {
    it('devuelve sólo los cinco valores del pentágono', async () => {
      repo.findJugadorById.mockResolvedValue(makeJugador());
      repo.findAtributos.mockResolvedValue(makeAtributos());
      const useCase = new GetResumenAtributosUseCase(repo, access);

      await expect(useCase.execute({ jugadorId: JUGADOR_ID })).resolves.toEqual(
        {
          jugadorId: JUGADOR_ID,
          atributos: {
            ataque: 82,
            tactica: 70,
            tecnica: 88,
            defensa: 45,
            creatividad: 91,
          },
        },
      );
    });

    it('usa los valores por defecto si el jugador no los ha guardado', async () => {
      repo.findJugadorById.mockResolvedValue(makeJugador());
      repo.findAtributos.mockResolvedValue(null);
      const useCase = new GetResumenAtributosUseCase(repo, access);

      const resumen = await useCase.execute({ jugadorId: JUGADOR_ID });

      expect(resumen.atributos).toEqual(ATRIBUTOS_POR_DEFECTO);
    });
  });

  describe('GetResumenUseCase', () => {
    it('separa la posición principal de las secundarias y lee la identidad de auth-ms', async () => {
      repo.findJugadorById.mockResolvedValue(makeJugador());
      repo.findUsuariosByIds.mockResolvedValue([makeUsuario()]);
      repo.findFisico.mockResolvedValue(makeFisico());
      repo.listPosiciones.mockResolvedValue([
        makePosicion('DELANTERO', true),
        makePosicion('MEDIOCAMPISTA', false),
      ]);
      repo.findAtributos.mockResolvedValue(makeAtributos());
      const useCase = new GetResumenUseCase(repo, access);

      const resumen = await useCase.execute({ jugadorId: JUGADOR_ID });

      expect(resumen.posicionPrincipal).toBe('DELANTERO');
      expect(resumen.posicionesSecundarias).toEqual(['MEDIOCAMPISTA']);
      // Nombre y fecha de nacimiento no se almacenan aquí.
      expect(resumen.nombres).toBe('Juan');
      expect(resumen.fechaNacimiento).toBe('2002-05-15');
      expect(resumen.alturaCm).toBe(178.5);
    });

    it('deja la posición principal en null si el jugador no tiene ninguna', async () => {
      repo.findJugadorById.mockResolvedValue(makeJugador());
      repo.findUsuariosByIds.mockResolvedValue([makeUsuario()]);
      repo.findFisico.mockResolvedValue(null);
      repo.listPosiciones.mockResolvedValue([]);
      repo.findAtributos.mockResolvedValue(null);
      const useCase = new GetResumenUseCase(repo, access);

      const resumen = await useCase.execute({ jugadorId: JUGADOR_ID });

      expect(resumen.posicionPrincipal).toBeNull();
      expect(resumen.posicionesSecundarias).toEqual([]);
      expect(resumen.alturaCm).toBeNull();
    });
  });

  describe('ListEquiposJugadorUseCase', () => {
    let equipos: MockEquiposGateway;

    beforeEach(() => {
      equipos = createMockEquiposGateway();
    });

    it('delega en equipos-ms reenviando el token del propietario', async () => {
      repo.findUsuarioByAuthId.mockResolvedValue(makeUsuario());
      repo.findJugadorById.mockResolvedValue(makeJugador());
      equipos.listEquiposDelUsuario.mockResolvedValue([]);
      const useCase = new ListEquiposJugadorUseCase(access, equipos);

      await useCase.execute({
        authId: AUTH_ID,
        accessToken: 'token-abc',
        jugadorId: JUGADOR_ID,
      });

      expect(equipos.listEquiposDelUsuario).toHaveBeenCalledWith('token-abc');
    });

    it('no consulta equipos-ms si el solicitante no es el propietario', async () => {
      repo.findUsuarioByAuthId.mockResolvedValue(makeUsuario());
      repo.findJugadorById.mockResolvedValue(
        makeJugador({ userId: 'user-9999' }),
      );
      const useCase = new ListEquiposJugadorUseCase(access, equipos);

      await expect(
        useCase.execute({
          authId: AUTH_ID,
          accessToken: 'token-abc',
          jugadorId: JUGADOR_ID,
        }),
      ).rejects.toBeInstanceOf(NotJugadorOwnerError);
      expect(equipos.listEquiposDelUsuario).not.toHaveBeenCalled();
    });
  });
});
