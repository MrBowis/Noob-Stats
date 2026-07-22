import { BadgeTone } from '../components/Badge';
import {
  ESTADOS_JUGADOR,
  ESTADOS_LESION,
  EstadoJugador,
  EstadoLesion,
  GENEROS,
  Genero,
  PARTES_CUERPO,
  ParteCuerpo,
  PIERNAS_HABILES,
  PiernaHabil,
  POSICIONES,
  Posicion,
} from './types';

/** Convierte un valor de catálogo (MAYUS_CON_GUIONES) en texto legible. */
function humanizar(valor: string): string {
  const texto = valor.replace(/_/g, ' ').toLowerCase();
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function opciones<T extends string>(valores: readonly T[]) {
  return valores.map((value) => ({ value, label: humanizar(value) }));
}

export const OPCIONES_GENERO = opciones(GENEROS);
export const OPCIONES_ESTADO_JUGADOR = opciones(ESTADOS_JUGADOR);
export const OPCIONES_PIERNA = opciones(PIERNAS_HABILES);
export const OPCIONES_POSICION = opciones(POSICIONES);
export const OPCIONES_ESTADO_LESION = opciones(ESTADOS_LESION);

/** `MUNECA` no lleva tilde en el ENUM del backend; se muestra acentuada. */
export const OPCIONES_PARTE_CUERPO = PARTES_CUERPO.map((value) => ({
  value,
  label: value === 'MUNECA' ? 'Muñeca' : humanizar(value),
}));

export function labelGenero(v: Genero | null): string {
  return v ? humanizar(v) : '—';
}
export function labelEstadoJugador(v: EstadoJugador): string {
  return humanizar(v);
}
export function labelPierna(v: PiernaHabil | null): string {
  return v ? humanizar(v) : '—';
}
export function labelPosicion(v: Posicion): string {
  return humanizar(v);
}
export function labelParteCuerpo(v: ParteCuerpo): string {
  return v === 'MUNECA' ? 'Muñeca' : humanizar(v);
}
export function labelEstadoLesion(v: EstadoLesion): string {
  return humanizar(v);
}

export function tonoEstadoJugador(estado: EstadoJugador): BadgeTone {
  if (estado === 'ACTIVO') return 'success';
  if (estado === 'LESIONADO') return 'danger';
  if (estado === 'RETIRADO') return 'neutral';
  return 'warning';
}

export function tonoEstadoLesion(estado: EstadoLesion): BadgeTone {
  if (estado === 'RECUPERADA') return 'success';
  if (estado === 'ACTIVA') return 'danger';
  if (estado === 'CRONICA') return 'neutral';
  return 'warning';
}

/**
 * Descarta cualquier carácter que no sea dígito y deja como mucho un separador
 * decimal con dos decimales. Se usa al escribir, para que el campo sólo pueda
 * contener un número.
 */
export function soloNumeroDecimal(texto: string): string {
  const limpio = texto.replace(/[^0-9.,]/g, '').replace(',', '.');
  const [entera, ...resto] = limpio.split('.');
  if (resto.length === 0) return entera;
  return `${entera}.${resto.join('').slice(0, 2)}`;
}

/**
 * Valida altura/peso escritos como texto. Devuelve el número, `null` si el
 * campo está vacío, o un mensaje de error.
 */
export function parseMedida(
  texto: string,
  campo: string,
  max: number,
): { valor: number | null } | { error: string } {
  const limpio = texto.trim().replace(',', '.');
  if (!limpio) return { valor: null };
  const numero = Number(limpio);
  if (!Number.isFinite(numero)) {
    return { error: `${campo} debe ser un número` };
  }
  if (numero <= 0 || numero > max) {
    return { error: `${campo} debe estar entre 1 y ${max}` };
  }
  if (Math.round(numero * 100) !== numero * 100) {
    return { error: `${campo} admite como máximo 2 decimales` };
  }
  return { valor: numero };
}

/** Acepta cadena vacía o una URL http(s) válida. */
export function validarUrl(texto: string): string | null {
  const limpio = texto.trim();
  if (!limpio) return null;
  if (!/^https?:\/\/\S+$/i.test(limpio)) {
    return 'Debe ser una URL válida que empiece por http:// o https://';
  }
  if (limpio.length > 500) return 'La URL no puede superar los 500 caracteres';
  return null;
}
