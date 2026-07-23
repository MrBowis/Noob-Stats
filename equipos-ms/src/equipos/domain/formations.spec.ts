import {
  FORMACIONES,
  FORMATION_SLOTS,
  isFormacion,
  isValidSlot,
} from './formations';

describe('formations', () => {
  describe('isFormacion', () => {
    it('reconoce cada formación soportada', () => {
      for (const f of FORMACIONES) {
        expect(isFormacion(f)).toBe(true);
      }
    });

    it('rechaza un valor que no es una formación válida', () => {
      expect(isFormacion('6-4-0')).toBe(false);
    });
  });

  describe('isValidSlot', () => {
    it('acepta una casilla que pertenece a la formación', () => {
      expect(isValidSlot('4-4-2', 'GK')).toBe(true);
      expect(isValidSlot('4-4-2', 'DCL')).toBe(true);
    });

    it('rechaza una casilla de otra formación', () => {
      // 'MC' no existe en 4-4-2 (usa MCL/MCR), sí en 4-3-3.
      expect(isValidSlot('4-4-2', 'MC')).toBe(false);
      expect(isValidSlot('4-3-3', 'MC')).toBe(true);
    });

    it('cada formación define exactamente 11 casillas', () => {
      for (const f of FORMACIONES) {
        expect(FORMATION_SLOTS[f]).toHaveLength(11);
      }
    });
  });
});
