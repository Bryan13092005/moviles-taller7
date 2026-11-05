import { useEffect } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

interface Props {
  size?: number;
  color?: string;
  trackColor?: string;
  thickness?: number;
  style?: StyleProp<ViewStyle>;
}

/** Indicador de carga circular animado en el UI thread. */
export function AnimatedSpinner({
  size = 40,
  color = '#004B87',
  trackColor = '#E2E8F0',
  thickness = 4,
  style,
}: Props) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = 0;
    rotation.value = withRepeat(
      withTiming(360, { duration: 900, easing: Easing.linear }),
      -1,
      false,
    );
  }, [rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: thickness,
          borderColor: trackColor,
          borderTopColor: color,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}
