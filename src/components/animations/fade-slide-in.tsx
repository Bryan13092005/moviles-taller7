import { useEffect } from 'react';
import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

interface Props {
  visible: boolean;
  children: ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
  offset?: number;
  duration?: number;
}

/** Entrada con desvanecimiento y deslizamiento vertical. */
export function FadeSlideIn({
  visible,
  children,
  className,
  style,
  offset = -20,
  duration = 300,
}: Props) {
  const translateY = useSharedValue(offset);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withTiming(0, {
        duration,
        easing: Easing.out(Easing.quad),
      });
      opacity.value = withTiming(1, { duration });
    } else {
      translateY.value = withTiming(offset, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible, offset, duration, translateY, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible) return null;

  return (
    <Animated.View className={className} style={[style, animatedStyle]}>
      {children}
    </Animated.View>
  );
}
