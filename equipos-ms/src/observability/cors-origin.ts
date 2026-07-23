/**
 * Resuelve la configuración de CORS a partir de `ALLOWED_ORIGIN`.
 *
 * Nunca refleja un comodín (`*`) por defecto: si la variable no está
 * configurada, se deniega el acceso entre orígenes en lugar de abrirlo a
 * cualquiera (un CORS permisivo por defecto es un hotspot de seguridad).
 * Admite un origen único o una lista separada por comas.
 */
export function resolveCorsOrigin(
  allowedOrigin: string | undefined,
): string | string[] | boolean {
  const value = allowedOrigin?.trim();
  if (!value) return false;
  if (value === '*') return '*';

  const origins = value
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  return origins.length > 1 ? origins : origins[0];
}
