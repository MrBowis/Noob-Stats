/**
 * Divide un nombre completo (proveniente p. ej. de Google) en nombres y
 * apellidos de forma best-effort: la última palabra es el apellido y el resto
 * los nombres. Si solo hay una palabra, se usa para ambos campos.
 */
export function splitFullName(fullName: string | null | undefined): {
  nombres: string;
  apellidos: string;
} {
  const clean = (fullName ?? '').trim().replace(/\s+/g, ' ');
  if (!clean) {
    return { nombres: 'Usuario', apellidos: 'Noob Stats' };
  }
  const parts = clean.split(' ');
  if (parts.length === 1) {
    return { nombres: parts[0], apellidos: parts[0] };
  }
  return {
    nombres: parts.slice(0, -1).join(' '),
    apellidos: parts[parts.length - 1],
  };
}
