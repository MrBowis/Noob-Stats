import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ESTADOS_LESION, PARTES_CUERPO } from '../../domain/catalogos';
import type { EstadoLesion, ParteCuerpo } from '../../domain/catalogos';

/**
 * Alcance médico limitado: parte del cuerpo, estado, fechas y una nota breve.
 * Sin diagnósticos, tratamientos ni observaciones médicas.
 */
export class CreateLesionDto {
  @ApiProperty({ enum: PARTES_CUERPO, example: 'TOBILLO' })
  @IsIn(PARTES_CUERPO)
  parteCuerpo!: ParteCuerpo;

  @ApiProperty({ example: 'Esguince de tobillo', maxLength: 500 })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  nota!: string;

  @ApiProperty({ example: '2026-05-15', format: 'date' })
  @IsDateString()
  fechaInicio!: string;

  @ApiPropertyOptional({ example: '2026-06-01', format: 'date' })
  @IsOptional()
  @IsDateString()
  fechaFin?: string;

  @ApiPropertyOptional({ enum: ESTADOS_LESION, default: 'ACTIVA' })
  @IsOptional()
  @IsIn(ESTADOS_LESION)
  estado?: EstadoLesion;
}

export class UpdateLesionDto extends PartialType(CreateLesionDto) {}
