import type { AuthUser } from '../domain/entities/auth-user.entity';
import { RolesController } from './roles.controller';

const user: AuthUser = { id: 'auth-admin', email: 'a@b.com', fullName: null };

describe('RolesController', () => {
  const createRol = { execute: jest.fn() };
  const listRoles = { execute: jest.fn() };
  const getRol = { execute: jest.fn() };
  const updateRol = { execute: jest.fn() };
  const deleteRol = { execute: jest.fn() };

  const controller = new RolesController(
    createRol as never,
    listRoles as never,
    getRol as never,
    updateRol as never,
    deleteRol as never,
  );

  afterEach(() => jest.clearAllMocks());

  it('create delega en CreateRolUseCase', () => {
    void controller.create(user, { nombreRol: 'Futbolista' });
    expect(createRol.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        authId: 'auth-admin',
        nombreRol: 'Futbolista',
      }),
    );
  });

  it('list delega en ListRolesUseCase', () => {
    void controller.list(user);
    expect(listRoles.execute).toHaveBeenCalledWith({ authId: 'auth-admin' });
  });

  it('getOne delega en GetRolUseCase', () => {
    void controller.getOne(user, 'rol-0001');
    expect(getRol.execute).toHaveBeenCalledWith({
      authId: 'auth-admin',
      rolId: 'rol-0001',
    });
  });

  it('update delega en UpdateRolUseCase', () => {
    void controller.update(user, 'rol-0001', { nombreRol: 'Editado' });
    expect(updateRol.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        authId: 'auth-admin',
        rolId: 'rol-0001',
        nombreRol: 'Editado',
      }),
    );
  });

  it('remove delega en DeleteRolUseCase', async () => {
    await controller.remove(user, 'rol-0001');
    expect(deleteRol.execute).toHaveBeenCalledWith({
      authId: 'auth-admin',
      rolId: 'rol-0001',
    });
  });
});
