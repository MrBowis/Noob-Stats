import { Injectable } from '@nestjs/common';
import {
  EstadisticasAdmin,
  PosicionEquipo,
} from '../domain/entities/estadisticas.entity';
import { AdminRepository } from '../domain/repositories/admin.repository';
import { AdminAccessService } from './admin-access.service';

const ESTADO_ACTIVO = 'activo';
const ESTADO_INACTIVO = 'inactivo';

@Injectable()
export class GetEstadisticasUseCase {
  constructor(
    private readonly repo: AdminRepository,
    private readonly access: AdminAccessService,
  ) {}

  async execute(input: { authId: string }): Promise<EstadisticasAdmin> {
    await this.access.requireAdmin(input.authId);

    const [total, activos, inactivos, totalEquipos, equipos, partidos] =
      await Promise.all([
        this.repo.countUsuarios(),
        this.repo.countUsuarios(ESTADO_ACTIVO),
        this.repo.countUsuarios(ESTADO_INACTIVO),
        this.repo.countEquipos(),
        this.repo.listEquiposResumen(),
        this.repo.listPartidosFinalizados(),
      ]);

    // Inicializa una fila por equipo para incluir también a los que no han jugado.
    const filas = new Map<string, PosicionEquipo>();
    for (const equipo of equipos) {
      filas.set(equipo.id, {
        equipoId: equipo.id,
        nombre: equipo.nombre,
        partidosJugados: 0,
        victorias: 0,
        empates: 0,
        derrotas: 0,
        golesFavor: 0,
        golesContra: 0,
        diferenciaGoles: 0,
        puntos: 0,
      });
    }

    for (const partido of partidos) {
      const fila = filas.get(partido.equipoId);
      if (!fila) continue;
      fila.partidosJugados += 1;
      fila.golesFavor += partido.golesFavor;
      fila.golesContra += partido.golesContra;
      if (partido.golesFavor > partido.golesContra) {
        fila.victorias += 1;
      } else if (partido.golesFavor === partido.golesContra) {
        fila.empates += 1;
      } else {
        fila.derrotas += 1;
      }
    }

    const tablaPosiciones = [...filas.values()]
      .map((fila) => ({
        ...fila,
        diferenciaGoles: fila.golesFavor - fila.golesContra,
        puntos: fila.victorias * 3 + fila.empates,
      }))
      .sort(
        (a, b) =>
          b.puntos - a.puntos ||
          b.diferenciaGoles - a.diferenciaGoles ||
          b.golesFavor - a.golesFavor ||
          a.nombre.localeCompare(b.nombre),
      );

    return {
      usuarios: { total, activos, inactivos },
      equipos: { total: totalEquipos },
      tablaPosiciones,
    };
  }
}
