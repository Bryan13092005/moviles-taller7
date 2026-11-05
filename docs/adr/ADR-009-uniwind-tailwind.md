# ADR-009: Estilos con Uniwind (Tailwind CSS v4) en lugar de StyleSheet

## Estado
Aceptado.

## Fecha
2026-11-02

## Requisitos relacionados
Transversal a R1–R10 (diseño visual de todas las pantallas).

## Contexto
La app usaba `StyleSheet.create` en cada pantalla y componente, con la paleta y la tipografía EPMAPS repetidas en objetos locales (`C`, `PALETTE`, `authStyles`). Eso dificultaba mantener consistencia visual, provocaba duplicación y hacía más lento ajustar el diseño. Se solicitó implementar [Uniwind](https://uniwind.dev/) como sistema de estilos visuales en toda la app.

## Alternativas consideradas

| Alternativa | Ventajas en este proyecto | Desventajas en este proyecto |
| :--- | :--- | :--- |
| **Uniwind + Tailwind CSS v4** | Clases utilitarias, tokens centralizados, soporte nativo Expo/RN, sin Babel y con mejor rendimiento que otras alternativas de Tailwind para RN. | Requiere configurar Metro y `global.css`; los nombres de clase deben escribirse completos (sin interpolación parcial). |
| **Mantener `StyleSheet`** | Sin cambios ni dependencias nuevas. | Duplicación de estilos, paleta dispersa y mayor esfuerzo para evolucionar el diseño. |
| **NativeWind** | Ecosistema conocido. | Menor rendimiento y migración innecesaria si se adopta Uniwind. |

## Decisión
- Se instalaron `uniwind` y `tailwindcss` (Tailwind v4).
- `global.css` (raíz del proyecto) importa `tailwindcss` y `uniwind` y define los tokens EPMAPS en `@theme`: colores (`primary`, `secondary`, `accent`, `background`, `card`, `border`, `foreground`, `muted`, `danger`, `success`, `warning`, etc.) y familias tipográficas (`font-roboto`, `font-roboto-medium`, `font-roboto-bold`).
- `metro.config.js` usa `withUniwindConfig` como wrapper externo, con `cssEntryFile: './global.css'` y `dtsFile: './src/uniwind-types.d.ts'`.
- `global.css` se importa en `src/app/_layout.tsx`; el layout raíz se envuelve con `SafeAreaListener` y `Uniwind.updateInsets` para las utilidades de área segura.
- Todas las pantallas y componentes visuales usan `className` en lugar de `StyleSheet.create`. Las clases compartidas de autenticación viven en `src/components/auth/auth-classes.ts`.
- Las variantes condicionales usan cadenas completas de clases (por ejemplo, `border-danger` frente a `border-border`) para evitar conflictos de especificidad; `active:` y `disabled:` cubren los estados de `Pressable`.
- Solo quedan estilos inline para valores dinámicos que no pueden expresarse como clase: animaciones de Reanimated, `paddingTop` de los insets del header, `textAlignVertical` de campos multilínea y el llenado absoluto de `CameraView`.

## Consecuencias
- La paleta y la tipografía se cambian en un único archivo (`global.css`).
- Las pantallas son más declarativas y consistentes con el diseño EPMAPS.
- Se agrega una dependencia de build (Metro + Tailwind) y la necesidad de reiniciar Metro (`npx expo start --clear`) al cambiar tokens.
- Los `className` deben existir completos en el código para que Tailwind los detecte.

## Verificación
- `npx tsc --noEmit` sin errores.
- `npx expo export --platform android` compila el bundle correctamente.
- `npm run lint` sin errores (solo advertencias previas de Axios y hooks).
- Búsqueda en `src`: no quedan usos de `StyleSheet` ni archivos `auth-styles.ts`.

## Uso de IA
Se consultó la documentación oficial de Uniwind para el quickstart, tokens de tema, tipografías personalizadas y utilidades de área segura. La migración de `StyleSheet` a `className` se realizó con asistencia de IA y se validó con TypeScript, lint y un export de Android.
