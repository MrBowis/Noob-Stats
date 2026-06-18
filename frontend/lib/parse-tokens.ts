export interface OAuthTokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * Extrae access_token y refresh_token de la URL de retorno del flujo OAuth de
 * Supabase. Supabase los devuelve en el fragmento (#) y, según el flujo,
 * a veces en el query (?). Esta función contempla ambos casos.
 */
export function parseTokensFromUrl(url: string): OAuthTokens | null {
  const params = new URLSearchParams();

  const fragmentIndex = url.indexOf('#');
  const queryIndex = url.indexOf('?');

  // Query se carga primero para que el fragmento pueda sobreescribirlo.
  // Supabase OAuth siempre devuelve los tokens en el fragmento (#).
  if (queryIndex >= 0) {
    const end = fragmentIndex >= 0 ? fragmentIndex : url.length;
    new URLSearchParams(url.slice(queryIndex + 1, end)).forEach((v, k) =>
      params.set(k, v),
    );
  }

  if (fragmentIndex >= 0) {
    new URLSearchParams(url.slice(fragmentIndex + 1)).forEach((v, k) =>
      params.set(k, v),
    );
  }

  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  if (!accessToken || !refreshToken) {
    return null;
  }
  return { accessToken, refreshToken };
}
