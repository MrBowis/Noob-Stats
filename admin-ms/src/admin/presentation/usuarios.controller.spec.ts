import type { AuthUser } from '../domain/entities/auth-user.entity';
import { UsuariosController } from './usuarios.controller';

const user: AuthUser = { id: 'auth-admin', email: 'a@b.com', fullName: null };

describe('UsuariosController', () => {
  const createUsuario = { execute: jest.fn() };
  const listUsuarios = { execute: jest.fn() };
  const getUsuario = { execute: jest.fn() };
  const updateUsuario = { execute: jest.fn() };
  const deactivateUsuario = { execute: jest.fn() };

  const controller = new UsuariosController(
    createUsuario as never,
    listUsuarios as never,
    getUsuario as never,
    updateUsuario as never,
    deactivateUsuario as never,
  );

  afterEach(() => jest.clearAllMocks());

  it('create delega en CreateUsuarioUseCase', () => {
    void controller.create(user, {
      email: 'diego@example.com',
      nombres: 'Diego',
      apellidos: 'Chalá',
      rolNombre: 'Futbolista',
    });
    expect(createUsuario.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        authId: 'auth-admin',
        email: 'diego@example.com',
      }),
    );
  });

  it('list delega en ListUsuariosUseCase con el filtro de estado', () => {
    void controller.list(user, 'activo');
    expect(listUsuarios.execute).toHaveBeenCalledWith({
      authId: 'auth-admin',
      estado: 'activo',
    });
  });

  it('getOne delega en GetUsuarioUseCase', () => {
    void controller.getOne(user, 'user-0001');
    expect(getUsuario.execute).toHaveBeenCalledWith({
      authId: 'auth-admin',
      usuarioId: 'user-0001',
    });
  });

  it('update delega en UpdateUsuarioUseCase', () => {
    void controller.update(user, 'user-0001', { estado: 'inactivo' });
    expect(updateUsuario.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        authId: 'auth-admin',
        usuarioId: 'user-0001',
        estado: 'inactivo',
      }),
    );
  });

  it('remove delega en DeactivateUsuarioUseCase', () => {
    void controller.remove(user, 'user-0001');
    expect(deactivateUsuario.execute).toHaveBeenCalledWith({
      authId: 'auth-admin',
      usuarioId: 'user-0001',
    });
  });
});
