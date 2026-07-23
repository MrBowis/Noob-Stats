import { AppLogger } from './app-logger.service';
import { HealthController } from './health.controller';
import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';
import { ObservabilityModule } from './observability.module';
import { SERVICE_NAME } from './tokens';

describe('ObservabilityModule.forRoot', () => {
  it('registra los controladores, el nombre del servicio y expone metrics/logger', () => {
    const dynamic = ObservabilityModule.forRoot('auth-ms');

    expect(dynamic.module).toBe(ObservabilityModule);
    expect(dynamic.controllers).toEqual([HealthController, MetricsController]);
    expect(dynamic.exports).toEqual([MetricsService, AppLogger]);
    expect(dynamic.providers).toEqual(
      expect.arrayContaining([
        { provide: SERVICE_NAME, useValue: 'auth-ms' },
        MetricsService,
        AppLogger,
      ]),
    );
  });
});
