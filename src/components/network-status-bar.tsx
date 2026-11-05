import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { PulseView } from '@/components/animations/pulse-view';
import { getDb } from '@/db/database';

// R9: indicador de conexión y contador de lecturas pendientes.
export function NetworkStatusBar() {
  const [online, setOnline] = useState(true);
  const [pendientes, setPendientes] = useState(0);

  useEffect(() => {
    const unsub = NetInfo.addEventListener((s) => {
      setOnline(s.isConnected === true && s.isInternetReachable !== false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    let activo = true;
    const cargar = async () => {
      try {
        const db = await getDb();
        const row = await db.getFirstAsync<{ n: number }>(
          'SELECT COUNT(*) AS n FROM lecturas_pendientes WHERE sincronizado = 0',
        );
        if (activo) setPendientes(row?.n ?? 0);
      } catch {
        // El contador no debe romper la pantalla.
      }
    };
    cargar();
    const t = setInterval(cargar, 5000);
    return () => {
      activo = false;
      clearInterval(t);
    };
  }, []);

  const hayPendientes = pendientes > 0;

  return (
    <View className="flex-row justify-between items-center px-4 pt-2">
      <View
        className={`flex-row items-center gap-1.5 px-3 py-1 rounded-full ${
          online ? 'bg-success-soft' : 'bg-warning-soft'
        }`}>
        <PulseView active={!online} className="items-center justify-center">
          <View className={`w-2 h-2 rounded-full ${online ? 'bg-emerald-500' : 'bg-amber-500'}`} />
        </PulseView>
        <Text
          className={`font-roboto-medium text-[13px] ${
            online ? 'text-emerald-800' : 'text-amber-800'
          }`}>
          {online ? 'Con red' : 'Sin red'}
        </Text>
      </View>
      <View
        className={`flex-row items-center gap-1.5 px-3 py-1 rounded-full ${
          hayPendientes ? 'bg-warning-soft' : 'bg-white/20'
        }`}>
        <PulseView active={hayPendientes} className="items-center justify-center">
          <View className={`w-2 h-2 rounded-full ${hayPendientes ? 'bg-warning' : 'bg-white'}`} />
        </PulseView>
        <Text
          className={`font-roboto-medium text-[13px] ${
            hayPendientes ? 'text-amber-800' : 'text-white'
          }`}>
          Pendientes: {pendientes}
        </Text>
      </View>
    </View>
  );
}
