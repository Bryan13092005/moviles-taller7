---
name: epmaps-uio-moderno
description: Aplica el diseño UI/UX moderno y minimalista de EPMAPS en React Native / Expo. Configura alertas nativas (Alert.alert), encabezado con el logo institucional EPMAPS.png y texto con tipografía de la empresa, paleta oficial (#004B87, #0076C6, #F8FAFC) y botones de navegación prominentes y destacados. Usar siempre que se creen o modifiquen vistas o componentes UI de la app EPMAPS Campo.
---

# UI/UX EPMAPS Campo - Estilo Moderno y Minimalista

Esta skill define las pautas de interfaz gráfica, componentes y patrones de experiencia de usuario para la aplicación React Native / Expo de **EPMAPS Campo**.

## Principios de Diseño

1. **Estilo Moderno & Minimalista:**
   - Diseños limpios, espacios de aire adecuados (`padding: 16`, `gap: 12`), bordes redondeados suavemente (`borderRadius: 12` o `16`), sombras sutiles o bordes delgados (`#E2E8F0`).
   - Jerarquía tipográfica clara basada en **Roboto** (Bold, Medium, Regular) con tamaños de fuente diferenciados.

2. **Paleta de Colores Institucional EPMAPS:**
   - **Azul Primario:** `#004B87` (Botones principales, headers, títulos principales).
   - **Azul Secundario / Acción:** `#0076C6` (Iconos, enlaces, estados interactivos).
   - **Gris de Fondo:** `#F8FAFC` (Fondo general de pantallas).
   - **Gris Superficie:** `#FFFFFF` (Tarjetas, contenedores con elevación).
   - **Gris Borde:** `#E2E8F0` (Bordes delgados de tarjetas e inputs).
   - **Texto Principal:** `#1E293B` (Texto oscuro de alta legibilidad).
   - **Texto Secundario:** `#64748B` (Subtítulos y etiquetas).
   - **Alerta / Error:** `#DC2626` / `#FEF2F2` (Fondo rosado/rojo claro con texto rojo).
   - **Éxito / Sincronizado:** `#16A34A` / `#DCFCE7`.
   - **Advertencia / Pendiente:** `#D97706` / `#FEF3C7`.

---

## 1. Encabezado Institucional (Logo + Texto EPMAPS + Barra de Red)

En la parte superior de cada pantalla principal (excepto donde sea redundante), se debe incluir el logo oficial institucional junto con el texto **EPMAPS** formateado con la tipografía de la empresa (Roboto Bold / `#004B87`) y la barra de estado de red (NetworkStatusBar):

```tsx
import { Image, View, Text, StyleSheet } from 'react-native';
import { NetworkStatusBar } from '@/components/network-status-bar';

export function HeaderEpmaps() {
  return (
    <View style="{styles.headerContainer}">
      <NetworkStatusBar/>
      <View style="{styles.logoWrapper}">
        <Image resizeMode="contain" source="{require('@/assets/EPMAPS.png')}" style="{styles.logoImage}"/>
        <Text style="{styles.textoEpmaps}">EPMAPS</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 12,
  },
  logoWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 10,
  },
  logoImage: {
    width: 140,
    height: 45,
  },
  textoEpmaps: {
    fontFamily: 'Roboto_700Bold',
    fontSize: 22,
    color: '#004B87',
    letterSpacing: 1.2,
  },
});