import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import {
  AuthProviderError,
  EmailAlreadyInUseError,
  InvalidCredentialsError,
} from '../domain/exceptions/auth.errors';
import { SupabaseAuthRepository } from './supabase-auth.repository';

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

interface FakeBuilder {
  select: jest.Mock;
  insert: jest.Mock;
  eq: jest.Mock;
  maybeSingle: jest.Mock;
  single: jest.Mock;
}

interface FakeClient {
  auth: {
    signUp: jest.Mock;
    signInWithPassword: jest.Mock;
    signInWithOAuth: jest.Mock;
    getUser: jest.Mock;
    refreshSession: jest.Mock;
  };
  from: jest.Mock;
  __builder: FakeBuilder;
}

function makeClient(): FakeClient {
  const builder: FakeBuilder = {
    select: jest.fn(),
    insert: jest.fn(),
    eq: jest.fn(),
    maybeSingle: jest.fn(),
    single: jest.fn(),
  };
  builder.select.mockReturnValue(builder);
  builder.insert.mockReturnValue(builder);
  builder.eq.mockReturnValue(builder);

  return {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signInWithOAuth: jest.fn(),
      getUser: jest.fn(),
      refreshSession: jest.fn(),
    },
    from: jest.fn(() => builder),
    __builder: builder,
  };
}

const config = {
  getOrThrow: (key: string) => `value-${key}`,
} as unknown as ConfigService;

