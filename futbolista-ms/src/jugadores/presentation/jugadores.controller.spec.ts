import { BadRequestException } from '@nestjs/common';
import type { AuthUser } from '../domain/entities/auth-user.entity';
import { JugadoresController } from './jugadores.controller';

const user: AuthUser = { id: 'auth-0001', email: 'a@b.com', fullName: null };

describe('JugadoresController', () => {
  const createJugador = { execute: jest.fn() };
  const listJugadores = { execute: jest.fn() };
  const getJugador = { execute: jest.fn() };
  const getMiJugador = { execute: jest.fn() };
  const updateJugador = { execute: jest.fn() };
  const getFisico = { execute: jest.fn() };
  const updateFisico = { execute: jest.fn() };
  const listPosiciones = { execute: jest.fn() };
  const addPosicion = { execute: jest.fn() };
  const updatePosicion = { execute: jest.fn() };
  const deletePosicion = { execute: jest.fn() };
  const getAtributos = { execute: jest.fn() };
  const updateAtributos = { execute: jest.fn() };
  const getResumenAtributos = { execute: jest.fn() };
  const getResumen = { execute: jest.fn() };
  const listEquipos = { execute: jest.fn() };
  const uploadFoto = { execute: jest.fn() };

  const controller = new JugadoresController(
    createJugador as never,
    listJugadores as never,
    getJugador as never,
    getMiJugador as never,
    updateJugador as never,
    getFisico as never,
    updateFisico as never,
    listPosiciones as never,
    addPosicion as never,
    updatePosicion as never,
    deletePosicion as never,
    getAtributos as never,
    updateAtributos as never,
    getResumenAtributos as never,
    getResumen as never,
    listEquipos as never,
    uploadFoto as never,
  );

  afterEach(() => jest.clearAllMocks());

  it('create delega en CreateJugadorUseCase', () => {
    void controller.create(user, { nacionalidad: 'Ecuatoriana' });
    expect(createJugador.execute).toHaveBeenCalledWith(
      expect.objectContaining({ authId: 'auth-0001' }),
    );
  });

  it('list delega en ListJugadoresUseCase', () => {
    void controller.list('PORTERO', 'DERECHA', 'ACTIVO');
    expect(listJugadores.execute).toHaveBeenCalledWith({
      posicion: 'PORTERO',
      piernaHabil: 'DERECHA',
      estado: 'ACTIVO',
    });
  });

  it('getMine delega en GetMiJugadorUseCase', () => {
    void controller.getMine(user);
    expect(getMiJugador.execute).toHaveBeenCalledWith({ authId: 'auth-0001' });
  });

  it('getOne delega en GetJugadorUseCase', () => {
    void controller.getOne('jugador-0001');
    expect(getJugador.execute).toHaveBeenCalledWith({
      jugadorId: 'jugador-0001',
    });
  });

  it('update delega en UpdateJugadorUseCase', () => {
    void controller.update(user, 'jugador-0001', { nacionalidad: 'Chile' });
    expect(updateJugador.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        authId: 'auth-0001',
        jugadorId: 'jugador-0001',
      }),
    );
  });

  it('postFoto delega en UploadFotoUseCase cuando llega un archivo', () => {
    const file = {
      buffer: Buffer.from('img'),
      mimetype: 'image/png',
      originalname: 'foto.png',
    } as Express.Multer.File;

    void controller.postFoto(user, 'jugador-0001', file);

    expect(uploadFoto.execute).toHaveBeenCalledWith({
      authId: 'auth-0001',
      jugadorId: 'jugador-0001',
      foto: {
        buffer: file.buffer,
        mimeType: 'image/png',
        fileName: 'foto.png',
      },
    });
  });

  it('postFoto lanza BadRequestException si no llega archivo', () => {
    expect(() => controller.postFoto(user, 'jugador-0001', undefined)).toThrow(
      BadRequestException,
    );
    expect(uploadFoto.execute).not.toHaveBeenCalled();
  });

  it('fisico delega en GetFisicoUseCase', () => {
    void controller.fisico('jugador-0001');
    expect(getFisico.execute).toHaveBeenCalledWith({
      jugadorId: 'jugador-0001',
    });
  });

  it('putFisico delega en UpdateFisicoUseCase', () => {
    void controller.putFisico(user, 'jugador-0001', { alturaCm: 180 });
    expect(updateFisico.execute).toHaveBeenCalledWith(
      expect.objectContaining({ authId: 'auth-0001', alturaCm: 180 }),
    );
  });

  it('posiciones delega en ListPosicionesUseCase', () => {
    void controller.posiciones('jugador-0001');
    expect(listPosiciones.execute).toHaveBeenCalledWith({
      jugadorId: 'jugador-0001',
    });
  });

  it('postPosicion delega en AddPosicionUseCase', () => {
    void controller.postPosicion(user, 'jugador-0001', {
      posicion: 'PORTERO',
    });
    expect(addPosicion.execute).toHaveBeenCalledWith(
      expect.objectContaining({ authId: 'auth-0001', posicion: 'PORTERO' }),
    );
  });

  it('putPosicion delega en UpdatePosicionUseCase', () => {
    void controller.putPosicion(user, 'jugador-0001', 'pos-0001', {
      esPrincipal: true,
    });
    expect(updatePosicion.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        authId: 'auth-0001',
        jugadorId: 'jugador-0001',
        posicionId: 'pos-0001',
      }),
    );
  });

  it('removePosicion delega en DeletePosicionUseCase', () => {
    void controller.removePosicion(user, 'jugador-0001', 'pos-0001');
    expect(deletePosicion.execute).toHaveBeenCalledWith({
      authId: 'auth-0001',
      jugadorId: 'jugador-0001',
      posicionId: 'pos-0001',
    });
  });

  it('atributos delega en GetAtributosUseCase', () => {
    void controller.atributos('jugador-0001');
    expect(getAtributos.execute).toHaveBeenCalledWith({
      jugadorId: 'jugador-0001',
    });
  });

  it('putAtributos delega en UpdateAtributosUseCase', () => {
    void controller.putAtributos(user, 'jugador-0001', {
      ataque: 80,
      tactica: 70,
      tecnica: 60,
      defensa: 50,
      creatividad: 90,
    });
    expect(updateAtributos.execute).toHaveBeenCalledWith(
      expect.objectContaining({ authId: 'auth-0001', ataque: 80 }),
    );
  });

  it('resumenAtributos delega en GetResumenAtributosUseCase', () => {
    void controller.resumenAtributos('jugador-0001');
    expect(getResumenAtributos.execute).toHaveBeenCalledWith({
      jugadorId: 'jugador-0001',
    });
  });

  it('resumen delega en GetResumenUseCase', () => {
    void controller.resumen('jugador-0001');
    expect(getResumen.execute).toHaveBeenCalledWith({
      jugadorId: 'jugador-0001',
    });
  });

  it('equipos delega en ListEquiposJugadorUseCase reenviando el token', () => {
    void controller.equipos(user, 'token-crudo', 'jugador-0001');
    expect(listEquipos.execute).toHaveBeenCalledWith({
      authId: 'auth-0001',
      accessToken: 'token-crudo',
      jugadorId: 'jugador-0001',
    });
  });
});
