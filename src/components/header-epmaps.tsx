import { useEffect } from 'react';
import { Image, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NetworkStatusBar } from '@/components/network-status-bar';

// Encabezado institucional: barra de red (R9) + logo y marca EPMAPS.
export function HeaderEpmaps({ subtitulo = 'Lecturas de campo' }: { subtitulo?: string }) {
  const insets = useSafeAreaInsets();
  const accentWidth = useSharedValue(0);

  useEffect(() => {
    accentWidth.value = withSpring(56, { damping: 14, stiffness: 120 });
  }, [accentWidth]);

  const accentStyle = useAnimatedStyle(() => ({
    width: accentWidth.value,
  }));

  return (
    <View
      className="bg-primary rounded-b-[20px] pb-3.5 shadow-lg shadow-primary/30"
      style={{ paddingTop: insets.top }}>
      <NetworkStatusBar />
      <View className="flex-row items-center justify-center gap-3.5 pt-3">
        <View className="bg-white rounded-2xl px-2 py-1">
          <Image
            resizeMode="contain"
            source={require('../../assets/images/EPMAPS.jpeg')}
            className="w-24 h-11"
          />
        </View>
        <View>
          <Text className="font-roboto-bold text-[26px] text-white tracking-[3px]">EPMAPS</Text>
          <Text className="font-roboto-medium text-xs text-sky-300 tracking-[1.5px] uppercase">
            {subtitulo}
          </Text>
        </View>
      </View>
      <Animated.View
        className="h-[3px] rounded-full bg-accent self-center mt-3"
        style={accentStyle}
      />
    </View>
  );
}
