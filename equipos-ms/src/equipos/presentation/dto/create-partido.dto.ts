import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreatePartidoDto {
  @ApiProperty({ example: 'Deportivo Rival' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  rival: string;

  @ApiProperty({
    example: '2026-08-15T18:00:00.000Z',
    description: 'Fecha y hora del partido en formato ISO 8601.',
  })
  @IsDateString()
  fecha: string;

  @ApiPropertyOptional({ example: 'Estadio Municipal' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  ubicacion?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'true si el equipo juega de local.',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  esLocal?: boolean;

  @ApiPropertyOptional({ example: 'Partido de la fecha 3.' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  notas?: string;
}
