import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

interface Props {
  /** 1: Estado, 2: Lectura, 3: Confirmación. */
  pasoActual: 1 | 2 | 3;
}

const TOTAL_PASOS = 3;

/** Barra de progreso animada del flujo de registro. */
export function ProgressBarRegistro({ pasoActual }: Props) {
  const porcentaje = (pasoActual / TOTAL_PASOS) * 100;
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withSpring(porcentaje, {
      damping: 15,
      stiffness: 90,
    });
  }, [porcentaje, progress]);

  const animatedBarStyle = useAnimatedStyle(() => ({
    width: `${progress.value}%`,
  }));

  return (
    <View className="mb-4">
      <View className="flex-row justify-between mb-1.5">
        <Text className="text-[13px] font-roboto-medium text-primary">
          Paso {pasoActual} de {TOTAL_PASOS}
        </Text>
        <Text className="text-[13px] font-roboto-bold text-secondary">
          {Math.round(porcentaje)}%
        </Text>
      </View>
      <View className="h-2 bg-border rounded-full overflow-hidden">
        <Animated.View className="h-full bg-primary rounded-full" style={animatedBarStyle} />
      </View>
    </View>
  );
}