describe('SupabaseAuthRepository', () => {
  let client: FakeClient;
  let repo: SupabaseAuthRepository;

  beforeEach(() => {
    client = makeClient();
    (createClient as jest.Mock).mockReturnValue(client);
    repo = new SupabaseAuthRepository(config);
  });

  describe('signUpWithEmail', () => {
    it('devuelve user + session', async () => {
      client.auth.signUp.mockResolvedValue({
        data: {
          user: { id: 'auth-1', email: 'a@b.com', user_metadata: {} },
          session: {
            access_token: 'at',
            refresh_token: 'rt',
            expires_at: 1,
            token_type: 'bearer',
          },
        },
        error: null,
      });

      const result = await repo.signUpWithEmail('a@b.com', 'secret');
      expect(result.user.id).toBe('auth-1');
      expect(result.session?.accessToken).toBe('at');
    });

    it('lanza EmailAlreadyInUseError cuando ya existe', async () => {
      client.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'User already registered' },
      });
      await expect(repo.signUpWithEmail('a@b.com', 'x')).rejects.toBeInstanceOf(
        EmailAlreadyInUseError,
      );
    });

    it('lanza AuthProviderError ante otros errores', async () => {
      client.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'weak password' },
      });
      await expect(repo.signUpWithEmail('a@b.com', 'x')).rejects.toBeInstanceOf(
        AuthProviderError,
      );
    });
  });

  describe('signInWithEmail', () => {
    it('devuelve user + session', async () => {
      client.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: {
            id: 'auth-1',
            email: 'a@b.com',
            user_metadata: { name: 'A' },
          },
          session: {
            access_token: 'at',
            refresh_token: 'rt',
            expires_at: 1,
            token_type: 'bearer',
          },
        },
        error: null,
      });

      const result = await repo.signInWithEmail('a@b.com', 'secret');
      expect(result.session.accessToken).toBe('at');
      expect(result.user.fullName).toBe('A');
    });

    it('lanza InvalidCredentialsError ante error', async () => {
      client.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' },
      });
      await expect(
        repo.signInWithEmail('a@b.com', 'bad'),
      ).rejects.toBeInstanceOf(InvalidCredentialsError);
    });
  });

  describe('getOAuthSignInUrl', () => {
    it('devuelve la url', async () => {
      client.auth.signInWithOAuth.mockResolvedValue({
        data: { url: 'https://oauth' },
        error: null,
      });
      await expect(repo.getOAuthSignInUrl('google', 'cb')).resolves.toBe(
        'https://oauth',
      );
    });

    it('lanza AuthProviderError si no hay url', async () => {
      client.auth.signInWithOAuth.mockResolvedValue({
        data: { url: null },
        error: { message: 'fail' },
      });
      await expect(
        repo.getOAuthSignInUrl('google', 'cb'),
      ).rejects.toBeInstanceOf(AuthProviderError);
    });
  });

  describe('refreshSession', () => {
    it('devuelve nueva sesión mapeada', async () => {
      client.auth.refreshSession.mockResolvedValue({
        data: {
          session: {
            access_token: 'new-at',
            refresh_token: 'new-rt',
            expires_at: 9999,
            token_type: 'bearer',
          },
        },
        error: null,
      });
      const session = await repo.refreshSession('old-rt');
      expect(session.accessToken).toBe('new-at');
      expect(session.refreshToken).toBe('new-rt');
    });

    it('lanza InvalidCredentialsError si falla', async () => {
      client.auth.refreshSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Token expired' },
      });
      await expect(repo.refreshSession('bad-rt')).rejects.toBeInstanceOf(
        InvalidCredentialsError,
      );
    });
  });

  describe('getUserFromAccessToken', () => {
    it('devuelve el usuario mapeado', async () => {
      client.auth.getUser.mockResolvedValue({
        data: {
          user: {
            id: 'auth-1',
            email: 'a@b.com',
            user_metadata: { full_name: 'Juan Pérez' },
          },
        },
        error: null,
      });
      const user = await repo.getUserFromAccessToken('tok');
      expect(user).toEqual({
        id: 'auth-1',
        email: 'a@b.com',
        fullName: 'Juan Pérez',
      });
    });

    it('devuelve null si el token es inválido', async () => {
      client.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'invalid' },
      });
      await expect(repo.getUserFromAccessToken('tok')).resolves.toBeNull();
    });
  });

  describe('tablas de dominio', () => {
    it('findRolByNombre mapea la fila', async () => {
      client.__builder.maybeSingle.mockResolvedValue({
        data: { id: 'rol-1', nombre_rol: 'Futbolista', descripcion: 'd' },
        error: null,
      });
      await expect(repo.findRolByNombre('Futbolista')).resolves.toEqual({
        id: 'rol-1',
        nombreRol: 'Futbolista',
        descripcion: 'd',
      });
    });

    it('findRolById devuelve null si no hay fila', async () => {
      client.__builder.maybeSingle.mockResolvedValue({
        data: null,
        error: null,
      });
      await expect(repo.findRolById('x')).resolves.toBeNull();
    });

    it('findRolByNombre lanza AuthProviderError ante error', async () => {
      client.__builder.maybeSingle.mockResolvedValue({
        data: null,
        error: { message: 'db error' },
      });
      await expect(repo.findRolByNombre('x')).rejects.toBeInstanceOf(
        AuthProviderError,
      );
    });

    it('createPersona inserta y mapea', async () => {
      client.__builder.single.mockResolvedValue({
        data: {
          id: 'per-1',
          nombres: 'Juan',
          apellidos: 'Pérez',
          correo: 'a@b.com',
          fecha_nacimiento: null,
          created_at: '2026-01-01',
        },
        error: null,
      });
      const persona = await repo.createPersona({
        nombres: 'Juan',
        apellidos: 'Pérez',
        correo: 'a@b.com',
      });
      expect(persona.id).toBe('per-1');
      expect(client.from).toHaveBeenCalledWith('persona');
    });

    it('createPersona lanza AuthProviderError ante error', async () => {
      client.__builder.single.mockResolvedValue({
        data: null,
        error: { message: 'fail' },
      });
      await expect(
        repo.createPersona({ nombres: 'a', apellidos: 'b' }),
      ).rejects.toBeInstanceOf(AuthProviderError);
    });

    it('createUsuario inserta y mapea', async () => {
      client.__builder.single.mockResolvedValue({
        data: {
          id: 'usr-1',
          persona_id: 'per-1',
          rol_id: 'rol-1',
          supabase_auth_id: 'auth-1',
          email: 'a@b.com',
          estado: 'activo',
          created_at: '2026-01-01',
        },
        error: null,
      });
      const usuario = await repo.createUsuario({
        personaId: 'per-1',
        rolId: 'rol-1',
        supabaseAuthId: 'auth-1',
        email: 'a@b.com',
      });
      expect(usuario.supabaseAuthId).toBe('auth-1');
    });

    it('createUsuario lanza AuthProviderError ante error', async () => {
      client.__builder.single.mockResolvedValue({
        data: null,
        error: { message: 'fail' },
      });
      await expect(
        repo.createUsuario({
          personaId: 'p',
          rolId: 'r',
          supabaseAuthId: 'a',
          email: 'e',
        }),
      ).rejects.toBeInstanceOf(AuthProviderError);
    });

    it('findUsuarioByAuthId mapea o devuelve null', async () => {
      client.__builder.maybeSingle.mockResolvedValue({
        data: null,
        error: null,
      });
      await expect(repo.findUsuarioByAuthId('auth-1')).resolves.toBeNull();
    });

    it('findUsuarioByAuthId lanza AuthProviderError ante error', async () => {
      client.__builder.maybeSingle.mockResolvedValue({
        data: null,
        error: { message: 'fail' },
      });
      await expect(repo.findUsuarioByAuthId('auth-1')).rejects.toBeInstanceOf(
        AuthProviderError,
      );
    });

    it('findProfileByAuthId arma el perfil completo', async () => {
      client.__builder.maybeSingle.mockResolvedValue({
        data: {
          id: 'usr-1',
          persona_id: 'per-1',
          rol_id: 'rol-1',
          supabase_auth_id: 'auth-1',
          email: 'a@b.com',
          estado: 'activo',
          created_at: '2026-01-01',
          persona: {
            id: 'per-1',
            nombres: 'Juan',
            apellidos: 'Pérez',
            correo: 'a@b.com',
            fecha_nacimiento: null,
            created_at: '2026-01-01',
          },
          rol: { id: 'rol-1', nombre_rol: 'Futbolista', descripcion: null },
        },
        error: null,
      });

      const profile = await repo.findProfileByAuthId('auth-1');
      expect(profile?.usuario.id).toBe('usr-1');
      expect(profile?.persona.nombres).toBe('Juan');
      expect(profile?.rol.nombreRol).toBe('Futbolista');
    });

    it('findProfileByAuthId devuelve null si no hay fila', async () => {
      client.__builder.maybeSingle.mockResolvedValue({
        data: null,
        error: null,
      });
      await expect(repo.findProfileByAuthId('auth-1')).resolves.toBeNull();
    });

    it('findProfileByAuthId lanza AuthProviderError ante error', async () => {
      client.__builder.maybeSingle.mockResolvedValue({
        data: null,
        error: { message: 'fail' },
      });
      await expect(repo.findProfileByAuthId('auth-1')).rejects.toBeInstanceOf(
        AuthProviderError,
      );
    });
  });
});
