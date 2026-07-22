import { Injectable } from '@nestjs/common';
import { EstadisticasEquipo } from '../domain/entities/estadisticas-equipo.entity';
import { Partido } from '../domain/entities/partido.entity';
import { EquiposRepository } from '../domain/repositories/equipos.repository';
import { EquipoAccessService } from './equipo-access.service';

export interface GetEstadisticasInput {
  authId: string;
  equipoId: string;
}

@Injectable()
export class GetEstadisticasUseCase {
  constructor(
    private readonly repo: EquiposRepository,
    private readonly access: EquipoAccessService,
  ) {}

  async execute(input: GetEstadisticasInput): Promise<EstadisticasEquipo> {
    const usuario = await this.access.resolverUsuario(input.authId);
    const equipo = await this.access.requireEquipo(input.equipoId);
    await this.access.requireAccess(equipo, usuario);

    const [totalMiembros, partidos] = await Promise.all([
      this.repo.countMiembros(input.equipoId),
      this.repo.listPartidosByEquipo(input.equipoId, 'todos'),
    ]);

    return this.calcular(input.equipoId, totalMiembros, partidos);
  }

  private calcular(
    equipoId: string,
    totalMiembros: number,
    partidos: Partido[],
  ): EstadisticasEquipo {
    let victorias = 0;
    let empates = 0;
    let derrotas = 0;
    let golesFavor = 0;
    let golesContra = 0;

    const finalizados = partidos.filter(
      (p) =>
        p.estado === 'finalizado' &&
        p.golesFavor !== null &&
        p.golesContra !== null,
    );

    for (const p of finalizados) {
      const gf = p.golesFavor ?? 0;
      const gc = p.golesContra ?? 0;
      golesFavor += gf;
      golesContra += gc;
      if (gf > gc) victorias++;
      else if (gf === gc) empates++;
      else derrotas++;
    }

    const ahora = Date.now();
    const programados = partidos.filter((p) => p.estado === 'programado');
    const futuros = programados
      .filter((p) => new Date(p.fecha).getTime() >= ahora)
      .sort((a, b) => a.fecha.localeCompare(b.fecha));

    return {
      equipoId,
      totalMiembros,
      partidosJugados: finalizados.length,
      victorias,
      empates,
      derrotas,
      golesFavor,
      golesContra,
      diferenciaGoles: golesFavor - golesContra,
      puntos: victorias * 3 + empates,
      partidosProgramados: programados.length,
      proximoPartido: futuros[0] ?? null,
    };
  }
}
