/**
 * Catálogos controlados del dominio del jugador. Cada uno se corresponde con
 * un tipo ENUM de PostgreSQL creado en `0004_jugadores_module.sql`.
 */

export const GENEROS = [
  'MASCULINO',
  'FEMENINO',
  'OTRO',
  'PREFIERO_NO_DECIR',
] as const;
export type Genero = (typeof GENEROS)[number];

export const ESTADOS_JUGADOR = [
  'ACTIVO',
  'INACTIVO',
  'LESIONADO',
  'RETIRADO',
] as const;
export type EstadoJugador = (typeof ESTADOS_JUGADOR)[number];

export const PIERNAS_HABILES = ['DERECHA', 'IZQUIERDA', 'AMBAS'] as const;
export type PiernaHabil = (typeof PIERNAS_HABILES)[number];

/** PORTERO está soportado explícitamente. */
export const POSICIONES = [
  'PORTERO',
  'DEFENSA',
  'MEDIOCAMPISTA',
  'DELANTERO',
] as const;
export type Posicion = (typeof POSICIONES)[number];

export const PARTES_CUERPO = [
  'CABEZA',
  'CUELLO',
  'HOMBRO',
  'BRAZO',
  'CODO',
  'ANTEBRAZO',
  'MUNECA',
  'MANO',
  'DEDOS_MANO',
  'PECHO',
  'ESPALDA',
  'CADERA',
  'INGLE',
  'MUSLO',
  'RODILLA',
  'PANTORRILLA',
  'TOBILLO',
  'PIE',
  'DEDOS_PIE',
  'OTRA',
] as const;
export type ParteCuerpo = (typeof PARTES_CUERPO)[number];

export const ESTADOS_LESION = [
  'ACTIVA',
  'EN_RECUPERACION',
  'RECUPERADA',
  'CRONICA',
] as const;
export type EstadoLesion = (typeof ESTADOS_LESION)[number];

/** Rango válido para los cinco atributos del pentágono. */
export const ATRIBUTO_MIN = 0;
export const ATRIBUTO_MAX = 100;

/**
 * Valores que se devuelven cuando el jugador todavía no ha guardado sus
 * atributos. Coinciden con los DEFAULT de `jugador_atributo`.
 */
export const ATRIBUTOS_POR_DEFECTO = {
  ataque: 50,
  tactica: 50,
  tecnica: 50,
  defensa: 50,
  creatividad: 50,
} as const;
