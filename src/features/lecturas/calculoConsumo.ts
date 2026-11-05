export interface ResultadoConsumo {
  consumo: number;
  esAnomalo: boolean;
}

// R6: anomalía cuando el consumo supera 3 veces el promedio mensual.
export function calcularConsumo(
  lecturaActual: number,
  ultimaLectura: number,
  promedioMensual: number,
): ResultadoConsumo {
  const consumo = lecturaActual - ultimaLectura;
  return { consumo, esAnomalo: consumo > promedioMensual * 3 };
}
