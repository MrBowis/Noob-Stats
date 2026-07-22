import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Max, Min } from 'class-validator';
import { ATRIBUTO_MAX, ATRIBUTO_MIN } from '../../domain/catalogos';

/**
 * Valoración del perfil para el pentágono. No son goles, asistencias, minutos
 * ni tarjetas: esas estadísticas las administra `equipos-ms`.
 */
export class UpdateAtributosDto {
  @ApiProperty({ example: 82, minimum: ATRIBUTO_MIN, maximum: ATRIBUTO_MAX })
  @IsInt()
  @Min(ATRIBUTO_MIN)
  @Max(ATRIBUTO_MAX)
  ataque!: number;

  @ApiProperty({ example: 70, minimum: ATRIBUTO_MIN, maximum: ATRIBUTO_MAX })
  @IsInt()
  @Min(ATRIBUTO_MIN)
  @Max(ATRIBUTO_MAX)
  tactica!: number;

  @ApiProperty({ example: 88, minimum: ATRIBUTO_MIN, maximum: ATRIBUTO_MAX })
  @IsInt()
  @Min(ATRIBUTO_MIN)
  @Max(ATRIBUTO_MAX)
  tecnica!: number;

  @ApiProperty({ example: 45, minimum: ATRIBUTO_MIN, maximum: ATRIBUTO_MAX })
  @IsInt()
  @Min(ATRIBUTO_MIN)
  @Max(ATRIBUTO_MAX)
  defensa!: number;

  @ApiProperty({ example: 91, minimum: ATRIBUTO_MIN, maximum: ATRIBUTO_MAX })
  @IsInt()
  @Min(ATRIBUTO_MIN)
  @Max(ATRIBUTO_MAX)
  creatividad!: number;
}
