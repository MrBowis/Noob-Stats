import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateRolDto {
  @ApiPropertyOptional({ example: 'Arbitro', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  nombreRol?: string;

  @ApiPropertyOptional({ example: 'Gestiona el arbitraje de los partidos' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  descripcion?: string;
}
