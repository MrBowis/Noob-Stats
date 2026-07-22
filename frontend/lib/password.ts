const MIN_LENGTH = 8;
const UPPERCASE_RE = /[A-Z]/;
const LOWERCASE_RE = /[a-z]/;
const NUMBER_RE = /[0-9]/;
const SPECIAL_RE = /[^A-Za-z0-9]/;

/**
 * Valida que la contraseña cumpla reglas mínimas de seguridad.
 * Devuelve el mensaje de error a mostrar, o null si es válida.
 */
export function validatePasswordStrength(password: string): string | null {
  if (password.length < MIN_LENGTH) {
    return `La contraseña debe tener al menos ${MIN_LENGTH} caracteres`;
  }
  if (!UPPERCASE_RE.test(password)) {
    return 'La contraseña debe incluir al menos una mayúscula';
  }
  if (!LOWERCASE_RE.test(password)) {
    return 'La contraseña debe incluir al menos una minúscula';
  }
  if (!NUMBER_RE.test(password)) {
    return 'La contraseña debe incluir al menos un número';
  }
  if (!SPECIAL_RE.test(password)) {
    return 'La contraseña debe incluir al menos un carácter especial';
  }
  return null;
}
