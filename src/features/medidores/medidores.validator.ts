export const CODIGO_MEDIDOR_REGEX = /^MED-\d{6}$/;

export interface ResultadoValidacion {
  esValido: boolean;
  mensajeError?: string;
}

export function validarCodigoMedidor(codigo: string): ResultadoValidacion {
  if (!codigo || !codigo.trim()) {
    return { esValido: false, mensajeError: 'El código del medidor es obligatorio' };
  }
  if (!CODIGO_MEDIDOR_REGEX.test(codigo)) {
    return { esValido: false, mensajeError: 'Formato inválido. Use MED- seguido de 6 dígitos (ej. MED-123456)' };
  }
  return { esValido: true };
}
