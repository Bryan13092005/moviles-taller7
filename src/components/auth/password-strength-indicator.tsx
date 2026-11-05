import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import type { FortalezaContrasena } from '@/features/auth/password';

interface Props {
  fortaleza: FortalezaContrasena;
}

const ETIQUETAS: Record<Exclude<FortalezaContrasena, 'vacia'>, string> = {
  debil: 'Contraseña débil ⚠️',
  media: 'Contraseña media 🟡',
  fuerte: 'Contraseña fuerte 💪',
};

const COLORES_TEXTO: Record<Exclude<FortalezaContrasena, 'vacia'>, string> = {
  debil: 'text-red-600',
  media: 'text-amber-600',
  fuerte: 'text-green-600',
};

/** Barra animada que indica la seguridad de la contraseña mientras se escribe. */
export function IndicadorSeguridadContrasena({ fortaleza }: Props) {
  const progress = useSharedValue(0);

  useEffect(() => {
    let target = 0;
    if (fortaleza === 'debil') target = 0.33;
    if (fortaleza === 'media') target = 0.66;
    if (fortaleza === 'fuerte') target = 1;

    progress.value = withSpring(target, {
      damping: 15,
      stiffness: 120,
    });
  }, [fortaleza, progress]);

  const animatedBarStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      progress.value,
      [0, 0.33, 0.66, 1],
      ['#E2E8F0', '#DC2626', '#D97706', '#16A34A'],
    );

    return {
      width: `${progress.value * 100}%`,
      backgroundColor,
    };
  });

  if (fortaleza === 'vacia') return null;

  return (
    <View className="mt-1.5 gap-1">
      <View className="h-1.5 bg-border rounded-full overflow-hidden">
        <Animated.View className="h-full rounded-full" style={animatedBarStyle} />
      </View>
      <Text
        accessibilityLiveRegion="polite"
        className={`text-xs font-roboto-medium ${COLORES_TEXTO[fortaleza]}`}>
        {ETIQUETAS[fortaleza]}
      </Text>
    </View>
  );
}
