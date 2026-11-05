import NetInfo from '@react-native-community/netinfo';
import { useEffect } from 'react';

import { precargarDatosRemotos } from './precarga.service';
import { sincronizarLecturasPendientes } from './sync.service';

// R9: al abrir la app o recuperar la red, envía la cola y descarga medidores y lecturas.
export function useSyncListener() {
  useEffect(() => {
    let conectadoAntes = false;
    const unsub = NetInfo.addEventListener((s) => {
      const conectado = s.isConnected === true && s.isInternetReachable !== false;
      if (conectado && !conectadoAntes) {
        sincronizarLecturasPendientes()
          .catch(() => undefined)
          .then(() => precargarDatosRemotos());
      }
      conectadoAntes = conectado;
    });
    return unsub;
  }, []);
}
