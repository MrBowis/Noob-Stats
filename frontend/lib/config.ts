/**
 * Configuración leída de variables de entorno públicas de Expo.
 * Las variables deben llevar el prefijo EXPO_PUBLIC_ para estar disponibles
 * en el cliente.
 */
export const config = {
  authApiUrl: process.env.EXPO_PUBLIC_AUTH_API_URL ?? '',
  redirectScheme: process.env.EXPO_PUBLIC_AUTH_REDIRECT_SCHEME ?? 'noobstats',
};
