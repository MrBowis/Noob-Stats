import { AuthRepository } from '../../domain/repositories/auth.repository';

export type MockAuthRepository = jest.Mocked<AuthRepository>;

export function createMockAuthRepository(): MockAuthRepository {
  return {
    signUpWithEmail: jest.fn(),
    signInWithEmail: jest.fn(),
    getOAuthSignInUrl: jest.fn(),
    getUserFromAccessToken: jest.fn(),
    refreshSession: jest.fn(),
    findRolById: jest.fn(),
    findRolByNombre: jest.fn(),
    createPersona: jest.fn(),
    createUsuario: jest.fn(),
    updatePersona: jest.fn(),
    findUsuarioByAuthId: jest.fn(),
    findProfileByAuthId: jest.fn(),
  };
}
