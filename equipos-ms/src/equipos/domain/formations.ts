/**
 * Formaciones tácticas permitidas y sus casillas (slots) en la cancha.
 * Las coordenadas x/y están normalizadas en [0, 1]:
 *   x = 0 (izquierda) → 1 (derecha)
 *   y = 0 (portería propia, abajo) → 1 (ataque, arriba)
 * El frontend usa x/y para dibujar la alineación sobre una cancha.
 */
export const FORMACIONES = [
  '4-4-2',
  '4-3-3',
  '4-2-3-1',
  '3-5-2',
  '5-3-2',
] as const;

export type Formacion = (typeof FORMACIONES)[number];

export interface FormationSlot {
  code: string;
  label: string;
  x: number;
  y: number;
}

export const FORMATION_SLOTS: Record<Formacion, FormationSlot[]> = {
  '4-4-2': [
    { code: 'GK', label: 'POR', x: 0.5, y: 0.06 },
    { code: 'LB', label: 'LI', x: 0.16, y: 0.28 },
    { code: 'DCL', label: 'DFC', x: 0.39, y: 0.26 },
    { code: 'DCR', label: 'DFC', x: 0.61, y: 0.26 },
    { code: 'RB', label: 'LD', x: 0.84, y: 0.28 },
    { code: 'LM', label: 'MI', x: 0.16, y: 0.55 },
    { code: 'MCL', label: 'MC', x: 0.39, y: 0.55 },
    { code: 'MCR', label: 'MC', x: 0.61, y: 0.55 },
    { code: 'RM', label: 'MD', x: 0.84, y: 0.55 },
    { code: 'DL', label: 'DEL', x: 0.38, y: 0.84 },
    { code: 'DR', label: 'DEL', x: 0.62, y: 0.84 },
  ],
  '4-3-3': [
    { code: 'GK', label: 'POR', x: 0.5, y: 0.06 },
    { code: 'LB', label: 'LI', x: 0.16, y: 0.28 },
    { code: 'DCL', label: 'DFC', x: 0.39, y: 0.26 },
    { code: 'DCR', label: 'DFC', x: 0.61, y: 0.26 },
    { code: 'RB', label: 'LD', x: 0.84, y: 0.28 },
    { code: 'MCL', label: 'MC', x: 0.3, y: 0.53 },
    { code: 'MC', label: 'MC', x: 0.5, y: 0.5 },
    { code: 'MCR', label: 'MC', x: 0.7, y: 0.53 },
    { code: 'EI', label: 'EI', x: 0.18, y: 0.82 },
    { code: 'DC', label: 'DC', x: 0.5, y: 0.86 },
    { code: 'ED', label: 'ED', x: 0.82, y: 0.82 },
  ],
  '4-2-3-1': [
    { code: 'GK', label: 'POR', x: 0.5, y: 0.06 },
    { code: 'LB', label: 'LI', x: 0.16, y: 0.28 },
    { code: 'DCL', label: 'DFC', x: 0.39, y: 0.26 },
    { code: 'DCR', label: 'DFC', x: 0.61, y: 0.26 },
    { code: 'RB', label: 'LD', x: 0.84, y: 0.28 },
    { code: 'MCDL', label: 'MCD', x: 0.38, y: 0.46 },
    { code: 'MCDR', label: 'MCD', x: 0.62, y: 0.46 },
    { code: 'MPI', label: 'MP', x: 0.2, y: 0.67 },
    { code: 'MP', label: 'MP', x: 0.5, y: 0.67 },
    { code: 'MPD', label: 'MP', x: 0.8, y: 0.67 },
    { code: 'DC', label: 'DC', x: 0.5, y: 0.87 },
  ],
  '3-5-2': [
    { code: 'GK', label: 'POR', x: 0.5, y: 0.06 },
    { code: 'DFI', label: 'DFC', x: 0.3, y: 0.27 },
    { code: 'DFC', label: 'DFC', x: 0.5, y: 0.25 },
    { code: 'DFD', label: 'DFC', x: 0.7, y: 0.27 },
    { code: 'CARI', label: 'CAR', x: 0.1, y: 0.53 },
    { code: 'MCL', label: 'MC', x: 0.34, y: 0.52 },
    { code: 'MC', label: 'MC', x: 0.5, y: 0.5 },
    { code: 'MCR', label: 'MC', x: 0.66, y: 0.52 },
    { code: 'CARD', label: 'CAR', x: 0.9, y: 0.53 },
    { code: 'DL', label: 'DEL', x: 0.38, y: 0.84 },
    { code: 'DR', label: 'DEL', x: 0.62, y: 0.84 },
  ],
  '5-3-2': [
    { code: 'GK', label: 'POR', x: 0.5, y: 0.06 },
    { code: 'CARI', label: 'CAR', x: 0.1, y: 0.3 },
    { code: 'DCL', label: 'DFC', x: 0.3, y: 0.26 },
    { code: 'DCC', label: 'DFC', x: 0.5, y: 0.24 },
    { code: 'DCR', label: 'DFC', x: 0.7, y: 0.26 },
    { code: 'CARD', label: 'CAR', x: 0.9, y: 0.3 },
    { code: 'MCL', label: 'MC', x: 0.3, y: 0.56 },
    { code: 'MC', label: 'MC', x: 0.5, y: 0.56 },
    { code: 'MCR', label: 'MC', x: 0.7, y: 0.56 },
    { code: 'DL', label: 'DEL', x: 0.38, y: 0.84 },
    { code: 'DR', label: 'DEL', x: 0.62, y: 0.84 },
  ],
};

export function isFormacion(value: string): value is Formacion {
  return (FORMACIONES as readonly string[]).includes(value);
}

/** Indica si `slot` es una casilla válida dentro de la formación dada. */
export function isValidSlot(formacion: Formacion, slot: string): boolean {
  return FORMATION_SLOTS[formacion].some((s) => s.code === slot);
}
