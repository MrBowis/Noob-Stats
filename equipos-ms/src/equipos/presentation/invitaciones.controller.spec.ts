import type { AuthUser } from '../domain/entities/auth-user.entity';
import { InvitacionesController } from './invitaciones.controller';

const user: AuthUser = { id: 'auth-jugador', email: 'a@b.com', fullName: null };

describe('InvitacionesController', () => {
  const listMisInvitaciones = { execute: jest.fn() };
  const responderInvitacion = { execute: jest.fn() };
  const cancelarInvitacion = { execute: jest.fn() };

  const controller = new InvitacionesController(
    listMisInvitaciones as never,
    responderInvitacion as never,
    cancelarInvitacion as never,
  );

  afterEach(() => jest.clearAllMocks());

  it('mias filtra por pendientes cuando el query es "true"', () => {
    void controller.mias(user, 'true');
    expect(listMisInvitaciones.execute).toHaveBeenCalledWith({
      authId: 'auth-jugador',
      soloPendientes: true,
    });
  });

  it('mias no filtra si el query no es "true"', () => {
    void controller.mias(user, undefined);
    expect(listMisInvitaciones.execute).toHaveBeenCalledWith({
      authId: 'auth-jugador',
      soloPendientes: false,
    });
  });

  it('responder delega en ResponderInvitacionUseCase', () => {
    void controller.responder(user, 'invitacion-0001', { aceptar: true });
    expect(responderInvitacion.execute).toHaveBeenCalledWith({
      authId: 'auth-jugador',
      invitacionId: 'invitacion-0001',
      aceptar: true,
    });
  });

  it('cancelar delega en CancelarInvitacionUseCase', () => {
    void controller.cancelar(user, 'invitacion-0001');
    expect(cancelarInvitacion.execute).toHaveBeenCalledWith({
      authId: 'auth-jugador',
      invitacionId: 'invitacion-0001',
    });
  });
});
