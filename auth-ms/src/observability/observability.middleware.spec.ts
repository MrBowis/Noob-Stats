import { EventEmitter } from 'node:events';
import type { Request, Response } from 'express';
import { MetricsService } from './metrics.service';
import { createObservabilityMiddleware } from './observability.middleware';
import { getRequestId } from './request-context';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function fakeRequest(overrides: Partial<Request> = {}): Request {
  const headers: Record<string, string> = {};
  return {
    method: 'GET',
    path: '/jugadores/abc-123',
    route: { path: '/jugadores/:id' },
    header: (name: string) => headers[name.toLowerCase()],
    headers,
    ...overrides,
  } as unknown as Request;
}

type SetHeaderMock = jest.Mock<Response, [string, string]>;

function fakeResponse(): Response & EventEmitter {
  const emitter = new EventEmitter() as Response & EventEmitter;
  emitter.statusCode = 200;
  emitter.setHeader = jest.fn();
  return emitter;
}

/** Último valor con el que se llamó a `res.setHeader(nombre, ...)`. */
function headerEnviado(res: Response, nombre: string): string | undefined {
  const mock = res.setHeader as unknown as SetHeaderMock;
  const llamada = mock.mock.calls.find(([n]) => n === nombre);
  return llamada?.[1];
}

async function seriesDe(metrics: MetricsService, nombre: string) {
  const todas = await metrics.registry.getMetricsAsJSON();
  return todas.find((m) => m.name === nombre);
}

describe('createObservabilityMiddleware', () => {
  it('genera un X-Request-ID nuevo cuando la petición no trae uno', () => {
    const metrics = new MetricsService('servicio');
    const middleware = createObservabilityMiddleware(metrics);
    const req = fakeRequest();
    const res = fakeResponse();
    const next = jest.fn();

    middleware(req, res, next);

    const header = headerEnviado(res, 'x-request-id');
    expect(header).toMatch(UUID_RE);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('propaga el X-Request-ID entrante en lugar de generar uno nuevo', () => {
    const metrics = new MetricsService('servicio');
    const middleware = createObservabilityMiddleware(metrics);
    const req = fakeRequest({
      header: ((name: string) =>
        name.toLowerCase() === 'x-request-id'
          ? 'req-del-cliente'
          : undefined) as Request['header'],
    });
    const res = fakeResponse();

    middleware(req, res, jest.fn());

    const header = headerEnviado(res, 'x-request-id');
    expect(header).toBe('req-del-cliente');
  });

  it('usa X-Correlation-ID como respaldo si falta X-Request-ID', () => {
    const metrics = new MetricsService('servicio');
    const middleware = createObservabilityMiddleware(metrics);
    const req = fakeRequest({
      header: ((name: string) =>
        name.toLowerCase() === 'x-correlation-id'
          ? 'correlation-1'
          : undefined) as Request['header'],
    });
    const res = fakeResponse();

    middleware(req, res, jest.fn());

    const header = headerEnviado(res, 'x-request-id');
    expect(header).toBe('correlation-1');
  });

  it('descarta un X-Request-ID entrante desmesuradamente largo', () => {
    const metrics = new MetricsService('servicio');
    const middleware = createObservabilityMiddleware(metrics);
    const idLargo = 'a'.repeat(500);
    const req = fakeRequest({
      header: ((name: string) =>
        name.toLowerCase() === 'x-request-id'
          ? idLargo
          : undefined) as Request['header'],
    });
    const res = fakeResponse();

    middleware(req, res, jest.fn());

    const header = headerEnviado(res, 'x-request-id');
    expect(header).toMatch(UUID_RE);
  });

  it('deja el requestId disponible para el logger durante el resto de la petición', () => {
    const metrics = new MetricsService('servicio');
    const middleware = createObservabilityMiddleware(metrics);
    const req = fakeRequest({
      header: ((name: string) =>
        name.toLowerCase() === 'x-request-id'
          ? 'req-ctx'
          : undefined) as Request['header'],
    });
    const res = fakeResponse();
    let visto: string | undefined;

    middleware(req, res, () => {
      visto = getRequestId();
    });

    expect(visto).toBe('req-ctx');
  });

  it('registra método, ruta normalizada y estado al finalizar la respuesta', async () => {
    const metrics = new MetricsService('servicio');
    const middleware = createObservabilityMiddleware(metrics);
    const req = fakeRequest({
      method: 'GET',
      route: { path: '/jugadores/:id' },
    });
    const res = fakeResponse();

    middleware(req, res, jest.fn());
    res.statusCode = 200;
    res.emit('finish');

    const serie = await seriesDe(metrics, 'http_requests_total');
    expect(
      serie?.values.some(
        (v) =>
          v.labels.method === 'GET' &&
          v.labels.route === '/jugadores/:id' &&
          v.labels.status === '200' &&
          v.value === 1,
      ),
    ).toBe(true);
  });

  it('usa "unknown" como ruta cuando Express no la resolvió (p. ej. 404)', async () => {
    const metrics = new MetricsService('servicio');
    const middleware = createObservabilityMiddleware(metrics);
    const req = fakeRequest({
      method: 'GET',
      path: '/no-existe',
      route: undefined,
    });
    const res = fakeResponse();

    middleware(req, res, jest.fn());
    res.statusCode = 404;
    res.emit('finish');

    const serie = await seriesDe(metrics, 'http_requests_total');
    expect(
      serie?.values.some(
        (v) => v.labels.route === 'unknown' && v.labels.status === '404',
      ),
    ).toBe(true);
  });

  it('no registra métricas para las rutas de observabilidad (/health, /metrics)', async () => {
    const metrics = new MetricsService('servicio');
    const middleware = createObservabilityMiddleware(metrics);
    const req = fakeRequest({
      method: 'GET',
      path: '/health',
      route: { path: '/health' },
    });
    const res = fakeResponse();

    middleware(req, res, jest.fn());
    res.emit('finish');

    const serie = await seriesDe(metrics, 'http_requests_total');
    expect(serie?.values.length ?? 0).toBe(0);
  });
});
