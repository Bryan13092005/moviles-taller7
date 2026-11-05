---
name: reanimated-view
description: Aplica animaciones fluidas y de alto rendimiento usando React Native Reanimated en componentes de la app EPMAPS Campo (barra de progreso en flujo de registro de 3 pasos, Shake en errores de login, animaciones en el header y tarjetas). Usar cuando se creen o modifiquen animaciones UI en React Native / Expo.
---

# Animaciones UI con React Native Reanimated - EPMAPS Campo

Esta skill define las pautas de integración y los patrones de código para implementar animaciones fluidas utilizando **React Native Reanimated (`react-native-reanimated`)** en la aplicación **EPMAPS Campo**.

---

## Principios y Reglas de Animación

1. **Rendimiento Nivel Nativo:**
   - Usar Hooks de Reanimated (`useSharedValue`, `useAnimatedStyle`, `withTiming`, `withSpring`, `withSequence`) para garantizar que las animaciones corran en el **UI Thread** a 60/120 FPS.
2. **Propósito UX:**
   - Las animaciones deben ser funcionales y retroalimentar al usuario (ej. indicar progreso, advertir errores o dar sensación de respuesta táctil en tarjetas/encabezados).
3. **Consistencia Visual EPMAPS:**
   - Respetar los colores institucionales: `#004B87` (Azul Primario), `#0076C6` (Azul Acción) y `#DC2626` (Rojo Alerta).

---

## 1. Barra de Progreso Animada en Flujo de Registro (3 Pasos)

Componente reconfigurable que anima suavemente el llenado de la barra y el contador numérico de progreso (`33%`, `66%`, `100%`) según el paso actual (`paso1-estado`, `paso2-lectura`, `confirmacion`).

```tsx
import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

interface ProgressBarProps {
  pasoActual: 1 | 2 | 3; // 1: Estado, 2: Lectura, 3: Confirmación
}

export function ProgressBarRegistro({ pasoActual }: ProgressBarProps) {
  const porcentajeTarget = (pasoActual / 3) * 100;
  const progressAnim = useSharedValue(0);

  useEffect(() => {
    progressAnim.value = withSpring(porcentajeTarget, {
      damping: 15,
      stiffness: 90,
    });
  }, [pasoActual]);

  const animatedBarStyle = useAnimatedStyle(() => ({
    width: `${progressAnim.value}%`,
  }));

  return (
    <View style="{styles.container}">
      <View style="{styles.headerRow}">
        <Text style="{styles.pasoTexto}">Paso {pasoActual} de 3</Text>
        <Text style="{styles.porcentajeTexto}">
          {Math.round(porcentajeTarget)}%
        </Text>
      </View>

      <View style="{styles.track}">
        <Animated.View animatedBarStyle]} style="{[styles.fill,"/>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  pasoTexto: {
    fontSize: 13,
    fontFamily: 'Roboto_500Medium',
    color: '#004B87',
  },
  porcentajeTexto: {
    fontSize: 13,
    fontFamily: 'Roboto_700Bold',
    color: '#0076C6',
  },
  track: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: '#004B87',
    borderRadius: 4,
  },
});

```

# 2 Animación de Error Shake (Sacudida en Login)
Cuando las credenciales de correo/clave sean incorrectas en la pantalla de Login, el contenedor del formulario o los campos realizan un movimiento sísmico (Shake) acompañado de un borde rojo momentáneo.

```tsx
import React from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

export function useShakeAnimation() {
  const translateX = useSharedValue(0);

  const triggerShake = () => {
    translateX.value = withSequence(
      withTiming(-12, { duration: 50 }),
      withTiming(12, { duration: 50 }),
      withTiming(-8, { duration: 50 }),
      withTiming(8, { duration: 50 }),
      withTiming(-4, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return { triggerShake, animatedStyle };
}
```

# 3 Animación Pulse & Glow en Indicador de Red (Header EPMAPS)
Cuando la app pasa a estado Offline (Sin Red) o sincroniza en segundo plano, la barra/badge del Header realiza un efecto de pulso (Pulse) e intermitencia suave para llamar la atención del operario sin ser invasivo.

```tsx
import React, { useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';

export function HeaderOfflineBadge({ isConnected }: { isConnected: boolean }) {
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (!isConnected) {
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.4, { duration: 800 }),
          withTiming(1, { duration: 800 })
        ),
        -1,
        true
      );
      scale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 800 }),
          withTiming(1, { duration: 800 })
        ),
        -1,
        true
      );
    } else {
      opacity.value = withTiming(1);
      scale.value = withTiming(1);
    }
  }, [isConnected]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View !isConnected && animatedStyle]} style="{[styles.badge," styles.badgeOffline,>
      {/* Indicador visual de red */}
    </Animated.View>
  );
}
```

# 4 Animación de Carga (Loading Spinner)
Cuando la app realiza operaciones en segundo plano o espera la respuesta de la red, se muestra un indicador de carga con animación de giro continuo.

```tsx
import React from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

export function LoadingSpinner() {
  const rotation = useSharedValue(0);

  rotation.value = withRepeat(
    withTiming(360, { duration: 1000 }),
    -1,
    false
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View style={[animatedStyle, { width: 40, height: 40, borderRadius: 20, backgroundColor: 'blue' }]} />
  );
}
```

# 5 Elevación y Escalado Táctil en Tarjetas (Press Scale Card)
Al presionar cualquier tarjeta de medidor en la Búsqueda o tarjeta de lectura en el Historial, la tarjeta se contrae levemente (scale: 0.98) y recupera su tamaño dando retroalimentación háptica y visual.

```tsx
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

export function PressableCard({ children, onPress }: { children: React.ReactNode; onPress?: () => void }) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable onPress="{onPress}" onPressIn="{()"> {
        scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 300 });
      }}
    >
      <Animated.View animatedStyle]} style="{[styles.card,">
        {children}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
});
```

# 6 Transición Fade & Slide-In para Banner de Anomalía (R6)
Cuando se detecta una anomalía, el banner correspondiente aparece con una animación de desvanecimiento y deslizamiento desde la parte superior.

```tsx
import React, { useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

export function AnomaliaBanner({ visible, children }: { visible: boolean; children: React.ReactNode }) {
  const translateY = useSharedValue(-20);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.quad) });
      opacity.value = withTiming(1, { duration: 300 });
    } else {
      translateY.value = withTiming(-20, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible) return null;

  return (
    <Animated.View animatedStyle]} style="{[styles.bannerContainer,">
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bannerContainer: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginVertical: 10,
  },
});
```