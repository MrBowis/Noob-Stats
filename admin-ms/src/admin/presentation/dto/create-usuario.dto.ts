import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateUsuarioDto {
  @ApiProperty({ example: 'nuevo@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Juan' })
  @IsString()
  @MinLength(1)
  nombres: string;

  @ApiProperty({ example: 'Pérez' })
  @IsString()
  @MinLength(1)
  apellidos: string;

  @ApiProperty({
    example: 'Futbolista',
    description: 'Nombre de un rol existente.',
  })
  @IsString()
  @MinLength(1)
  rolNombre: string;

  @ApiPropertyOptional({ example: 'contacto@example.com' })
  @IsOptional()
  @IsEmail()
  correo?: string;

  @ApiPropertyOptional({ example: '2000-01-01', format: 'date' })
  @IsOptional()
  @IsDateString()
  fechaNacimiento?: string;
}
