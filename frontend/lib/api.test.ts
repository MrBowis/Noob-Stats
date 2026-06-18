import { ApiError, authApi } from './api';

interface FetchResult {
  ok: boolean;
  status: number;
  text: () => Promise<string>;
}

function jsonResponse(body: unknown, ok = true, status = 200): FetchResult {
  return { ok, status, text: () => Promise.resolve(JSON.stringify(body)) };
}

describe('authApi', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    (global as unknown as { fetch: jest.Mock }).fetch = fetchMock;
    fetchMock.mockReset();
  });

  it('login envía las credenciales por POST', async () => {
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
    expect(JSON.parse(options.body)).toEqual({
      email: 'a@b.com',
      password: 'pw',
    });
  });

  it('register reenvía el payload', async () => {
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

  it('me adjunta el Bearer token', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ rol: {} }));

    await authApi.me('my-token');

    const [url, options] = fetchMock.mock.calls[0] as [
      string,
      { headers: Record<string, string> },
    ];
    expect(url).toContain('/auth/me');
    expect(options.headers.Authorization).toBe('Bearer my-token');
  });

  it('lanza ApiError ante respuesta no-ok', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ message: 'credenciales inválidas' }, false, 401),
    );

    await expect(authApi.login('a@b.com', 'bad')).rejects.toBeInstanceOf(
      ApiError,
    );
  });
});
