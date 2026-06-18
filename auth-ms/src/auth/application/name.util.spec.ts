import { splitFullName } from './name.util';

describe('splitFullName', () => {
  it('separa nombres y apellidos de un nombre completo', () => {
    expect(splitFullName('Juan Carlos Pérez')).toEqual({
      nombres: 'Juan Carlos',
      apellidos: 'Pérez',
    });
  });

  it('usa la palabra única para ambos campos', () => {
    expect(splitFullName('Messi')).toEqual({
      nombres: 'Messi',
      apellidos: 'Messi',
    });
  });

  it('normaliza espacios múltiples', () => {
    expect(splitFullName('  Ana   María   Gómez ')).toEqual({
      nombres: 'Ana María',
      apellidos: 'Gómez',
    });
  });

  it('devuelve valores por defecto cuando es null o vacío', () => {
    expect(splitFullName(null)).toEqual({
      nombres: 'Usuario',
      apellidos: 'Noob Stats',
    });
    expect(splitFullName('   ')).toEqual({
      nombres: 'Usuario',
      apellidos: 'Noob Stats',
    });
  });
});
