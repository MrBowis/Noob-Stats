import { estadoDisciplinario, validarNuevaTarjeta } from './tarjetas';
import { Tarjeta, TarjetaTipo } from './types';

function tarjeta(usuarioId: string, tipo: TarjetaTipo, id = `${usuarioId}-${tipo}-${Math.random()}`): Tarjeta {
  return {
    id,
    partidoId: 'p1',
    usuarioId,
    jugadorNombres: 'Juan',
    jugadorApellidos: 'Pérez',
    tipo,
    minuto: null,
  };
}

const JUGADOR = 'u1';

describe('estadoDisciplinario', () => {
  it('sin tarjetas el jugador no está expulsado', () => {
    const estado = estadoDisciplinario([], JUGADOR);
    expect(estado).toEqual({
      amarillas: 0,
      rojas: 0,
      expulsado: false,
      motivoExpulsion: null,
    });
  });

  it('una amarilla no expulsa', () => {
    const estado = estadoDisciplinario([tarjeta(JUGADOR, 'amarilla')], JUGADOR);
    expect(estado.amarillas).toBe(1);
    expect(estado.expulsado).toBe(false);
  });

  it('dos amarillas expulsan por acumulación', () => {
    const estado = estadoDisciplinario(
      [tarjeta(JUGADOR, 'amarilla'), tarjeta(JUGADOR, 'amarilla')],
      JUGADOR,
    );
    expect(estado.expulsado).toBe(true);
    expect(estado.motivoExpulsion).toBe('doble-amarilla');
  });

  it('una roja directa expulsa', () => {
    const estado = estadoDisciplinario([tarjeta(JUGADOR, 'roja')], JUGADOR);
    expect(estado.expulsado).toBe(true);
    expect(estado.motivoExpulsion).toBe('roja-directa');
  });

  it('sólo considera las tarjetas del jugador indicado', () => {
    const estado = estadoDisciplinario(
      [tarjeta('otro', 'roja'), tarjeta(JUGADOR, 'amarilla')],
      JUGADOR,
    );
    expect(estado.amarillas).toBe(1);
    expect(estado.rojas).toBe(0);
    expect(estado.expulsado).toBe(false);
  });
});

describe('validarNuevaTarjeta', () => {
  it('permite la primera amarilla', () => {
    const estado = estadoDisciplinario([], JUGADOR);
    expect(validarNuevaTarjeta(estado, 'amarilla')).toBeNull();
  });

  it('permite la segunda amarilla (expulsión por acumulación)', () => {
    const estado = estadoDisciplinario([tarjeta(JUGADOR, 'amarilla')], JUGADOR);
    expect(validarNuevaTarjeta(estado, 'amarilla')).toBeNull();
  });

  it('permite roja directa teniendo una amarilla previa', () => {
    const estado = estadoDisciplinario([tarjeta(JUGADOR, 'amarilla')], JUGADOR);
    expect(validarNuevaTarjeta(estado, 'roja')).toBeNull();
  });

  it('bloquea una tercera amarilla', () => {
    const estado = estadoDisciplinario(
      [tarjeta(JUGADOR, 'amarilla'), tarjeta(JUGADOR, 'amarilla')],
      JUGADOR,
    );
    expect(validarNuevaTarjeta(estado, 'amarilla')).not.toBeNull();
  });

  it('bloquea una roja tras doble amarilla (no hay triple sanción)', () => {
    const estado = estadoDisciplinario(
      [tarjeta(JUGADOR, 'amarilla'), tarjeta(JUGADOR, 'amarilla')],
      JUGADOR,
    );
    expect(validarNuevaTarjeta(estado, 'roja')).not.toBeNull();
  });

  it('bloquea una segunda roja', () => {
    const estado = estadoDisciplinario([tarjeta(JUGADOR, 'roja')], JUGADOR);
    expect(validarNuevaTarjeta(estado, 'roja')).not.toBeNull();
  });

  it('bloquea una amarilla tras la expulsión con roja', () => {
    const estado = estadoDisciplinario([tarjeta(JUGADOR, 'roja')], JUGADOR);
    expect(validarNuevaTarjeta(estado, 'amarilla')).not.toBeNull();
  });
});
