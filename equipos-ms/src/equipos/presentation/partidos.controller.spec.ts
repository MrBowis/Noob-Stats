import type { AuthUser } from '../domain/entities/auth-user.entity';
import { PartidosController } from './partidos.controller';

const user: AuthUser = { id: 'auth-0001', email: 'a@b.com', fullName: null };

describe('PartidosController', () => {
  const getPartido = { execute: jest.fn() };
  const updatePartido = { execute: jest.fn() };
  const deletePartido = { execute: jest.fn() };
  const registerGol = { execute: jest.fn() };
  const deleteGol = { execute: jest.fn() };
  const registerTarjeta = { execute: jest.fn() };
  const deleteTarjeta = { execute: jest.fn() };

  const controller = new PartidosController(
    getPartido as never,
    updatePartido as never,
    deletePartido as never,
    registerGol as never,
    deleteGol as never,
    registerTarjeta as never,
    deleteTarjeta as never,
  );

  afterEach(() => jest.clearAllMocks());

  it('getOne delega en GetPartidoUseCase', () => {
    void controller.getOne(user, 'partido-0001');
    expect(getPartido.execute).toHaveBeenCalledWith({
      authId: 'auth-0001',
      partidoId: 'partido-0001',
    });
  });

  it('update delega en UpdatePartidoUseCase', () => {
    void controller.update(user, 'partido-0001', {
      estado: 'finalizado',
      golesFavor: 2,
      golesContra: 1,
    });
    expect(updatePartido.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        authId: 'auth-0001',
        partidoId: 'partido-0001',
        estado: 'finalizado',
      }),
    );
  });

  it('remove delega en DeletePartidoUseCase', async () => {
    await controller.remove(user, 'partido-0001');
    expect(deletePartido.execute).toHaveBeenCalledWith({
      authId: 'auth-0001',
      partidoId: 'partido-0001',
    });
  });

  it('addGol delega en RegisterGolUseCase', () => {
    void controller.addGol(user, 'partido-0001', {
      usuarioId: 'user-jugador',
      minuto: 23,
    });
    expect(registerGol.execute).toHaveBeenCalledWith({
      authId: 'auth-0001',
      partidoId: 'partido-0001',
      usuarioId: 'user-jugador',
      minuto: 23,
    });
  });

  it('removeGol delega en DeleteGolUseCase', async () => {
    await controller.removeGol(user, 'gol-0001');
    expect(deleteGol.execute).toHaveBeenCalledWith({
      authId: 'auth-0001',
      golId: 'gol-0001',
    });
  });

  it('addTarjeta delega en RegisterTarjetaUseCase', () => {
    void controller.addTarjeta(user, 'partido-0001', {
      usuarioId: 'user-jugador',
      tipo: 'amarilla',
      minuto: 67,
    });
    expect(registerTarjeta.execute).toHaveBeenCalledWith({
      authId: 'auth-0001',
      partidoId: 'partido-0001',
      usuarioId: 'user-jugador',
      tipo: 'amarilla',
      minuto: 67,
    });
  });

  it('removeTarjeta delega en DeleteTarjetaUseCase', async () => {
    await controller.removeTarjeta(user, 'tarjeta-0001');
    expect(deleteTarjeta.execute).toHaveBeenCalledWith({
      authId: 'auth-0001',
      tarjetaId: 'tarjeta-0001',
    });
  });
});
