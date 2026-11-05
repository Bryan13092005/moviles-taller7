import '../../global.css';

import {
  Roboto_400Regular,
  Roboto_500Medium,
  Roboto_700Bold,
  useFonts,
} from '@expo-google-fonts/roboto';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { SafeAreaListener } from 'react-native-safe-area-context';
import { Uniwind } from 'uniwind';

import { getDb } from '@/db/database';
import { AppAlertHost } from '@/components/app-alert';
import { iniciarProteccionBorrador } from '@/features/lecturas/borrador.service';
import { useSyncListener } from '@/features/sync/useSyncListener';

SplashScreen.preventAutoHideAsync();

// R3: los datos del medidor se mantienen vigentes durante la jornada (24 h).
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 24 * 60 * 60 * 1000, gcTime: 24 * 60 * 60 * 1000 },
  },
});

export default function RootLayout() {
  const [loaded, error] = useFonts({ Roboto_400Regular, Roboto_500Medium, Roboto_700Bold });
  const [dbListo, setDbListo] = useState(false);
  useSyncListener();

  useEffect(() => iniciarProteccionBorrador(), []);

  useEffect(() => {
    getDb()
      .catch(() => undefined)
      .finally(() => setDbListo(true));
  }, []);

  const listo = (loaded || !!error) && dbListo;

  useEffect(() => {
    if (listo) SplashScreen.hideAsync();
  }, [listo]);

  if (!listo) return null;

  return (
    <SafeAreaListener onChange={({ insets }) => Uniwind.updateInsets(insets)}>
      <QueryClientProvider client={queryClient}>
        <Stack screenOptions={{ headerShown: false }} />
        <AppAlertHost />
      </QueryClientProvider>
    </SafeAreaListener>
  );
}
