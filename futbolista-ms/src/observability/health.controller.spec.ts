import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('responde con el estado y el nombre del servicio, sin datos sensibles', () => {
    const controller = new HealthController('auth-ms');

    const respuesta = controller.check();

    expect(respuesta).toEqual({ status: 'ok', service: 'auth-ms' });
    expect(JSON.stringify(respuesta)).not.toMatch(/env|secret|token|key/i);
  });
});
