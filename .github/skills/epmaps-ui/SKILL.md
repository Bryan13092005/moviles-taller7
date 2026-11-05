---
name: epmaps-ui
description: Reglas de diseño visual e interfaz para la app de EPMAPS Quito. Evita sanciones por diseño genérico.
---

# Guía de Diseño Visual - EPMAPS Campo

## 1. Paleta de Colores Institucional
- **Azul Principal (EPMAPS):** `#004B87` (Headers, botones primarios, marca)
- **Azul Acento:** `#00A3E0` (Tarjetas de estado, bordes activos)
- **Verde Éxito (Sincronizado):** `#10B981` (Banner de conexión OK, lecturas enviadas)
- **Naranja Alerta (Anomalía / Pendiente):** `#F59E0B` (Lecturas pendientes, alertas de consumo)
- **Rojo Error / Dañado:** `#EF4444` (Medidor dañado, errores de validación)
- **Fondo Neutral:** `#F8FAFC`
- **Superficies / Tarjetas:** `#FFFFFF` con sombras suaves (`elevation: 2` / `shadowOpacity: 0.08`)

## 2. Tipografía (Google Fonts)
- Usar la fuente **Roboto** vía `@expo-google-fonts/roboto`:
  - `Roboto_400Regular`: Textos secundarios y etiquetas.
  - `Roboto_500Medium`: Títulos de tarjetas y botones.
  - `Roboto_700Bold`: Indicadores clave, código MED y títulos de pantalla.

## 3. Principios de Componentes
- **Barra de Estado de Red (R9):** Siempre visible en la parte superior. Muestra indicador en verde con icono si hay red, o naranja/rojo si está en modo avión, junto al contador de lecturas por enviar.
- **Tarjetas de Medidor (R3):** Con esquinas redondeadas (`border-radius: 12`), sombreado ligero y separaciones claras.
- **Campos de Lectura (R2, R6):** Formato numérico amplio, fácil de presionar en campo con teclados numéricos grandes.