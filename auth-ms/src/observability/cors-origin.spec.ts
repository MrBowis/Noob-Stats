import { resolveCorsOrigin } from './cors-origin';

describe('resolveCorsOrigin', () => {
  it('deniega por defecto si no hay ALLOWED_ORIGIN configurado', () => {
    expect(resolveCorsOrigin(undefined)).toBe(false);
    expect(resolveCorsOrigin('')).toBe(false);
    expect(resolveCorsOrigin('   ')).toBe(false);
  });

  it('permite un único origen configurado', () => {
    expect(resolveCorsOrigin('https://noobstats.example.com')).toBe(
      'https://noobstats.example.com',
    );
  });

  it('admite una lista de orígenes separada por comas', () => {
    expect(
      resolveCorsOrigin('https://a.example.com, https://b.example.com'),
    ).toEqual(['https://a.example.com', 'https://b.example.com']);
  });

  it('respeta un comodín explícito del operador', () => {
    expect(resolveCorsOrigin('*')).toBe('*');
  });
});
