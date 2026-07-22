import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'usuario@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ minLength: 6, example: 'password123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'Juan' })
  @IsString()
  @MinLength(1)
  nombres: string;

  @ApiProperty({ example: 'Pérez' })
  @IsString()
  @MinLength(1)
  apellidos: string;

  @ApiPropertyOptional({ example: '2000-01-01', format: 'date' })
  @IsOptional()
  @IsDateString()
  fechaNacimiento?: string;

  @ApiPropertyOptional({
    enum: ['Futbolista', 'Entrenador', 'Administrador'],
    default: 'Futbolista',
  })
  @IsOptional()
  @IsIn(['Futbolista', 'Entrenador', 'Administrador'])
  rolNombre?: string;
}
