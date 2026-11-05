import { useRouter } from 'expo-router';
import { Alert, Pressable, Text, View } from 'react-native';

import { cancelarRegistro } from '@/features/lecturas/borrador.service';

// Visible en todos los pasos del registro: descarta la captura y vuelve a la búsqueda.
export function BotonCancelarRegistro() {
  const router = useRouter();

  const confirmar = () => {
    Alert.alert('Cancelar registro', 'Se descartará la lectura en curso. ¿Desea cancelar?', [
      { text: 'Seguir editando', style: 'cancel' },
      {
        text: 'Sí, cancelar',
        style: 'destructive',
        onPress: async () => {
          await cancelarRegistro().catch(() => undefined);
          if (router.canDismiss()) router.dismissAll();
          router.replace('/busqueda');
        },
      },
    ]);
  };

  return (
    <View className="px-5 pt-2.5 bg-background">
      <Pressable
        accessibilityRole="button"
        onPress={confirmar}
        className="min-h-11 rounded-xl border-2 border-danger bg-white items-center justify-center active:opacity-85">
        <Text className="font-roboto-medium text-base text-danger">Cancelar registro</Text>
      </Pressable>
    </View>
  );
}
