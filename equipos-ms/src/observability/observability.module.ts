import { DynamicModule, Global, Module } from '@nestjs/common';
import { AppLogger } from './app-logger.service';
import { HealthController } from './health.controller';
import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';
import { SERVICE_NAME } from './tokens';

/**
 * Observabilidad transversal del microservicio: expone /health y /metrics,
 * el registro de métricas Prometheus y el logger estructurado.
 *
 * Se registra con el nombre del servicio:
 *   ObservabilityModule.forRoot('auth-ms')
 */
@Global()
@Module({})
export class ObservabilityModule {
  static forRoot(serviceName: string): DynamicModule {
    return {
      module: ObservabilityModule,
      controllers: [HealthController, MetricsController],
      providers: [
        { provide: SERVICE_NAME, useValue: serviceName },
        MetricsService,
        AppLogger,
      ],
      exports: [MetricsService, AppLogger],
    };
  }
}
