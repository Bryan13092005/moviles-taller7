export const DISPLAY_NAME_MAX_LENGTH = 60;

/** Quita espacios repetidos al inicio, al final y entre palabras. */
export function normalizarNombre(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

export function validarNombre(value: string): string | undefined {
  const nombre = normalizarNombre(value);
  if (!nombre) return 'El nombre es obligatorio';
  if (nombre.length < 2) return 'El nombre debe tener al menos 2 caracteres';
  if (nombre.length > DISPLAY_NAME_MAX_LENGTH) {
    return `El nombre no puede superar los ${DISPLAY_NAME_MAX_LENGTH} caracteres`;
  }
  return undefined;
}
