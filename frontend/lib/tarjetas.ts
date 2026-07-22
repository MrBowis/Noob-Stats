import { Tarjeta, TarjetaTipo } from './types';

export type MotivoExpulsion = 'roja-directa' | 'doble-amarilla';

export interface EstadoDisciplinario {
  amarillas: number;
  rojas: number;
  /** El jugador está fuera del partido (roja directa o doble amarilla). */
  expulsado: boolean;
  motivoExpulsion: MotivoExpulsion | null;
}

export const MAX_AMARILLAS = 2;
export const MAX_ROJAS = 1;

/**
 * Resume las tarjetas de un jugador en un partido.
 *
 * Reglas del reglamento:
 *  - Dos amarillas equivalen a una roja por acumulación: la segunda amarilla
 *    ES la expulsión, no se registra una roja adicional.
 *  - Una roja directa expulsa aunque el jugador tuviera una amarilla previa.
 *  - Una vez expulsado no puede recibir más tarjetas (no hay triple sanción).
 */
export function estadoDisciplinario(
  tarjetas: Tarjeta[],
  usuarioId: string,
): EstadoDisciplinario {
  const propias = tarjetas.filter((t) => t.usuarioId === usuarioId);
  const amarillas = propias.filter((t) => t.tipo === 'amarilla').length;
  const rojas = propias.filter((t) => t.tipo === 'roja').length;

  // La roja directa tiene prioridad como motivo si existe.
  const motivoExpulsion: MotivoExpulsion | null =
    rojas > 0 ? 'roja-directa' : amarillas >= MAX_AMARILLAS ? 'doble-amarilla' : null;

  return {
    amarillas,
    rojas,
    expulsado: motivoExpulsion !== null,
    motivoExpulsion,
  };
}

/**
 * Valida si se puede registrar una nueva tarjeta para el jugador.
 * Devuelve el mensaje de error, o null si la tarjeta es válida.
 */
export function validarNuevaTarjeta(
  estado: EstadoDisciplinario,
  tipo: TarjetaTipo,
): string | null {
  if (estado.expulsado) {
    return estado.motivoExpulsion === 'doble-amarilla'
      ? 'El jugador ya fue expulsado por doble amarilla; no puede recibir más tarjetas'
      : 'El jugador ya fue expulsado con roja; no puede recibir más tarjetas';
  }
  if (tipo === 'amarilla' && estado.amarillas >= MAX_AMARILLAS) {
    return 'El jugador no puede tener más de dos amarillas';
  }
  if (tipo === 'roja' && estado.rojas >= MAX_ROJAS) {
    return 'El jugador no puede tener más de una roja';
  }
  return null;
}

/** Etiqueta corta del estado disciplinario, para mostrar junto al jugador. */
export function etiquetaDisciplinaria(
  estado: EstadoDisciplinario,
): string | null {
  if (estado.motivoExpulsion === 'roja-directa') return 'Expulsado (roja)';
  if (estado.motivoExpulsion === 'doble-amarilla') {
    return 'Expulsado (doble amarilla)';
  }
  if (estado.amarillas === 1) return '1 amarilla';
  return null;
}
