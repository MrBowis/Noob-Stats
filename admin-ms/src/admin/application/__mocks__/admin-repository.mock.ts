import { Persona } from '../../domain/entities/persona.entity';
import { Rol } from '../../domain/entities/rol.entity';
import { Usuario } from '../../domain/entities/usuario.entity';
import { UsuarioDetalle } from '../../domain/entities/usuario-detalle.entity';
import { AdminRepository } from '../../domain/repositories/admin.repository';

export type MockAdminRepository = jest.Mocked<AdminRepository>;

export function createMockAdminRepository(): MockAdminRepository {
  return {
    getUserFromAccessToken: jest.fn(),
    findUsuarioDetalleByAuthId: jest.fn(),
    createRol: jest.fn(),
    listRoles: jest.fn(),
    findRolById: jest.fn(),
    findRolByNombre: jest.fn(),
    updateRol: jest.fn(),
    deleteRol: jest.fn(),
    countUsuariosByRol: jest.fn(),
    createPersona: jest.fn(),
    createUsuario: jest.fn(),
    listUsuarios: jest.fn(),
    findUsuarioById: jest.fn(),
    findUsuarioDetalleById: jest.fn(),
    findUsuarioByEmail: jest.fn(),
    updatePersona: jest.fn(),
    updateUsuario: jest.fn(),
    countUsuarios: jest.fn(),
    countEquipos: jest.fn(),
    listEquiposResumen: jest.fn(),
    listPartidosFinalizados: jest.fn(),
  };
}

// ---------------- Fixtures ----------------

export const AUTH_ID = 'auth-admin';
export const ADMIN_ID = 'user-admin';

export function makeRol(overrides: Partial<Rol> = {}): Rol {
  return {
    id: 'rol-0001',
    nombreRol: 'Futbolista',
    descripcion: null,
    ...overrides,
  };
}

export function makePersona(overrides: Partial<Persona> = {}): Persona {
  return {
    id: 'per-0001',
    nombres: 'Diego',
    apellidos: 'Chalá',
    correo: 'diego@example.com',
    fechaNacimiento: null,
    createdAt: '2026-07-01T00:00:00.000Z',
    ...overrides,
  };
}

export function makeUsuario(overrides: Partial<Usuario> = {}): Usuario {
  return {
    id: 'user-0001',
    personaId: 'per-0001',
    rolId: 'rol-0001',
    supabaseAuthId: 'auth-0001',
    email: 'diego@example.com',
    estado: 'activo',
    createdAt: '2026-07-01T00:00:00.000Z',
    ...overrides,
  };
}

export function makeUsuarioDetalle(
  overrides: Partial<UsuarioDetalle> = {},
): UsuarioDetalle {
  return {
    id: 'user-0001',
    email: 'diego@example.com',
    estado: 'activo',
    supabaseAuthId: 'auth-0001',
    createdAt: '2026-07-01T00:00:00.000Z',
    persona: makePersona(),
    rol: makeRol(),
    ...overrides,
  };
}

export function makeAdminDetalle(
  overrides: Partial<UsuarioDetalle> = {},
): UsuarioDetalle {
  return makeUsuarioDetalle({
    id: ADMIN_ID,
    email: 'admin@example.com',
    supabaseAuthId: AUTH_ID,
    rol: makeRol({ id: 'rol-admin', nombreRol: 'Administrador' }),
    ...overrides,
  });
}
