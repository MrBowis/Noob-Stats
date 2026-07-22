import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateEquipoDto {
  @ApiProperty({ example: 'Real Noob FC' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  nombre: string;

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
}
