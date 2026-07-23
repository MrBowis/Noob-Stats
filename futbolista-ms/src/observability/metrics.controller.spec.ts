import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';

describe('MetricsController', () => {
  it('expone el registro en formato texto de Prometheus', async () => {
    const metrics = new MetricsService('servicio-de-prueba');
    const controller = new MetricsController(metrics);

    const salida = await controller.scrape();

    expect(salida).toContain('http_requests_total');
    expect(salida).toContain('service="servicio-de-prueba"');
  });
});
