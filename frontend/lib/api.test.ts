import { ApiError, authApi } from './api';

interface FetchResult {
  ok: boolean;
  status: number;
  text: () => Promise<string>;
}

function jsonResponse(body: unknown, ok = true, status = 200): FetchResult {
  return { ok, status, text: () => Promise.resolve(JSON.stringify(body)) };
}

function emptyResponse(status = 204): FetchResult {
  return { ok: true, status, text: () => Promise.resolve('') };
}

describe('authApi', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    (global as unknown as { fetch: jest.Mock }).fetch = fetchMock;
    fetchMock.mockReset();
  });

  // ── Helpers de request ─────────────────────────────────────────────────────

  it('usa cache: no-store en todas las peticiones', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ rol: {} }));
    await authApi.me('tok');
    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(options.cache).toBe('no-store');
  });

  it('lanza ApiError ante respuesta no-ok con mensaje', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ message: 'credenciales inválidas' }, false, 401),
    );
    const err = await authApi.login('a@b.com', 'bad').catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(401);
    expect((err as ApiError).message).toBe('credenciales inválidas');
  });

  it('lanza ApiError con mensaje fallback cuando el body no tiene message', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, false, 500));
    const err = await authApi.login('a@b.com', 'bad').catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).message).toBe('Error 500');
  });

  it('maneja respuesta vacía sin lanzar error', async () => {
    fetchMock.mockResolvedValue(emptyResponse(204));
    const result = await authApi.me('tok');
    expect(result).toBeNull();
  });

  // ── login ──────────────────────────────────────────────────────────────────

  it('login envía credenciales por POST', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ session: null, profile: { rol: {} } }),
    );

    await authApi.login('a@b.com', 'pw');

    const [url, options] = fetchMock.mock.calls[0] as [
      string,
      { method: string; body: string },
    ];
    expect(url).toContain('/auth/login');
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body)).toEqual({ email: 'a@b.com', password: 'pw' });
  });

  // ── register ───────────────────────────────────────────────────────────────

  it('register reenvía el payload completo', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ session: null, profile: { rol: {} } }),
    );

    await authApi.register({
      email: 'a@b.com',
      password: 'pw',
      nombres: 'Juan',
      apellidos: 'Pérez',
    });

    const [url, options] = fetchMock.mock.calls[0] as [
      string,
      { method: string; body: string },
    ];
    expect(url).toContain('/auth/register');
    expect(JSON.parse(options.body)).toMatchObject({ nombres: 'Juan' });
  });

  // ── me ─────────────────────────────────────────────────────────────────────

  it('me adjunta el Bearer token en Authorization', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ rol: {} }));

    await authApi.me('my-token');

    const [url, options] = fetchMock.mock.calls[0] as [
      string,
      { headers: Record<string, string> },
    ];
    expect(url).toContain('/auth/me');
    expect(options.headers.Authorization).toBe('Bearer my-token');
  });

  // ── googleUrl ──────────────────────────────────────────────────────────────

  it('googleUrl devuelve { url } cuando el backend responde { url: string }', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ url: 'https://oauth.example.com' }),
    );

    const result = await authApi.googleUrl('noobstats://auth-callback');

    expect(result).toEqual({ url: 'https://oauth.example.com' });
    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain('/auth/google/url');
    expect(url).toContain('redirectTo=');
  });

  it('googleUrl maneja respuesta legacy (string plano)', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify('https://oauth.example.com')),
    });

    const result = await authApi.googleUrl('noobstats://auth-callback');

    expect(result).toEqual({ url: 'https://oauth.example.com' });
  });

  // ── googleCallback ─────────────────────────────────────────────────────────

  it('googleCallback envía accessToken por POST', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ profile: { rol: {} }, isNewUser: false }),
    );

    await authApi.googleCallback('access-tok');

    const [url, options] = fetchMock.mock.calls[0] as [
      string,
      { method: string; body: string },
    ];
    expect(url).toContain('/auth/google/callback');
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body)).toEqual({ accessToken: 'access-tok' });
  });

  // ── refresh ────────────────────────────────────────────────────────────────

  it('refresh envía refreshToken por POST y devuelve nueva sesión', async () => {
    const session = {
      accessToken: 'new-at',
      refreshToken: 'new-rt',
      expiresAt: 9999999,
      tokenType: 'bearer',
    };
    fetchMock.mockResolvedValue(jsonResponse(session));

    const result = await authApi.refresh('old-rt');

    const [url, options] = fetchMock.mock.calls[0] as [
      string,
      { method: string; body: string },
    ];
    expect(url).toContain('/auth/refresh');
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body)).toEqual({ refreshToken: 'old-rt' });
    expect(result).toEqual(session);
  });
});
