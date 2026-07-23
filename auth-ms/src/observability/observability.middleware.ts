import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { MetricsService } from './metrics.service';
import { requestContext } from './request-context';

const HEADER = 'x-request-id';
const RUTAS_EXCLUIDAS = new Set(['/health', '/metrics']);

// La ruta emparejada por Express. Se tipa aparte porque `Request.route` es
// `any` en las definiciones de express y contaminaría el análisis estático.
interface ConRutaEmparejada {
  route?: { path?: string };
}

/**
 * Ruta normalizada (patrón de Express, p. ej. `/jugadores/:id`). Se lee al
 * final de la petición, cuando el enrutado ya la ha resuelto, para no
 * introducir alta cardinalidad con IDs concretos.
 */
function normalizarRuta(req: Request): string {
  const patron = (req as unknown as ConRutaEmparejada).route?.path;
  if (!patron) return 'unknown';
  return patron !== '/' ? patron.replace(/\/$/, '') : '/';
}

/**
 * Middreware a nivel de Express (corre antes que guards y enrutado). Se aplica
 * con `app.use(...)` en main.ts. Hace tres cosas:
 *   1. Propaga o genera el X-Request-ID.
 *   2. Ejecuta el resto de la petición dentro del contexto para el logger.
 *   3. Registra las métricas HTTP cuando la respuesta termina.
 */
export function createObservabilityMiddleware(metrics: MetricsService) {
  return function observability(
    req: Request,
    res: Response,
    next: NextFunction,
  ): void {
    const entrante = req.header(HEADER) ?? req.header('x-correlation-id');
    const requestId =
      entrante && entrante.length > 0 && entrante.length <= 200
        ? entrante
        : randomUUID();
    res.setHeader(HEADER, requestId);

    if (!RUTAS_EXCLUIDAS.has(req.path)) {
      const finTimer = metrics.requestDuration.startTimer();
      res.on('finish', () => {
        const labels = {
          method: req.method,
          route: normalizarRuta(req),
          status: String(res.statusCode),
        };
        metrics.requestsTotal.inc(labels);
        finTimer(labels);
      });
    }

    requestContext.run({ requestId }, () => next());
  };
}
