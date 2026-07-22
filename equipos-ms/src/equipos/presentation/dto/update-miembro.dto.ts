import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

export class UpdateMiembroDto {
  @ApiPropertyOptional({ example: 10, minimum: 0, maximum: 999 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(999)
  dorsal?: number;

  @ApiPropertyOptional({ example: 'Delantero' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  posicion?: string;

  @ApiPropertyOptional({
    example: 'DCL',
    nullable: true,
    description:
      'Casilla táctica dentro de la formación del equipo. Envía null para dejar al jugador en la banca.',
  })
  @IsOptional()
  @ValidateIf((_o, value) => value !== null)
  @IsString()
  @MaxLength(10)
  slot?: string | null;

  @ApiPropertyOptional({ enum: ['activo', 'inactivo'], example: 'activo' })
  @IsOptional()
  @IsIn(['activo', 'inactivo'])
  estado?: string;
}
