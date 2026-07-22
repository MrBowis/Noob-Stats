import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
import {
  ESTADOS_JUGADOR,
  GENEROS,
  PIERNAS_HABILES,
} from '../../domain/catalogos';
import type {
  EstadoJugador,
  Genero,
  PiernaHabil,
} from '../../domain/catalogos';

/**
 * El propietario del perfil sale del token: no existe un campo `userId` que el
 * cliente pueda enviar.
 */
export class CreateJugadorDto {
  @ApiPropertyOptional({ enum: GENEROS })
  @IsOptional()
  @IsIn(GENEROS)
  genero?: Genero;

  @ApiPropertyOptional({ example: 'Ecuatoriana', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  nacionalidad?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/foto.png' })
  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  fotoUrl?: string;

  @ApiPropertyOptional({ enum: PIERNAS_HABILES })
  @IsOptional()
  @IsIn(PIERNAS_HABILES)
  piernaHabil?: PiernaHabil;

  @ApiPropertyOptional({ enum: ESTADOS_JUGADOR, default: 'ACTIVO' })
  @IsOptional()
  @IsIn(ESTADOS_JUGADOR)
  estado?: EstadoJugador;
}
