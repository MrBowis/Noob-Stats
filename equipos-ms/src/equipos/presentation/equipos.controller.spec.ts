import type { AuthUser } from '../domain/entities/auth-user.entity';
import { EquiposController } from './equipos.controller';

const user: AuthUser = { id: 'auth-0001', email: 'a@b.com', fullName: null };

describe('EquiposController', () => {
  const createEquipo = { execute: jest.fn() };
  const listMisEquipos = { execute: jest.fn() };
  const getEquipo = { execute: jest.fn() };
  const updateEquipo = { execute: jest.fn() };
  const deleteEquipo = { execute: jest.fn() };
  const listMiembros = { execute: jest.fn() };
  const updateMiembro = { execute: jest.fn() };
  const removeMiembro = { execute: jest.fn() };
  const invitarJugador = { execute: jest.fn() };
  const listInvitacionesEquipo = { execute: jest.fn() };
  const createPartido = { execute: jest.fn() };
  const listPartidos = { execute: jest.fn() };
  const getEstadisticas = { execute: jest.fn() };

  const controller = new EquiposController(
    createEquipo as never,
    listMisEquipos as never,
    getEquipo as never,
    updateEquipo as never,
    deleteEquipo as never,
    listMiembros as never,
    updateMiembro as never,
    removeMiembro as never,
    invitarJugador as never,
    listInvitacionesEquipo as never,
    createPartido as never,
    listPartidos as never,
    getEstadisticas as never,
  );

  afterEach(() => jest.clearAllMocks());

  it('create delega en CreateEquipoUseCase con el id del token', () => {
    void controller.create(user, { nombre: 'Noob FC' });
    expect(createEquipo.execute).toHaveBeenCalledWith(
      expect.objectContaining({ authId: 'auth-0001', nombre: 'Noob FC' }),
    );
  });

  it('listMine delega en ListMisEquiposUseCase', () => {
    void controller.listMine(user);
    expect(listMisEquipos.execute).toHaveBeenCalledWith({
      authId: 'auth-0001',
    });
  });

  it('getOne delega en GetEquipoUseCase', () => {
    void controller.getOne(user, 'equipo-0001');
    expect(getEquipo.execute).toHaveBeenCalledWith({
      authId: 'auth-0001',
      equipoId: 'equipo-0001',
    });
  });

  it('update delega en UpdateEquipoUseCase', () => {
    void controller.update(user, 'equipo-0001', { nombre: 'Nuevo' });
    expect(updateEquipo.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        authId: 'auth-0001',
        equipoId: 'equipo-0001',
        nombre: 'Nuevo',
      }),
    );
  });

  it('remove delega en DeleteEquipoUseCase', async () => {
    await controller.remove(user, 'equipo-0001');
    expect(deleteEquipo.execute).toHaveBeenCalledWith({
      authId: 'auth-0001',
      equipoId: 'equipo-0001',
    });
  });

  it('miembros delega en ListMiembrosUseCase', () => {
    void controller.miembros(user, 'equipo-0001');
    expect(listMiembros.execute).toHaveBeenCalledWith({
      authId: 'auth-0001',
      equipoId: 'equipo-0001',
    });
  });

  it('editMiembro delega en UpdateMiembroUseCase', () => {
    void controller.editMiembro(user, 'equipo-0001', 'user-jugador', {
      dorsal: 10,
    });
    expect(updateMiembro.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        authId: 'auth-0001',
        equipoId: 'equipo-0001',
        usuarioId: 'user-jugador',
        dorsal: 10,
      }),
    );
  });

  it('kickMiembro delega en RemoveMiembroUseCase', async () => {
    await controller.kickMiembro(user, 'equipo-0001', 'user-jugador');
    expect(removeMiembro.execute).toHaveBeenCalledWith({
      authId: 'auth-0001',
      equipoId: 'equipo-0001',
      usuarioId: 'user-jugador',
    });
  });

  it('invitar delega en InvitarJugadorUseCase', () => {
    void controller.invitar(user, 'equipo-0001', {
      jugadorEmail: 'jugador@example.com',
      mensaje: 'Bienvenido',
    });
    expect(invitarJugador.execute).toHaveBeenCalledWith({
      authId: 'auth-0001',
      equipoId: 'equipo-0001',
      jugadorEmail: 'jugador@example.com',
      mensaje: 'Bienvenido',
    });
  });

  it('invitaciones delega en ListInvitacionesEquipoUseCase', () => {
    void controller.invitaciones(user, 'equipo-0001');
    expect(listInvitacionesEquipo.execute).toHaveBeenCalledWith({
      authId: 'auth-0001',
      equipoId: 'equipo-0001',
    });
  });

  it('programarPartido delega en CreatePartidoUseCase', () => {
    void controller.programarPartido(user, 'equipo-0001', {
      rival: 'Rival FC',
      fecha: '2026-08-15T18:00:00.000Z',
    });
    expect(createPartido.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        authId: 'auth-0001',
        equipoId: 'equipo-0001',
        rival: 'Rival FC',
      }),
    );
  });

  it('partidos usa "todos" cuando el query no es válido', () => {
    void controller.partidos(user, 'equipo-0001', 'invalido');
    expect(listPartidos.execute).toHaveBeenCalledWith({
      authId: 'auth-0001',
      equipoId: 'equipo-0001',
      filtro: 'todos',
    });
  });

  it('partidos respeta el filtro "proximos"', () => {
    void controller.partidos(user, 'equipo-0001', 'proximos');
    expect(listPartidos.execute).toHaveBeenCalledWith(
      expect.objectContaining({ filtro: 'proximos' }),
    );
  });

  it('estadisticas delega en GetEstadisticasUseCase', () => {
    void controller.estadisticas(user, 'equipo-0001');
    expect(getEstadisticas.execute).toHaveBeenCalledWith({
      authId: 'auth-0001',
      equipoId: 'equipo-0001',
    });
  });
});
