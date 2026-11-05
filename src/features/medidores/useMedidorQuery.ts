import { useQuery } from '@tanstack/react-query';

import { obtenerMedidor } from './medidores.service';
import { validarCodigoMedidor } from './medidores.validator';

export const medidorQueryKey = (codigo: string) => ['medidor', codigo] as const;

// R2: la consulta solo se habilita con un código válido, nunca toca red ni BD si no lo es.
export function useMedidorQuery(codigo: string | null) {
  return useQuery({
    queryKey: medidorQueryKey(codigo ?? ''),
    queryFn: () => obtenerMedidor(codigo as string),
    enabled: !!codigo && validarCodigoMedidor(codigo).esValido,
    retry: false,
  });
}
