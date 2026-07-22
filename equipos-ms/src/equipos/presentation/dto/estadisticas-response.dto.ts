import { ApiProperty } from '@nestjs/swagger';
import { PartidoResponseDto } from './partido-response.dto';

export class EstadisticasEquipoResponseDto {
  @ApiProperty()
  equipoId: string;

  @ApiProperty()
  totalMiembros: number;

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

  @ApiProperty({ description: 'Puntos: 3 por victoria, 1 por empate.' })
  puntos: number;

  @ApiProperty()
  partidosProgramados: number;

  @ApiProperty({ type: PartidoResponseDto, nullable: true })
  proximoPartido: PartidoResponseDto | null;
}
