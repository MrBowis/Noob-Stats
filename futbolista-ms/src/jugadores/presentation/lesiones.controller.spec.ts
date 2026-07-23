import type { AuthUser } from '../domain/entities/auth-user.entity';
import { LesionesController } from './lesiones.controller';

const user: AuthUser = { id: 'auth-0001', email: 'a@b.com', fullName: null };

describe('LesionesController', () => {
  const listLesiones = { execute: jest.fn() };
  const createLesion = { execute: jest.fn() };
  const updateLesion = { execute: jest.fn() };
  const deleteLesion = { execute: jest.fn() };

  const controller = new LesionesController(
    listLesiones as never,
    createLesion as never,
    updateLesion as never,
    deleteLesion as never,
  );

  afterEach(() => jest.clearAllMocks());

  it('list delega en ListLesionesUseCase con el filtro de estado', () => {
    void controller.list('jugador-0001', 'ACTIVA');
    expect(listLesiones.execute).toHaveBeenCalledWith({
      jugadorId: 'jugador-0001',
      estado: 'ACTIVA',
    });
  });

  it('create delega en CreateLesionUseCase', () => {
    void controller.create(user, 'jugador-0001', {
      parteCuerpo: 'TOBILLO',
      nota: 'Esguince leve',
      fechaInicio: '2026-05-15',
    });
    expect(createLesion.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        authId: 'auth-0001',
        jugadorId: 'jugador-0001',
        parteCuerpo: 'TOBILLO',
      }),
    );
  });

  it('update delega en UpdateLesionUseCase', () => {
    void controller.update(user, 'jugador-0001', 'lesion-0001', {
      estado: 'RECUPERADA',
    });
    expect(updateLesion.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        authId: 'auth-0001',
        jugadorId: 'jugador-0001',
        lesionId: 'lesion-0001',
        estado: 'RECUPERADA',
      }),
    );
  });

  it('remove delega en DeleteLesionUseCase', () => {
    void controller.remove(user, 'jugador-0001', 'lesion-0001');
    expect(deleteLesion.execute).toHaveBeenCalledWith({
      authId: 'auth-0001',
      jugadorId: 'jugador-0001',
      lesionId: 'lesion-0001',
    });
  });
});
