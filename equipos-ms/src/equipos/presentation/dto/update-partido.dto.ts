import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdatePartidoDto {
  @ApiPropertyOptional({ example: 'Deportivo Rival' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  rival?: string;

  @ApiPropertyOptional({ example: '2026-08-15T18:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  fecha?: string;

  @ApiPropertyOptional({ example: 'Estadio Municipal' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  ubicacion?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  esLocal?: boolean;

  @ApiPropertyOptional({
    enum: ['programado', 'finalizado', 'cancelado'],
    description: 'Cambia a "finalizado" al registrar el resultado del partido.',
  })
  @IsOptional()
  @IsIn(['programado', 'finalizado', 'cancelado'])
  estado?: string;

  @ApiPropertyOptional({ example: 2, minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  golesFavor?: number;

  @ApiPropertyOptional({ example: 1, minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  golesContra?: number;

  @ApiPropertyOptional({ example: 'Gran remontada en el segundo tiempo.' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  notas?: string;
}
