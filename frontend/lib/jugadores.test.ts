import {
  labelEstadoJugador,
  labelEstadoLesion,
  labelGenero,
  labelParteCuerpo,
  labelPierna,
  labelPosicion,
  OPCIONES_ESTADO_JUGADOR,
  OPCIONES_ESTADO_LESION,
  OPCIONES_GENERO,
  OPCIONES_PARTE_CUERPO,
  OPCIONES_PIERNA,
  OPCIONES_POSICION,
  parseMedida,
  soloNumeroDecimal,
  tonoEstadoJugador,
  tonoEstadoLesion,
  validarUrl,
} from './jugadores';

describe('opciones de catálogo', () => {
  it('humaniza cada valor a "Palabra sin guiones bajos"', () => {
    expect(OPCIONES_GENERO).toContainEqual({
      value: 'PREFIERO_NO_DECIR',
      label: 'Prefiero no decir',
    });
    expect(OPCIONES_ESTADO_JUGADOR).toContainEqual({
      value: 'LESIONADO',
      label: 'Lesionado',
    });
    expect(OPCIONES_PIERNA).toContainEqual({
      value: 'IZQUIERDA',
      label: 'Izquierda',
    });
    expect(OPCIONES_POSICION).toContainEqual({
      value: 'MEDIOCAMPISTA',
      label: 'Mediocampista',
    });
    expect(OPCIONES_ESTADO_LESION).toContainEqual({
      value: 'EN_RECUPERACION',
      label: 'En recuperacion',
    });
  });

  it('acentúa "Muñeca" como caso especial en PARTE_CUERPO', () => {
    expect(OPCIONES_PARTE_CUERPO).toContainEqual({
      value: 'MUNECA',
      label: 'Muñeca',
    });
    expect(OPCIONES_PARTE_CUERPO).toContainEqual({
      value: 'CABEZA',
      label: 'Cabeza',
    });
  });
});

describe('labels', () => {
  it('labelGenero devuelve "—" si es null', () => {
    expect(labelGenero(null)).toBe('—');
    expect(labelGenero('OTRO')).toBe('Otro');
  });

  it('labelPierna devuelve "—" si es null', () => {
    expect(labelPierna(null)).toBe('—');
    expect(labelPierna('AMBAS')).toBe('Ambas');
  });

  it('labelEstadoJugador humaniza el valor', () => {
    expect(labelEstadoJugador('ACTIVO')).toBe('Activo');
  });

  it('labelPosicion humaniza el valor', () => {
    expect(labelPosicion('DELANTERO')).toBe('Delantero');
  });

  it('labelParteCuerpo acentúa Muñeca', () => {
    expect(labelParteCuerpo('MUNECA')).toBe('Muñeca');
    expect(labelParteCuerpo('TOBILLO')).toBe('Tobillo');
  });

  it('labelEstadoLesion humaniza el valor', () => {
    expect(labelEstadoLesion('CRONICA')).toBe('Cronica');
  });
});

describe('tonoEstadoJugador', () => {
  it('mapea cada estado a su tono', () => {
    expect(tonoEstadoJugador('ACTIVO')).toBe('success');
    expect(tonoEstadoJugador('LESIONADO')).toBe('danger');
    expect(tonoEstadoJugador('RETIRADO')).toBe('neutral');
    expect(tonoEstadoJugador('INACTIVO')).toBe('warning');
  });
});

describe('tonoEstadoLesion', () => {
  it('mapea cada estado a su tono', () => {
    expect(tonoEstadoLesion('RECUPERADA')).toBe('success');
    expect(tonoEstadoLesion('ACTIVA')).toBe('danger');
    expect(tonoEstadoLesion('CRONICA')).toBe('neutral');
    expect(tonoEstadoLesion('EN_RECUPERACION')).toBe('warning');
  });
});

describe('soloNumeroDecimal', () => {
  it('elimina caracteres no numéricos', () => {
    expect(soloNumeroDecimal('abc123')).toBe('123');
  });

  it('convierte la coma en punto decimal', () => {
    expect(soloNumeroDecimal('12,5')).toBe('12.5');
  });

  it('limita a dos decimales', () => {
    expect(soloNumeroDecimal('12.5678')).toBe('12.56');
  });

  it('conserva la parte entera si no hay decimales', () => {
    expect(soloNumeroDecimal('180')).toBe('180');
  });
});

describe('parseMedida', () => {
  it('devuelve valor null para texto vacío', () => {
    expect(parseMedida('  ', 'Altura', 250)).toEqual({ valor: null });
  });

  it('parsea un número válido', () => {
    expect(parseMedida('75.5', 'Peso', 200)).toEqual({ valor: 75.5 });
  });

  it('acepta coma como separador decimal', () => {
    expect(parseMedida('75,5', 'Peso', 200)).toEqual({ valor: 75.5 });
  });

  it('rechaza texto no numérico', () => {
    expect(parseMedida('abc', 'Peso', 200)).toEqual({
      error: 'Peso debe ser un número',
    });
  });

  it('rechaza valores fuera de rango', () => {
    expect(parseMedida('0', 'Peso', 200)).toEqual({
      error: 'Peso debe estar entre 1 y 200',
    });
    expect(parseMedida('300', 'Peso', 200)).toEqual({
      error: 'Peso debe estar entre 1 y 200',
    });
  });

  it('rechaza más de dos decimales', () => {
    expect(parseMedida('75.123', 'Peso', 200)).toEqual({
      error: 'Peso admite como máximo 2 decimales',
    });
  });
});

describe('validarUrl', () => {
  it('acepta cadena vacía', () => {
    expect(validarUrl('')).toBeNull();
    expect(validarUrl('   ')).toBeNull();
  });

  it('acepta una URL http(s) válida', () => {
    expect(validarUrl('https://example.com/foto.png')).toBeNull();
    expect(validarUrl('http://example.com')).toBeNull();
  });

  it('rechaza texto que no es una URL', () => {
    expect(validarUrl('no-es-url')).toMatch(/URL válida/);
  });

  it('rechaza URLs demasiado largas', () => {
    const larga = `https://example.com/${'a'.repeat(500)}`;
    expect(validarUrl(larga)).toMatch(/500 caracteres/);
  });
});
