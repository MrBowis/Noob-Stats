import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JugadoresRepository } from '../../domain/repositories/jugadores.repository';
import { SupabaseAuthGuard } from './supabase-auth.guard';

function contextWith(authorization?: string): {
  ctx: ExecutionContext;
  request: {
    headers: { authorization?: string };
    user?: unknown;
    accessToken?: string;
  };
} {
  const request = { headers: { authorization }, user: undefined };
  const ctx = {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
  return { ctx, request };
}

describe('SupabaseAuthGuard', () => {
  let repo: jest.Mocked<Pick<JugadoresRepository, 'getUserFromAccessToken'>>;
  let guard: SupabaseAuthGuard;

  beforeEach(() => {
    repo = { getUserFromAccessToken: jest.fn() };
    guard = new SupabaseAuthGuard(repo as unknown as JugadoresRepository);
  });

  it('lanza Unauthorized si falta el header', async () => {
    const { ctx } = contextWith(undefined);
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('lanza Unauthorized si el esquema no es Bearer', async () => {
    const { ctx } = contextWith('Basic abc');
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('lanza Unauthorized si el token es inválido', async () => {
    repo.getUserFromAccessToken.mockResolvedValue(null);
    const { ctx } = contextWith('Bearer bad-token');
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('adjunta el usuario y el token crudo al request cuando es válido', async () => {
    const user = { id: 'auth-1', email: 'a@b.com', fullName: null };
    repo.getUserFromAccessToken.mockResolvedValue(user);
    const { ctx, request } = contextWith('Bearer good-token');

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(request.user).toEqual(user);
    expect(request.accessToken).toBe('good-token');
  });
});
