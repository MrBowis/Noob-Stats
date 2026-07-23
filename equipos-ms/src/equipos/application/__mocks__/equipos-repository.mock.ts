import { EquipoMiembro } from '../../domain/entities/equipo-miembro.entity';
import { Equipo } from '../../domain/entities/equipo.entity';
import { Invitacion } from '../../domain/entities/invitacion.entity';
import { Partido } from '../../domain/entities/partido.entity';
import { Usuario } from '../../domain/entities/usuario.entity';
import { EquiposRepository } from '../../domain/repositories/equipos.repository';

export type MockEquiposRepository = jest.Mocked<EquiposRepository>;

export function createMockEquiposRepository(): MockEquiposRepository {
  return {
    getUserFromAccessToken: jest.fn(),
    findUsuarioByAuthId: jest.fn(),
    findUsuarioByEmail: jest.fn(),
    createEquipo: jest.fn(),
    findEquipoById: jest.fn(),
    listEquiposByUsuario: jest.fn(),
    updateEquipo: jest.fn(),
    deleteEquipo: jest.fn(),
    findMiembro: jest.fn(),
    listMiembros: jest.fn(),
    countMiembros: jest.fn(),
    addMiembro: jest.fn(),
    updateMiembro: jest.fn(),
    removeMiembro: jest.fn(),
    clearSlot: jest.fn(),
    createInvitacion: jest.fn(),
    findInvitacionById: jest.fn(),
    findInvitacionPendiente: jest.fn(),
    listInvitacionesByEquipo: jest.fn(),
    listInvitacionesByUsuario: jest.fn(),
    updateInvitacionEstado: jest.fn(),
    createPartido: jest.fn(),
    findPartidoById: jest.fn(),
    findPartidoDetalleById: jest.fn(),
    listPartidosByEquipo: jest.fn(),
    updatePartido: jest.fn(),
    deletePartido: jest.fn(),
    addGol: jest.fn(),
    findGolById: jest.fn(),
    deleteGol: jest.fn(),
    addTarjeta: jest.fn(),
    findTarjetaById: jest.fn(),
    deleteTarjeta: jest.fn(),
  };
}

// ---------------- Fixtures ----------------

export const AUTH_ID = 'auth-0001';
export const ENTRENADOR_ID = 'user-entrenador';
export const JUGADOR_ID = 'user-jugador';
export const EQUIPO_ID = 'equipo-0001';

export function makeEntrenador(overrides: Partial<Usuario> = {}): Usuario {
  return {
    id: ENTRENADOR_ID,
    personaId: 'per-entrenador',
    rolId: 'rol-entrenador',
    rolNombre: 'Entrenador',
    supabaseAuthId: AUTH_ID,
    email: 'entrenador@example.com',
    nombres: 'Marcelo',
    apellidos: 'Bielsa',
    estado: 'activo',
    ...overrides,
  };
}

export function makeJugador(overrides: Partial<Usuario> = {}): Usuario {
  return {
    id: JUGADOR_ID,
    personaId: 'per-jugador',
    rolId: 'rol-futbolista',
    rolNombre: 'Futbolista',
    supabaseAuthId: 'auth-jugador',
    email: 'jugador@example.com',
    nombres: 'Diego',
    apellidos: 'Chalá',
    estado: 'activo',
    ...overrides,
  };
}

export function makeEquipo(overrides: Partial<Equipo> = {}): Equipo {
  return {
    id: EQUIPO_ID,
    nombre: 'Noob FC',
    descripcion: null,
    categoria: null,
    ciudad: null,
    escudoUrl: null,
    formacion: '4-4-2',
    entrenadorId: ENTRENADOR_ID,
    createdAt: '2026-07-01T00:00:00.000Z',
    ...overrides,
  };
}

export function makeMiembro(
  overrides: Partial<EquipoMiembro> = {},
): EquipoMiembro {
  return {
    id: 'miembro-0001',
    equipoId: EQUIPO_ID,
    usuarioId: JUGADOR_ID,
    dorsal: 9,
    posicion: 'Delantero',
    slot: null,
    estado: 'activo',
    joinedAt: '2026-07-01T00:00:00.000Z',
    ...overrides,
  };
}

export function makeInvitacion(
  overrides: Partial<Invitacion> = {},
): Invitacion {
  return {
    id: 'invitacion-0001',
    equipoId: EQUIPO_ID,
    usuarioId: JUGADOR_ID,
    estado: 'pendiente',
    mensaje: null,
    createdAt: '2026-07-01T00:00:00.000Z',
    respondedAt: null,
    ...overrides,
  };
}

export function makePartido(overrides: Partial<Partido> = {}): Partido {
  return {
    id: 'partido-0001',
    equipoId: EQUIPO_ID,
    rival: 'Deportivo Rival',
    fecha: '2026-08-15T18:00:00.000Z',
    ubicacion: null,
    esLocal: true,
    estado: 'programado',
    golesFavor: null,
    golesContra: null,
    notas: null,
    createdAt: '2026-07-01T00:00:00.000Z',
    ...overrides,
  };
}
