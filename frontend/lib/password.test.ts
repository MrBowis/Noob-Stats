import { validatePasswordStrength } from './password';

describe('validatePasswordStrength', () => {
  it('acepta una contraseña que cumple todas las reglas', () => {
    expect(validatePasswordStrength('Abcdef1$')).toBeNull();
  });

  it('rechaza contraseñas demasiado cortas', () => {
    expect(validatePasswordStrength('Ab1$')).toMatch(/al menos 8 caracteres/);
  });

  it('rechaza contraseñas sin mayúscula', () => {
    expect(validatePasswordStrength('abcdefg1$')).toMatch(/mayúscula/);
  });

  it('rechaza contraseñas sin minúscula', () => {
    expect(validatePasswordStrength('ABCDEFG1$')).toMatch(/minúscula/);
  });

  it('rechaza contraseñas sin número', () => {
    expect(validatePasswordStrength('Abcdefgh$')).toMatch(/número/);
  });

  it('rechaza contraseñas sin carácter especial', () => {
    expect(validatePasswordStrength('Abcdefg1')).toMatch(/carácter especial/);
  });
});
