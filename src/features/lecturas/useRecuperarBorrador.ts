import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Alert } from 'react-native';

import { limpiarBorrador, obtenerBorrador } from './borrador.service';
import { useLecturaStore } from './useLecturaStore';

let revisado = false;

// R8: una vez por apertura de la app, ofrece continuar o descartar la captura interrumpida.
export function useRecuperarBorrador() {
  const router = useRouter();

  useEffect(() => {
    if (revisado) return;
    revisado = true;
    obtenerBorrador()
      .then((borrador) => {
        if (!borrador?.medidorCodigo) return;
        Alert.alert(
          'Captura pendiente',
          `Quedó un registro sin terminar del medidor ${borrador.medidorCodigo}. ¿Desea continuar?`,
          [
            { text: 'Descartar', style: 'destructive', onPress: () => void limpiarBorrador() },
            {
              text: 'Continuar',
              onPress: () => {
                useLecturaStore.getState().restaurarFormulario(borrador);
                router.push('/registro/paso1-estado' as never);
              },
            },
          ],
          { cancelable: false },
        );
      })
      .catch(() => undefined);
  }, [router]);
}
