import {
  InvalidLesionFechasError,
  LesionNotFoundError,
  PosicionAlreadyExistsError,
  PosicionNotFoundError,
} from '../domain/exceptions/jugadores.errors';
import {
  AUTH_ID,
  JUGADOR_ID,
  MockJugadoresRepository,
  createMockJugadoresRepository,
  makeJugador,
  makeLesion,
  makePosicion,
  makeUsuario,
} from './__mocks__/jugadores-repository.mock';
import { AddPosicionUseCase } from './add-posicion.use-case';
import { CreateLesionUseCase } from './create-lesion.use-case';
import { DeleteLesionUseCase } from './delete-lesion.use-case';
import { DeletePosicionUseCase } from './delete-posicion.use-case';
import { JugadorAccessService } from './jugador-access.service';
import { ListLesionesUseCase } from './list-lesiones.use-case';
import { UpdateLesionUseCase } from './update-lesion.use-case';
import { UpdatePosicionUseCase } from './update-posicion.use-case';

describe('Posiciones y lesiones', () => {
  let repo: MockJugadoresRepository;
  let access: JugadorAccessService;

  beforeEach(() => {
    repo = createMockJugadoresRepository();
    access = new JugadorAccessService(repo);
    // Por defecto, el solicitante es el propietario del perfil.
    repo.findUsuarioByAuthId.mockResolvedValue(makeUsuario());
    repo.findJugadorById.mockResolvedValue(makeJugador());
  });

  describe('AddPosicionUseCase', () => {
    let useCase: AddPosicionUseCase;

    beforeEach(() => {
      useCase = new AddPosicionUseCase(repo, access);
      repo.createPosicion.mockResolvedValue(makePosicion('PORTERO', true));
    });

    it('marca la primera posición como principal', async () => {
      repo.listPosiciones.mockResolvedValue([]);

      await useCase.execute({
        authId: AUTH_ID,
        jugadorId: JUGADOR_ID,
        posicion: 'PORTERO',
      });

      expect(repo.createPosicion).toHaveBeenCalledWith({
        jugadorId: JUGADOR_ID,
        posicion: 'PORTERO',
        esPrincipal: true,
      });
    });

    it('añade como secundaria cuando ya existe otra posición', async () => {
      repo.listPosiciones.mockResolvedValue([makePosicion('PORTERO', true)]);

      await useCase.execute({
        authId: AUTH_ID,
        jugadorId: JUGADOR_ID,
        posicion: 'DEFENSA',
      });

      expect(repo.createPosicion).toHaveBeenCalledWith(
        expect.objectContaining({ esPrincipal: false }),
      );
      expect(repo.clearPosicionPrincipal).not.toHaveBeenCalled();
    });

    it('degrada la principal anterior al marcar una nueva', async () => {
      repo.listPosiciones.mockResolvedValue([makePosicion('PORTERO', true)]);

      await useCase.execute({
        authId: AUTH_ID,
        jugadorId: JUGADOR_ID,
        posicion: 'DELANTERO',
        esPrincipal: true,
      });

      expect(repo.clearPosicionPrincipal).toHaveBeenCalledWith(JUGADOR_ID);
    });

    it('rechaza una posición duplicada', async () => {
      repo.listPosiciones.mockResolvedValue([makePosicion('PORTERO', true)]);

      await expect(
        useCase.execute({
          authId: AUTH_ID,
          jugadorId: JUGADOR_ID,
          posicion: 'PORTERO',
        }),
      ).rejects.toBeInstanceOf(PosicionAlreadyExistsError);
    });
  });

  describe('UpdatePosicionUseCase', () => {
    let useCase: UpdatePosicionUseCase;

    beforeEach(() => {
      useCase = new UpdatePosicionUseCase(repo, access);
    });

    it('rechaza una posición que pertenece a otro jugador', async () => {
      repo.findPosicionById.mockResolvedValue({
        ...makePosicion('DEFENSA', false),
        jugadorId: 'jugador-9999',
      });

      await expect(
        useCase.execute({
          authId: AUTH_ID,
          jugadorId: JUGADOR_ID,
          posicionId: 'pos-DEFENSA',
          esPrincipal: true,
        }),
      ).rejects.toBeInstanceOf(PosicionNotFoundError);
    });

    it('libera la principal anterior sin tocar la que se está editando', async () => {
      repo.findPosicionById.mockResolvedValue(makePosicion('DEFENSA', false));
      repo.updatePosicion.mockResolvedValue(makePosicion('DEFENSA', true));

      await useCase.execute({
        authId: AUTH_ID,
        jugadorId: JUGADOR_ID,
        posicionId: 'pos-DEFENSA',
        esPrincipal: true,
      });

      expect(repo.clearPosicionPrincipal).toHaveBeenCalledWith(
        JUGADOR_ID,
        'pos-DEFENSA',
      );
    });
  });

  describe('DeletePosicionUseCase', () => {
    it('no borra una posición de otro jugador', async () => {
      repo.findPosicionById.mockResolvedValue({
        ...makePosicion('DEFENSA', false),
        jugadorId: 'jugador-9999',
      });
      const useCase = new DeletePosicionUseCase(repo, access);

      await expect(
        useCase.execute({
          authId: AUTH_ID,
          jugadorId: JUGADOR_ID,
          posicionId: 'pos-DEFENSA',
        }),
      ).rejects.toBeInstanceOf(PosicionNotFoundError);
      expect(repo.deletePosicion).not.toHaveBeenCalled();
    });
  });

  describe('CreateLesionUseCase', () => {
    it('rechaza una fecha de fin anterior a la de inicio', async () => {
      const useCase = new CreateLesionUseCase(repo, access);

      await expect(
        useCase.execute({
          authId: AUTH_ID,
          jugadorId: JUGADOR_ID,
          parteCuerpo: 'TOBILLO',
          nota: 'Esguince de tobillo',
          fechaInicio: '2026-05-15',
          fechaFin: '2026-05-01',
        }),
      ).rejects.toBeInstanceOf(InvalidLesionFechasError);
      expect(repo.createLesion).not.toHaveBeenCalled();
    });

    it('registra la lesión del propietario', async () => {
      repo.createLesion.mockResolvedValue(makeLesion());
      const useCase = new CreateLesionUseCase(repo, access);

      await useCase.execute({
        authId: AUTH_ID,
        jugadorId: JUGADOR_ID,
        parteCuerpo: 'TOBILLO',
        nota: 'Esguince de tobillo',
        fechaInicio: '2026-05-15',
      });

      expect(repo.createLesion).toHaveBeenCalledWith(
        expect.objectContaining({
          jugadorId: JUGADOR_ID,
          nota: 'Esguince de tobillo',
        }),
      );
    });
  });

  describe('UpdateLesionUseCase', () => {
    let useCase: UpdateLesionUseCase;

    beforeEach(() => {
      useCase = new UpdateLesionUseCase(repo, access);
    });

    it('valida las fechas contra el estado resultante, no sólo contra lo enviado', async () => {
      repo.findLesionById.mockResolvedValue(
        makeLesion({ fechaInicio: '2026-05-15' }),
      );

      await expect(
        useCase.execute({
          authId: AUTH_ID,
          jugadorId: JUGADOR_ID,
          lesionId: 'lesion-0001',
          fechaFin: '2026-05-01',
        }),
      ).rejects.toBeInstanceOf(InvalidLesionFechasError);
    });

    it('permite cerrar la lesión con una fecha posterior', async () => {
      repo.findLesionById.mockResolvedValue(makeLesion());
      repo.updateLesion.mockResolvedValue(
        makeLesion({ fechaFin: '2026-06-01', estado: 'RECUPERADA' }),
      );

      await useCase.execute({
        authId: AUTH_ID,
        jugadorId: JUGADOR_ID,
        lesionId: 'lesion-0001',
        fechaFin: '2026-06-01',
        estado: 'RECUPERADA',
      });

      expect(repo.updateLesion).toHaveBeenCalledWith(
        'lesion-0001',
        expect.objectContaining({ fechaFin: '2026-06-01' }),
      );
    });

    it('rechaza una lesión de otro jugador', async () => {
      repo.findLesionById.mockResolvedValue(
        makeLesion({ jugadorId: 'jugador-9999' }),
      );

      await expect(
        useCase.execute({
          authId: AUTH_ID,
          jugadorId: JUGADOR_ID,
          lesionId: 'lesion-0001',
          nota: 'Otra cosa',
        }),
      ).rejects.toBeInstanceOf(LesionNotFoundError);
    });
  });

  describe('DeleteLesionUseCase', () => {
    it('borra la lesión propia', async () => {
      repo.findLesionById.mockResolvedValue(makeLesion());
      const useCase = new DeleteLesionUseCase(repo, access);

      await useCase.execute({
        authId: AUTH_ID,
        jugadorId: JUGADOR_ID,
        lesionId: 'lesion-0001',
      });

      expect(repo.deleteLesion).toHaveBeenCalledWith('lesion-0001');
    });
  });

  describe('ListLesionesUseCase', () => {
    it('filtra el historial por estado', async () => {
      repo.listLesiones.mockResolvedValue([
        makeLesion({ id: 'l1', estado: 'ACTIVA' }),
        makeLesion({ id: 'l2', estado: 'RECUPERADA' }),
      ]);
      const useCase = new ListLesionesUseCase(repo, access);

      const lesiones = await useCase.execute({
        jugadorId: JUGADOR_ID,
        estado: 'RECUPERADA',
      });

      expect(lesiones.map((l) => l.id)).toEqual(['l2']);
    });
  });
});
