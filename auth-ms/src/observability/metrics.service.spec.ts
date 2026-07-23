import { MetricsService } from './metrics.service';

describe('MetricsService', () => {
  it('etiqueta todas las series con el nombre del servicio', async () => {
    const metrics = new MetricsService('servicio-de-prueba');

    metrics.requestsTotal.inc({ method: 'GET', route: '/', status: '200' });

    const salida = await metrics.registry.metrics();
    expect(salida).toContain('service="servicio-de-prueba"');
    expect(salida).toContain('http_requests_total');
    expect(salida).toContain('http_request_duration_seconds');
  });

  it('registra la duración observada en el histograma', async () => {
    const metrics = new MetricsService('servicio-de-prueba');
    const labels = { method: 'POST', route: '/jugadores', status: '201' };

    metrics.requestDuration.observe(labels, 0.05);

    const salida = await metrics.registry.metrics();
    expect(salida).toContain(
      'http_request_duration_seconds_count{service="servicio-de-prueba",method="POST",route="/jugadores",status="201"',
    );
  });

  it('cada instancia usa su propio registro (sin fugas entre servicios)', () => {
    const a = new MetricsService('servicio-a');
    const b = new MetricsService('servicio-b');
    expect(a.registry).not.toBe(b.registry);
  });
});
