import { AppLogger } from './app-logger.service';
import { requestContext } from './request-context';

type EscrituraSpy = jest.SpyInstance<boolean, [chunk: string]>;

function ultimaLinea(spy: EscrituraSpy): Record<string, unknown> {
  const llamada = spy.mock.calls.at(-1)?.[0];
  return JSON.parse((llamada ?? '').trim()) as Record<string, unknown>;
}

describe('AppLogger', () => {
  const envOriginal = process.env.LOG_LEVEL;
  let stdout: EscrituraSpy;
  let stderr: EscrituraSpy;

  beforeEach(() => {
    stdout = jest
      .spyOn(process.stdout, 'write')
      .mockImplementation(() => true) as unknown as EscrituraSpy;
    stderr = jest
      .spyOn(process.stderr, 'write')
      .mockImplementation(() => true) as unknown as EscrituraSpy;
  });

  afterEach(() => {
    stdout.mockRestore();
    stderr.mockRestore();
    if (envOriginal === undefined) delete process.env.LOG_LEVEL;
    else process.env.LOG_LEVEL = envOriginal;
  });

  it('emite una línea JSON con timestamp, nivel, service y message', () => {
    delete process.env.LOG_LEVEL;
    const logger = new AppLogger('auth-ms');

    logger.log('hola mundo', 'MiContexto');

    const entry = ultimaLinea(stdout);
    expect(entry).toMatchObject({
      level: 'info',
      service: 'auth-ms',
      message: 'hola mundo',
      context: 'MiContexto',
    });
    expect(typeof entry.timestamp).toBe('string');
  });

  it('escribe los errores en stderr, con el stack incluido', () => {
    delete process.env.LOG_LEVEL;
    const logger = new AppLogger('auth-ms');

    logger.error('algo falló', 'stack-trace-aqui', 'MiContexto');

    expect(stdout).not.toHaveBeenCalled();
    const entry = ultimaLinea(stderr);
    expect(entry).toMatchObject({ level: 'error', stack: 'stack-trace-aqui' });
  });

  it('adjunta el requestId cuando hay contexto de petición activo', () => {
    delete process.env.LOG_LEVEL;
    const logger = new AppLogger('auth-ms');

    requestContext.run({ requestId: 'req-123' }, () => {
      logger.log('con contexto');
    });

    expect(ultimaLinea(stdout).requestId).toBe('req-123');
  });

  it('respeta LOG_LEVEL: con "warn" no emite logs de info', () => {
    process.env.LOG_LEVEL = 'warn';
    const logger = new AppLogger('auth-ms');

    logger.log('no debería salir');
    expect(stdout).not.toHaveBeenCalled();

    logger.warn('sí debería salir');
    expect(stdout).toHaveBeenCalledTimes(1);
  });

  it('usa "info" como nivel por defecto si LOG_LEVEL es inválido', () => {
    process.env.LOG_LEVEL = 'nivel-inexistente';
    const logger = new AppLogger('auth-ms');

    logger.debug('no debería salir con el nivel por defecto');
    expect(stdout).not.toHaveBeenCalled();

    logger.log('sí debería salir');
    expect(stdout).toHaveBeenCalledTimes(1);
  });

  it('serializa mensajes que no son strings sin romper', () => {
    delete process.env.LOG_LEVEL;
    const logger = new AppLogger('auth-ms');

    logger.log({ detalle: 'objeto' });

    expect(ultimaLinea(stdout).message).toBe('{"detalle":"objeto"}');
  });

  it('verbose respeta el umbral más permisivo', () => {
    process.env.LOG_LEVEL = 'verbose';
    const logger = new AppLogger('auth-ms');

    logger.verbose('mensaje detallado');

    expect(ultimaLinea(stdout)).toMatchObject({ level: 'verbose' });
  });
});
