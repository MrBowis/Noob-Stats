import { AdminAccessService } from './admin-access.service';
import { GetEstadisticasUseCase } from './get-estadisticas.use-case';
import {
  AUTH_ID,
  createMockAdminRepository,
  makeAdminDetalle,
  MockAdminRepository,
} from './__mocks__/admin-repository.mock';

describe('GetEstadisticasUseCase', () => {
  let repo: MockAdminRepository;
  let useCase: GetEstadisticasUseCase;

  beforeEach(() => {
    repo = createMockAdminRepository();
    useCase = new GetEstadisticasUseCase(repo, new AdminAccessService(repo));
    repo.findUsuarioDetalleByAuthId.mockResolvedValue(makeAdminDetalle());
  });

  it('agrega usuarios y equipos, incluidos los que no han jugado', async () => {
    repo.countUsuarios.mockImplementation((estado?: string) =>
      Promise.resolve(estado === 'activo' ? 8 : estado === 'inactivo' ? 2 : 10),
    );
    repo.countEquipos.mockResolvedValue(2);
    repo.listEquiposResumen.mockResolvedValue([
      { id: 'eq-1', nombre: 'Noob FC' },
      { id: 'eq-2', nombre: 'Sin partidos FC' },
    ]);
    repo.listPartidosFinalizados.mockResolvedValue([
      { equipoId: 'eq-1', golesFavor: 3, golesContra: 1 },
    ]);

    const stats = await useCase.execute({ authId: AUTH_ID });

    expect(stats.usuarios).toEqual({ total: 10, activos: 8, inactivos: 2 });
    expect(stats.equipos).toEqual({ total: 2 });
    expect(stats.tablaPosiciones).toHaveLength(2);
    const sinPartidos = stats.tablaPosiciones.find(
      (p) => p.equipoId === 'eq-2',
    );
    expect(sinPartidos).toMatchObject({ partidosJugados: 0, puntos: 0 });
  });

  it('calcula victorias/empates/derrotas y ordena por puntos', async () => {
    repo.countUsuarios.mockResolvedValue(0);
    repo.countEquipos.mockResolvedValue(2);
    repo.listEquiposResumen.mockResolvedValue([
      { id: 'eq-1', nombre: 'Perdedor FC' },
      { id: 'eq-2', nombre: 'Ganador FC' },
    ]);
    repo.listPartidosFinalizados.mockResolvedValue([
      { equipoId: 'eq-1', golesFavor: 0, golesContra: 2 }, // derrota
      { equipoId: 'eq-2', golesFavor: 2, golesContra: 0 }, // victoria
      { equipoId: 'eq-2', golesFavor: 1, golesContra: 1 }, // empate
    ]);

    const stats = await useCase.execute({ authId: AUTH_ID });

    expect(stats.tablaPosiciones[0]).toMatchObject({
      equipoId: 'eq-2',
      victorias: 1,
      empates: 1,
      derrotas: 0,
      puntos: 4,
    });
    expect(stats.tablaPosiciones[1]).toMatchObject({
      equipoId: 'eq-1',
      derrotas: 1,
      puntos: 0,
    });
  });

  it('ignora partidos de equipos que ya no existen', async () => {
    repo.countUsuarios.mockResolvedValue(0);
    repo.countEquipos.mockResolvedValue(0);
    repo.listEquiposResumen.mockResolvedValue([]);
    repo.listPartidosFinalizados.mockResolvedValue([
      { equipoId: 'eq-eliminado', golesFavor: 1, golesContra: 0 },
    ]);

    const stats = await useCase.execute({ authId: AUTH_ID });

    expect(stats.tablaPosiciones).toEqual([]);
  });

  it('desempata por diferencia de goles, luego goles a favor, luego nombre', async () => {
    repo.countUsuarios.mockResolvedValue(0);
    repo.countEquipos.mockResolvedValue(2);
    repo.listEquiposResumen.mockResolvedValue([
      { id: 'eq-1', nombre: 'Zeta FC' },
      { id: 'eq-2', nombre: 'Alfa FC' },
    ]);
    repo.listPartidosFinalizados.mockResolvedValue([
      { equipoId: 'eq-1', golesFavor: 3, golesContra: 1 }, // dif +2
      { equipoId: 'eq-2', golesFavor: 2, golesContra: 0 }, // dif +2, mismos puntos
    ]);

    const stats = await useCase.execute({ authId: AUTH_ID });

    // Ambos con 3 puntos y +2 de diferencia: desempata por goles a favor (3 > 2).
    expect(stats.tablaPosiciones[0].equipoId).toBe('eq-1');
  });
});
