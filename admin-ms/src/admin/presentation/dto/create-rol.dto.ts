import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateRolDto {
  @ApiProperty({ example: 'Arbitro', maxLength: 50 })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  nombreRol: string;

  @ApiPropertyOptional({ example: 'Gestiona el arbitraje de los partidos' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  descripcion?: string;
}
