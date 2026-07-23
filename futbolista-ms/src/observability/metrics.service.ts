import { Inject, Injectable } from '@nestjs/common';
import {
  collectDefaultMetrics,
  Counter,
  Histogram,
  Registry,
} from 'prom-client';
import { SERVICE_NAME } from './tokens';

/**
 * Registro de métricas Prometheus del microservicio.
 *
 * Todas las series llevan la etiqueta `service` para que Prometheus distinga
 * cada microservicio. Las etiquetas se mantienen de baja cardinalidad
 * (método, ruta normalizada y código de estado); nunca IDs, tokens ni emails.
 */
@Injectable()
export class MetricsService {
  readonly registry = new Registry();

  readonly requestsTotal: Counter<'method' | 'route' | 'status'>;
  readonly requestDuration: Histogram<'method' | 'route' | 'status'>;

  constructor(@Inject(SERVICE_NAME) serviceName: string) {
    this.registry.setDefaultLabels({ service: serviceName });
    // Métricas de proceso (CPU, memoria, event loop, GC...).
    collectDefaultMetrics({ register: this.registry });

    this.requestsTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total de solicitudes HTTP procesadas',
      labelNames: ['method', 'route', 'status'],
      registers: [this.registry],
    });

    this.requestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duración de las solicitudes HTTP en segundos',
      labelNames: ['method', 'route', 'status'],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
      registers: [this.registry],
    });
  }
}
