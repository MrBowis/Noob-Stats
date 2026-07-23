import { formatFecha, formatFechaHora } from './format';

describe('formatFechaHora', () => {
  it('formatea un ISO válido con hora', () => {
    expect(formatFechaHora('2026-08-15T18:00:00.000Z')).toBe(
      `15 ago 2026, ${new Date('2026-08-15T18:00:00.000Z')
        .getHours()
        .toString()
        .padStart(2, '0')}:00`,
    );
  });

  it('devuelve el valor original si el ISO es inválido', () => {
    expect(formatFechaHora('no-es-fecha')).toBe('no-es-fecha');
  });
});

describe('formatFecha', () => {
  it('formatea un ISO válido sin hora', () => {
    const d = new Date('2026-01-05T12:00:00.000Z');
    expect(formatFecha('2026-01-05T12:00:00.000Z')).toBe(
      `${d.getDate()} ene ${d.getFullYear()}`,
    );
  });

  it('devuelve el valor original si el ISO es inválido', () => {
    expect(formatFecha('invalido')).toBe('invalido');
  });

  it('usa el mes correcto para cada índice', () => {
    expect(formatFecha('2026-12-25T00:00:00.000Z')).toContain('dic');
  });
});
