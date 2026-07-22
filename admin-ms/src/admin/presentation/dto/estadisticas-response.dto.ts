import { ApiProperty } from '@nestjs/swagger';

export class UsuariosStatsDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  activos: number;

  @ApiProperty()
  inactivos: number;
}

export class EquiposStatsDto {
  @ApiProperty()
  total: number;
}

export class PosicionEquipoDto {
  @ApiProperty()
  equipoId: string;

  @ApiProperty()
  nombre: string;

  @ApiProperty()
  partidosJugados: number;

  @ApiProperty()
  victorias: number;

  @ApiProperty()
  empates: number;

  @ApiProperty()
  derrotas: number;

  @ApiProperty()
  golesFavor: number;

  @ApiProperty()
  golesContra: number;

  @ApiProperty()
  diferenciaGoles: number;

  @ApiProperty()
  puntos: number;
}

export class EstadisticasAdminResponseDto {
  @ApiProperty({ type: UsuariosStatsDto })
  usuarios: UsuariosStatsDto;

  @ApiProperty({ type: EquiposStatsDto })
  equipos: EquiposStatsDto;

  @ApiProperty({ type: PosicionEquipoDto, isArray: true })
  tablaPosiciones: PosicionEquipoDto[];
}
