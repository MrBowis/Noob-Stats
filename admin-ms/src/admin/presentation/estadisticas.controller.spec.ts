import type { AuthUser } from '../domain/entities/auth-user.entity';
import { EstadisticasController } from './estadisticas.controller';

const user: AuthUser = { id: 'auth-admin', email: 'a@b.com', fullName: null };

describe('EstadisticasController', () => {
  const getEstadisticas = { execute: jest.fn() };
  const controller = new EstadisticasController(getEstadisticas as never);

  afterEach(() => jest.clearAllMocks());

  it('get delega en GetEstadisticasUseCase', () => {
    void controller.get(user);
    expect(getEstadisticas.execute).toHaveBeenCalledWith({
      authId: 'auth-admin',
    });
  });
});
