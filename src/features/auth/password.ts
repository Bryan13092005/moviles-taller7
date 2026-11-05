export const PASSWORD_MIN_LENGTH = 6;

export const PASSWORD_POLICY_HINT =
  'Mínimo 6 caracteres, con al menos una mayúscula, una minúscula y un número.';

export interface PasswordChecks {
  length: boolean;
  uppercase: boolean;
  lowercase: boolean;
  number: boolean;
}

/** Evalúa cada regla de la política de contraseñas. */
export function obtenerChecksContrasena(value: string): PasswordChecks {
  return {
    length: value.length >= PASSWORD_MIN_LENGTH,
    uppercase: /[A-Z]/.test(value),
    lowercase: /[a-z]/.test(value),
    number: /\d/.test(value),
  };
}

export function cumplePoliticaContrasena(value: string): boolean {
  const checks = obtenerChecksContrasena(value);
  return checks.length && checks.uppercase && checks.lowercase && checks.number;
}

export type FortalezaContrasena = 'vacia' | 'debil' | 'media' | 'fuerte';

/**
 * Calcula la fortaleza visual de la contraseña.
 * - Débil: no cumple la política mínima.
 * - Media: cumple la política, pero aún no suma longitud y símbolo.
 * - Fuerte: cumple la política y tiene 12+ caracteres o 10+ con símbolo.
 */
export function calcularFortalezaContrasena(value: string): FortalezaContrasena {
  if (!value) return 'vacia';
  if (!cumplePoliticaContrasena(value)) return 'debil';

  const tieneSimbolo = /[^A-Za-z0-9]/.test(value);
  const esFuerte = value.length >= 12 || (value.length >= 10 && tieneSimbolo);
  return esFuerte ? 'fuerte' : 'media';
}

/** Devuelve el primer problema encontrado o undefined si la contraseña es válida. */
export function validarContrasena(value: string): string | undefined {
  if (!value) return 'La contraseña es obligatoria';
  if (value.length < PASSWORD_MIN_LENGTH) {
    return `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres`;
  }
  if (!/[A-Z]/.test(value)) return 'La contraseña debe incluir al menos una letra mayúscula';
  if (!/[a-z]/.test(value)) return 'La contraseña debe incluir al menos una letra minúscula';
  if (!/\d/.test(value)) return 'La contraseña debe incluir al menos un número';
  return undefined;
}

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validarEmail(value: string): string | undefined {
  if (!value.trim()) return 'El correo electrónico es obligatorio';
  if (!EMAIL_REGEX.test(value.trim())) return 'Ingresa un correo electrónico válido';
  return undefined;
}
