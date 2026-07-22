import { ApiProperty } from '@nestjs/swagger';

export class PartidoResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  equipoId: string;

  @ApiProperty()
  rival: string;

  @ApiProperty()
  fecha: string;

  @ApiProperty({ nullable: true })
  ubicacion: string | null;

  @ApiProperty()
  esLocal: boolean;

  @ApiProperty({ enum: ['programado', 'finalizado', 'cancelado'] })
  estado: string;

  @ApiProperty({ nullable: true })
  golesFavor: number | null;

  @ApiProperty({ nullable: true })
  golesContra: number | null;

  @ApiProperty({ nullable: true })
  notas: string | null;

  @ApiProperty()
  createdAt: string;
}

export class GolResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  partidoId: string;

  @ApiProperty({ nullable: true })
  usuarioId: string | null;

  @ApiProperty({ nullable: true })
  jugadorNombres: string | null;

  @ApiProperty({ nullable: true })
  jugadorApellidos: string | null;

  @ApiProperty({ nullable: true })
  minuto: number | null;
}

export class TarjetaResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  partidoId: string;

  @ApiProperty({ nullable: true })
  usuarioId: string | null;

  @ApiProperty({ nullable: true })
  jugadorNombres: string | null;

  @ApiProperty({ nullable: true })
  jugadorApellidos: string | null;

  @ApiProperty({ enum: ['amarilla', 'roja'] })
  tipo: string;

  @ApiProperty({ nullable: true })
  minuto: number | null;
}

export class PartidoDetalleResponseDto extends PartidoResponseDto {
  @ApiProperty({ type: GolResponseDto, isArray: true })
  goles: GolResponseDto[];

  @ApiProperty({ type: TarjetaResponseDto, isArray: true })
  tarjetas: TarjetaResponseDto[];
}
