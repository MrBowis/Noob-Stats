import { getRequestId, requestContext } from './request-context';

describe('request-context', () => {
  it('devuelve undefined fuera de un contexto de petición', () => {
    expect(getRequestId()).toBeUndefined();
  });

  it('expone el requestId dentro del contexto en el que se ejecutó', () => {
    requestContext.run({ requestId: 'req-1' }, () => {
      expect(getRequestId()).toBe('req-1');
    });
  });

  it('aísla contextos anidados/paralelos', () => {
    requestContext.run({ requestId: 'externo' }, () => {
      requestContext.run({ requestId: 'interno' }, () => {
        expect(getRequestId()).toBe('interno');
      });
      expect(getRequestId()).toBe('externo');
    });
  });
});
