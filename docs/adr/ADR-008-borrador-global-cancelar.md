# ADR-008: Autoguardado global del borrador, recuperación al abrir la app y botón Cancelar en el registro

## Estado
Aceptado.

## Fecha
2026-10-27

## Requisitos relacionados
R4, R8

## Contexto
El registro de una lectura ocupa varias pantallas (estado, lectura y confirmación) y la app puede cerrarse de forma inesperada (batería, llamada, el sistema operativo mata el proceso). R8 exige que el progreso se guarde en tiempo real en la tabla `borrador_registro` de SQLite y que, al reabrir la app, se ofrezca **Continuar** o **Descartar**.

La primera versión iniciaba el autoguardado solo en los pasos 1 y 2 y mostraba el aviso de recuperación únicamente al entrar al Paso 1, por lo que un cierre en la confirmación no se guardaba y el técnico no veía el aviso al abrir la app. Además, el técnico no tenía una forma explícita de abandonar una captura iniciada.

## Alternativas consideradas

| Alternativa | Ventajas en este proyecto | Desventajas en este proyecto |
| :--- | :--- | :--- |
| **Suscripción global al store (Zustand) + `AppState` + aviso en `/busqueda`** | Un único punto de autoguardado cubre todos los pasos. El volcado en `AppState` asegura el último estado al pasar a segundo plano. El aviso aparece apenas el técnico llega a la pantalla principal. | Requiere cuidar que la suscripción se cree una sola vez y que el aviso no se repita durante la misma ejecución. |
| **Autoguardado por pantalla (`useEffect` en cada paso)** | Simple de entender por pantalla. | Se duplica la lógica, y cualquier pantalla nueva o que se olvide deja huecos (ocurrió con la confirmación). |
| **Guardar solo al pulsar "Siguiente"** | Menos escrituras a SQLite. | Se pierden los datos escritos en el paso actual si la app se cierra, incumpliendo "tiempo real" de R8. |

## Decisión
- **Autoguardado global:** `iniciarProteccionBorrador()` (`src/features/lecturas/borrador.service.ts`) se monta una sola vez en `src/app/_layout.tsx`. Se suscribe a `useLecturaStore` y guarda el borrador cuando cambian los datos y hay un `medidorCodigo`. Además, escucha `AppState` y guarda el estado actual cuando la app deja de estar activa.
- **Recuperación al abrir:** el hook `useRecuperarBorrador` (`src/features/lecturas/useRecuperarBorrador.ts`) se usa en `src/app/busqueda.tsx`. Una vez por ejecución de la app lee el borrador y, si existe, muestra "Captura pendiente" con **Continuar** (restaura el store y abre `/registro/paso1-estado`) o **Descartar** (limpia el borrador).
- **Botón Cancelar:** el componente `src/components/boton-cancelar-registro.tsx` se muestra fijo bajo el encabezado en el Paso 1, el Paso 2 (incluida la carga) y la confirmación. Pide confirmación y llama a `cancelarRegistro()`, que reinicia el store y elimina el borrador; luego vuelve a `/busqueda`.
- Se retiró la lógica de borrador que el Paso 1 tenía por su cuenta.

## Consecuencias
- Cualquier interrupción, en cualquier paso, deja el progreso recuperable (R8).
- El técnico puede abandonar una captura iniciada sin dejar residuos ni avisos de borrador falsos al reabrir.
- Una lectura ya guardada (`lecturas_pendientes`) no se ve afectada por Cancelar; solo se descarta la captura en curso.
- **Riesgo:** al cancelar no se borra el archivo de la foto ya copiado a `documentDirectory` (ver ADR-006), por lo que puede quedar espacio ocupado.
- **Riesgo:** si el sistema mata el proceso entre dos cambios, se pierde como máximo el último cambio no volcado; el guardado en cada cambio lo minimiza.

## Verificación
- En `src/app/_layout.tsx` se llama a `iniciarProteccionBorrador()` y en el Paso 1 y Paso 2 ya no hay `iniciarAutoguardado`.
- Iniciar un registro, avanzar al Paso 3, cerrar la app a la fuerza y reabrirla: en `/busqueda` aparece "Captura pendiente"; **Continuar** restaura los datos y **Descartar** vacía `borrador_registro`.
- En cada uno de los tres pasos se ve el botón "Cancelar registro"; al confirmarlo se regresa a `/busqueda` y al reabrir la app no aparece aviso de borrador.

## Uso de IA
Se le consultó a la IA cómo garantizar que el progreso no se pierda al cerrar la app en cualquier pantalla. La IA recomendó centralizar el autoguardado en una suscripción global al store y complementarla con `AppState`, en lugar de repetirla en cada pantalla. Se aceptó por evitar huecos de cobertura y duplicación de código.
