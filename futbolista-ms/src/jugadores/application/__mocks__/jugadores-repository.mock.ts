import { Posicion } from '../../domain/catalogos';
import {
  Jugador,
  JugadorAtributo,
  JugadorFisico,
  JugadorLesion,
  JugadorPosicion,
} from '../../domain/entities/jugador.entity';
import { Usuario } from '../../domain/entities/usuario.entity';
import { EquiposGateway } from '../../domain/repositories/equipos.gateway';
import { JugadoresRepository } from '../../domain/repositories/jugadores.repository';

export type MockJugadoresRepository = jest.Mocked<JugadoresRepository>;
export type MockEquiposGateway = jest.Mocked<EquiposGateway>;

export function createMockJugadoresRepository(): MockJugadoresRepository {
  return {
    getUserFromAccessToken: jest.fn(),
    findUsuarioByAuthId: jest.fn(),
    findUsuariosByIds: jest.fn(),
    createJugador: jest.fn(),
    findJugadorById: jest.fn(),
    findJugadorByUserId: jest.fn(),
    listJugadores: jest.fn(),
    updateJugador: jest.fn(),
    uploadFotoPerfil: jest.fn(),
    findFisico: jest.fn(),
    findFisicoByJugadorIds: jest.fn(),
    upsertFisico: jest.fn(),
    listPosiciones: jest.fn(),
    listPosicionesByJugadorIds: jest.fn(),
    findPosicionById: jest.fn(),
    createPosicion: jest.fn(),
    updatePosicion: jest.fn(),
    deletePosicion: jest.fn(),
    clearPosicionPrincipal: jest.fn(),
    findAtributos: jest.fn(),
    findAtributosByJugadorIds: jest.fn(),
    upsertAtributos: jest.fn(),
    listLesiones: jest.fn(),
    findLesionById: jest.fn(),
    createLesion: jest.fn(),
    updateLesion: jest.fn(),
    deleteLesion: jest.fn(),
  };
}

export function createMockEquiposGateway(): MockEquiposGateway {
  return { listEquiposDelUsuario: jest.fn() };
}

// ---------------- Fixtures ----------------

export const AUTH_ID = 'auth-0001';
export const USER_ID = 'user-0001';
export const JUGADOR_ID = 'jugador-0001';

export function makeUsuario(overrides: Partial<Usuario> = {}): Usuario {
  return {
    id: USER_ID,
    supabaseAuthId: AUTH_ID,
    email: 'jugador@example.com',
    rolNombre: 'Futbolista',
    nombres: 'Juan',
    apellidos: 'Pérez',
    fechaNacimiento: '2002-05-15',
    ...overrides,
  };
}

export function makeJugador(overrides: Partial<Jugador> = {}): Jugador {
  return {
    id: JUGADOR_ID,
    userId: USER_ID,
    genero: 'MASCULINO',
    nacionalidad: 'Ecuatoriana',
    fotoUrl: null,
    piernaHabil: 'DERECHA',
    estado: 'ACTIVO',
    fechaCreacion: '2026-07-01T00:00:00.000Z',
    fechaActualizacion: '2026-07-01T00:00:00.000Z',
    ...overrides,
  };
}

export function makeFisico(
  overrides: Partial<JugadorFisico> = {},
): JugadorFisico {
  return {
    id: 'fisico-0001',
    jugadorId: JUGADOR_ID,
    alturaCm: 178.5,
    pesoKg: 72,
    fechaActualizacion: '2026-07-01T00:00:00.000Z',
    ...overrides,
  };
}

export function makePosicion(
  posicion: Posicion,
  esPrincipal: boolean,
  id = `pos-${posicion}`,
): JugadorPosicion {
  return { id, jugadorId: JUGADOR_ID, posicion, esPrincipal };
}

export function makeAtributos(
  overrides: Partial<JugadorAtributo> = {},
): JugadorAtributo {
  return {
    id: 'atr-0001',
    jugadorId: JUGADOR_ID,
    ataque: 82,
    tactica: 70,
    tecnica: 88,
    defensa: 45,
    creatividad: 91,
    fechaActualizacion: '2026-07-01T00:00:00.000Z',
    ...overrides,
  };
}

export function makeLesion(
  overrides: Partial<JugadorLesion> = {},
): JugadorLesion {
  return {
    id: 'lesion-0001',
    jugadorId: JUGADOR_ID,
    parteCuerpo: 'TOBILLO',
    nota: 'Esguince de tobillo',
    fechaInicio: '2026-05-15',
    fechaFin: null,
    estado: 'ACTIVA',
    fechaCreacion: '2026-05-15T00:00:00.000Z',
    fechaActualizacion: '2026-05-15T00:00:00.000Z',
    ...overrides,
  };
}
