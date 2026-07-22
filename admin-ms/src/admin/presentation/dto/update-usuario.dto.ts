import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class UpdateUsuarioDto {
  @ApiPropertyOptional({ example: 'Juan' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  nombres?: string;

  @ApiPropertyOptional({ example: 'Pérez' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  apellidos?: string;

  @ApiPropertyOptional({ example: 'contacto@example.com' })
  @IsOptional()
  @IsEmail()
  correo?: string;

  @ApiPropertyOptional({ example: '2000-01-01', format: 'date' })
  @IsOptional()
  @IsDateString()
  fechaNacimiento?: string;

  @ApiPropertyOptional({
    example: 'Entrenador',
    description: 'Nombre de un rol existente para reasignar al usuario.',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  rolNombre?: string;

  @ApiPropertyOptional({ enum: ['activo', 'inactivo'] })
  @IsOptional()
  @IsIn(['activo', 'inactivo'])
  estado?: string;
}
