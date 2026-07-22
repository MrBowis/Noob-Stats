import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';
import type { Formacion } from '../../domain/formations';
import { FORMACIONES } from '../../domain/formations';

export class UpdateEquipoDto {
  @ApiPropertyOptional({ example: 'Real Noob FC' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  nombre?: string;

  @ApiPropertyOptional({ example: 'Equipo amateur de la liga local' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  descripcion?: string;

  @ApiPropertyOptional({ example: 'Sub-20' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  categoria?: string;

  @ApiPropertyOptional({ example: 'Quito' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  ciudad?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/escudo.png' })
  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  escudoUrl?: string;

  @ApiPropertyOptional({
    enum: FORMACIONES,
    example: '4-4-2',
    description: 'Formación táctica del equipo.',
  })
  @IsOptional()
  @IsIn(FORMACIONES)
  formacion?: Formacion;
}
