import { Partido } from '../domain/entities/partido.entity';
import { ForbiddenEquipoAccessError } from '../domain/exceptions/equipos.errors';
import {
  createMockEquiposRepository,
  makeEntrenador,
  makeEquipo,
  makeJugador,
  makePartido,
  MockEquiposRepository,
} from './__mocks__/equipos-repository.mock';
import { EquipoAccessService } from './equipo-access.service';
import { GetEstadisticasUseCase } from './get-estadisticas.use-case';

const AHORA = new Date('2026-07-15T00:00:00.000Z');

function partido(overrides: Partial<Partido>): Partido {
  return makePartido({ id: `p-${Math.random()}`, ...overrides });
}

describe('GetEstadisticasUseCase', () => {
  let repo: MockEquiposRepository;
  let useCase: GetEstadisticasUseCase;

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(AHORA);
    repo = createMockEquiposRepository();
    useCase = new GetEstadisticasUseCase(repo, new EquipoAccessService(repo));
    repo.findEquipoById.mockResolvedValue(makeEquipo());
    repo.findUsuarioByAuthId.mockResolvedValue(makeEntrenador());
    repo.countMiembros.mockResolvedValue(14);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('calcula victorias, empates, derrotas, goles y puntos de los finalizados', async () => {
    repo.listPartidosByEquipo.mockResolvedValue([
      partido({ estado: 'finalizado', golesFavor: 3, golesContra: 1 }), // victoria
      partido({ estado: 'finalizado', golesFavor: 1, golesContra: 1 }), // empate
      partido({ estado: 'finalizado', golesFavor: 0, golesContra: 2 }), // derrota
      partido({ estado: 'cancelado', golesFavor: null, golesContra: null }),
    ]);

    const stats = await useCase.execute({
      authId: 'auth-0001',
      equipoId: 'equipo-0001',
    });

    expect(stats).toMatchObject({
      totalMiembros: 14,
      partidosJugados: 3,
      victorias: 1,
      empates: 1,
      derrotas: 1,
      golesFavor: 4,
      golesContra: 4,
      diferenciaGoles: 0,
      puntos: 4, // 1*3 + 1
    });
  });

  it('elige como próximo partido el programado futuro más cercano', async () => {
    repo.listPartidosByEquipo.mockResolvedValue([
      partido({
        estado: 'programado',
        fecha: '2026-08-01T00:00:00.000Z',
        rival: 'Lejano',
      }),
      partido({
        estado: 'programado',
        fecha: '2026-07-20T00:00:00.000Z',
        rival: 'Cercano',
      }),
      partido({
        estado: 'programado',
        fecha: '2026-01-01T00:00:00.000Z', // ya pasó
        rival: 'Pasado',
      }),
    ]);

    const stats = await useCase.execute({
      authId: 'auth-0001',
      equipoId: 'equipo-0001',
    });

    expect(stats.partidosProgramados).toBe(3);
    expect(stats.proximoPartido?.rival).toBe('Cercano');
  });

  it('devuelve null como próximo partido si no hay programados futuros', async () => {
    repo.listPartidosByEquipo.mockResolvedValue([]);

    const stats = await useCase.execute({
      authId: 'auth-0001',
      equipoId: 'equipo-0001',
    });

    expect(stats.proximoPartido).toBeNull();
    expect(stats.partidosJugados).toBe(0);
    expect(stats.puntos).toBe(0);
  });

  it('rechaza a quien no tiene acceso al equipo', async () => {
    repo.findUsuarioByAuthId.mockResolvedValue(makeJugador());
    repo.findMiembro.mockResolvedValue(null);

    await expect(
      useCase.execute({ authId: 'auth-x', equipoId: 'equipo-0001' }),
    ).rejects.toBeInstanceOf(ForbiddenEquipoAccessError);
  });
});
