import {
  esFormacion,
  FORMACION_DESCRIPCION,
  FORMACIONES,
  FORMATION_SLOTS,
  slotsDeFormacion,
} from './formations';

describe('esFormacion', () => {
  it('reconoce cada formación válida', () => {
    for (const f of FORMACIONES) {
      expect(esFormacion(f)).toBe(true);
    }
  });

  it('rechaza valores inválidos, null o undefined', () => {
    expect(esFormacion('9-0-1')).toBe(false);
    expect(esFormacion(null)).toBe(false);
    expect(esFormacion(undefined)).toBe(false);
    expect(esFormacion('')).toBe(false);
  });
});

describe('slotsDeFormacion', () => {
  it('devuelve las casillas de la formación solicitada', () => {
    expect(slotsDeFormacion('4-3-3')).toBe(FORMATION_SLOTS['4-3-3']);
  });

  it('usa 4-4-2 por defecto si la formación es inválida o no está definida', () => {
    expect(slotsDeFormacion('inexistente')).toBe(FORMATION_SLOTS['4-4-2']);
    expect(slotsDeFormacion(null)).toBe(FORMATION_SLOTS['4-4-2']);
    expect(slotsDeFormacion(undefined)).toBe(FORMATION_SLOTS['4-4-2']);
  });

  it('cada formación tiene exactamente 11 casillas', () => {
    for (const f of FORMACIONES) {
      expect(FORMATION_SLOTS[f]).toHaveLength(11);
    }
  });

  it('cada formación tiene una descripción no vacía', () => {
    for (const f of FORMACIONES) {
      expect(FORMACION_DESCRIPCION[f].length).toBeGreaterThan(0);
    }
  });
});
