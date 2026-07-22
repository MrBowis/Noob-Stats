import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class GoogleCallbackDto {
  @ApiProperty({
    description:
      'Access token de Supabase obtenido tras el flujo OAuth de Google.',
  })
  @IsString()
  @MinLength(1)
  accessToken: string;

  @ApiPropertyOptional({
    enum: ['Futbolista', 'Entrenador', 'Administrador'],
    default: 'Futbolista',
    description:
      'Rol con el que se aprovisiona el usuario si es su primer ingreso con Google. Se ignora si el usuario ya existe.',
  })
  @IsOptional()
  @IsIn(['Futbolista', 'Entrenador', 'Administrador'])
  rolNombre?: string;
}
