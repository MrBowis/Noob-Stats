import { config } from './config';
import { AuthResponse, AuthSessionDto, RegisterPayload, UserProfile } from './types';

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; token?: string } = {},
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const response = await fetch(`${config.authApiUrl}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const text = await response.text();
  const data: unknown = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message =
      (data as { message?: string } | null)?.message ??
      `Error ${response.status}`;
    throw new ApiError(response.status, message);
  }

  return data as T;
}

/**
 * Cliente del microservicio auth-ms.
 */
export const authApi = {
  register(payload: RegisterPayload): Promise<AuthResponse> {
    return request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: payload,
    });
  },

  login(email: string, password: string): Promise<AuthResponse> {
    return request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
  },

  googleUrl(redirectTo: string): Promise<{ url: string }> {
    const params = new URLSearchParams({ redirectTo });
    return request<{ url: string }>(`/auth/google/url?${params.toString()}`);
  },

  googleCallback(
    accessToken: string,
  ): Promise<{ profile: UserProfile; isNewUser: boolean }> {
    return request('/auth/google/callback', {
      method: 'POST',
      body: { accessToken },
    });
  },

  refresh(refreshToken: string): Promise<AuthSessionDto> {
    return request<AuthSessionDto>('/auth/refresh', {
      method: 'POST',
      body: { refreshToken },
    });
  },

  me(token: string): Promise<UserProfile> {
    return request<UserProfile>('/auth/me', { token });
  },
};

export { ApiError };
