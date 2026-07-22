import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ESTADOS_JUGADOR,
  ESTADOS_LESION,
  GENEROS,
  PARTES_CUERPO,
  PIERNAS_HABILES,
  POSICIONES,
} from '../../domain/catalogos';
import type {
  EstadoJugador,
  EstadoLesion,
  Genero,
  ParteCuerpo,
  PiernaHabil,
  Posicion,
} from '../../domain/catalogos';

export class JugadorResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid', description: 'Usuario propietario (auth-ms)' })
  userId!: string;

  @ApiPropertyOptional({ enum: GENEROS, nullable: true })
  genero!: Genero | null;

  @ApiPropertyOptional({ nullable: true })
  nacionalidad!: string | null;

  @ApiPropertyOptional({ nullable: true })
  fotoUrl!: string | null;

  @ApiPropertyOptional({ enum: PIERNAS_HABILES, nullable: true })
  piernaHabil!: PiernaHabil | null;

  @ApiProperty({ enum: ESTADOS_JUGADOR })
  estado!: EstadoJugador;

  @ApiProperty()
  fechaCreacion!: string;

  @ApiProperty()
  fechaActualizacion!: string;
}

export class JugadorFisicoResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  jugadorId!: string;

  @ApiPropertyOptional({ example: 178.5, nullable: true })
  alturaCm!: number | null;

  @ApiPropertyOptional({ example: 72, nullable: true })
  pesoKg!: number | null;

  @ApiProperty()
  fechaActualizacion!: string;
}

export class JugadorPosicionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  jugadorId!: string;

  @ApiProperty({ enum: POSICIONES })
  posicion!: Posicion;

  @ApiProperty()
  esPrincipal!: boolean;
}

export class JugadorAtributoResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  jugadorId!: string;

  @ApiProperty({ example: 82 })
  ataque!: number;

  @ApiProperty({ example: 70 })
  tactica!: number;

  @ApiProperty({ example: 88 })
  tecnica!: number;

  @ApiProperty({ example: 45 })
  defensa!: number;

  @ApiProperty({ example: 91 })
  creatividad!: number;

  @ApiProperty()
  fechaActualizacion!: string;
}

export class JugadorLesionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  jugadorId!: string;

  @ApiProperty({ enum: PARTES_CUERPO })
  parteCuerpo!: ParteCuerpo;

  @ApiProperty({ example: 'Esguince de tobillo' })
  nota!: string;

  @ApiProperty({ example: '2026-05-15' })
  fechaInicio!: string;

  @ApiPropertyOptional({ example: '2026-06-01', nullable: true })
  fechaFin!: string | null;

  @ApiProperty({ enum: ESTADOS_LESION })
  estado!: EstadoLesion;

  @ApiProperty()
  fechaCreacion!: string;

  @ApiProperty()
  fechaActualizacion!: string;
}

class AtributosDto {
  @ApiProperty({ example: 82 }) ataque!: number;
  @ApiProperty({ example: 70 }) tactica!: number;
  @ApiProperty({ example: 88 }) tecnica!: number;
  @ApiProperty({ example: 45 }) defensa!: number;
  @ApiProperty({ example: 91 }) creatividad!: number;
}

/** Payload optimizado para el gráfico radar/pentágono del frontend. */
export class ResumenAtributosResponseDto {
  @ApiProperty({ format: 'uuid' })
  jugadorId!: string;

  @ApiProperty({ type: AtributosDto })
  atributos!: AtributosDto;
}

export class ResumenJugadorResponseDto {
  @ApiProperty({ format: 'uuid' })
  jugadorId!: string;

  @ApiProperty({ format: 'uuid' })
  userId!: string;

  @ApiProperty({ description: 'Proviene de auth-ms' })
  nombres!: string;

  @ApiProperty({ description: 'Proviene de auth-ms' })
  apellidos!: string;

  @ApiPropertyOptional({
    example: '2002-05-15',
    nullable: true,
    description: 'Proviene de auth-ms (persona)',
  })
  fechaNacimiento!: string | null;

  @ApiPropertyOptional({ nullable: true })
  nacionalidad!: string | null;

  @ApiPropertyOptional({ nullable: true })
  fotoUrl!: string | null;

  @ApiProperty({ enum: ESTADOS_JUGADOR })
  estado!: EstadoJugador;

  @ApiPropertyOptional({ enum: POSICIONES, nullable: true })
  posicionPrincipal!: Posicion | null;

  @ApiProperty({ enum: POSICIONES, isArray: true })
  posicionesSecundarias!: Posicion[];

  @ApiPropertyOptional({ enum: PIERNAS_HABILES, nullable: true })
  piernaHabil!: PiernaHabil | null;

  @ApiPropertyOptional({ example: 178.5, nullable: true })
  alturaCm!: number | null;

  @ApiPropertyOptional({ example: 72, nullable: true })
  pesoKg!: number | null;

  @ApiProperty({ type: AtributosDto })
  atributos!: AtributosDto;
}

/** Servido por `equipos-ms`; no se persiste en este microservicio. */
export class EquipoDelJugadorResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() nombre!: string;
  @ApiPropertyOptional({ nullable: true }) descripcion!: string | null;
  @ApiPropertyOptional({ nullable: true }) categoria!: string | null;
  @ApiPropertyOptional({ nullable: true }) ciudad!: string | null;
  @ApiPropertyOptional({ nullable: true }) escudoUrl!: string | null;
  @ApiProperty({ format: 'uuid' }) entrenadorId!: string;
  @ApiProperty() createdAt!: string;
}
