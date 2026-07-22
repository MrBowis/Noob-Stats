import {
  EstadoJugador,
  Genero,
  ParteCuerpo,
  PiernaHabil,
  Posicion,
  EstadoLesion,
} from '../catalogos';

/** Perfil deportivo propio del futbolista. */
export interface Jugador {
  id: string;
  userId: string;
  genero: Genero | null;
  nacionalidad: string | null;
  fotoUrl: string | null;
  piernaHabil: PiernaHabil | null;
  estado: EstadoJugador;
  fechaCreacion: string;
  fechaActualizacion: string;
}

/** Características físicas (1:1 con el jugador). */
export interface JugadorFisico {
  id: string;
  jugadorId: string;
  alturaCm: number | null;
  pesoKg: number | null;
  fechaActualizacion: string;
}

export interface JugadorPosicion {
  id: string;
  jugadorId: string;
  posicion: Posicion;
  esPrincipal: boolean;
}

/**
 * Valoración del perfil para el pentágono. No son estadísticas de partidos:
 * esas las administra `equipos-ms`.
 */
export interface JugadorAtributo {
  id: string;
  jugadorId: string;
  ataque: number;
  tactica: number;
  tecnica: number;
  defensa: number;
  creatividad: number;
  fechaActualizacion: string;
}

export interface JugadorLesion {
  id: string;
  jugadorId: string;
  parteCuerpo: ParteCuerpo;
  nota: string;
  fechaInicio: string;
  fechaFin: string | null;
  estado: EstadoLesion;
  fechaCreacion: string;
  fechaActualizacion: string;
}

/** Los cinco valores que consume el gráfico radar del frontend. */
export interface ResumenAtributos {
  jugadorId: string;
  atributos: {
    ataque: number;
    tactica: number;
    tecnica: number;
    defensa: number;
    creatividad: number;
  };
}

/**
 * Tarjeta pública del futbolista. `fechaNacimiento`, `nombres` y `apellidos`
 * provienen de `auth-ms`; no se almacenan en este microservicio.
 */
export interface ResumenJugador {
  jugadorId: string;
  userId: string;
  nombres: string;
  apellidos: string;
  fechaNacimiento: string | null;
  nacionalidad: string | null;
  fotoUrl: string | null;
  estado: EstadoJugador;
  posicionPrincipal: Posicion | null;
  posicionesSecundarias: Posicion[];
  piernaHabil: PiernaHabil | null;
  alturaCm: number | null;
  pesoKg: number | null;
  atributos: ResumenAtributos['atributos'];
}
