# ADR-005: Usar TanStack Form para la gestión integral de formularios de captura de lecturas

## Estado
Aceptado.

## Fecha
2026-10-27

## Requisitos relacionados
R5, R6, R8

## Contexto
El proceso de captura de información en campo consta de múltiples campos de entrada cuyos estados dependen fuertemente entre sí. Según el requisito R5:
- Si el estado es *Normal*, la lectura es obligatoria.
- Si es *Inaccesible*, la lectura se deshabilita y el motivo se vuelve obligatorio.
- Si está *Dañado*, la descripción del daño es obligatoria y la lectura pasa a ser opcional.

Adicionalmente, si la lectura calculada supera el triple del consumo promedio (R6), se debe activar dinámicamente un campo de confirmación explícita del técnico. Se requiere un gestor de formularios que administre esta reactividad fluida entre campos y facilite el guardado progresivo del borrador (R8).

## Alternativas consideradas

| Alternativa | Ventajas en este proyecto | Desventajas en este proyecto |
| :--- | :--- | :--- |
| **TanStack Form (`@tanstack/react-form`)** | Se integra de forma nativa con el ecosistema de TanStack (Query) ya seleccionado. Ofrece tipado estricto en TypeScript para los campos condicionales y permite aislar el re-renderizado exclusivamente al campo que está cambiando, mejorando la respuesta táctil en el teléfono. | Requiere el uso de componentes de contexto de formulario (`useForm` y `form.Field`). |
| **React Hook Form** | Ampliamente utilizado en el ecosistema React Native con abundante documentación y ejemplos. | Agregaría una suite de librerías diferente a la familia TanStack, duplicando patrones de diseño de arquitectura dentro de la misma aplicación. |
| **Gestión manual con `useState` para cada campo** | No instala paquetes adicionales en el `package.json`. | Genera código verboso e invoca re-renderizados de la pantalla entera con cada pulsación de tecla. Hace compleja la validación cruzada entre el estado del medidor y la obligatoriedad de los campos. |

## Decisión
Se usa **TanStack Form** para la gestión de todos los formularios de la aplicación (identificación del técnico, consulta de medidores y formulario condicional de lectura).

## Consecuencias
- La habilitación, inhabilitación y reglas de obligatoriedad de los inputs se gestionan declarativamente según el estado activo del medidor (R5).
- Los datos del formulario se extraen de forma limpia para ser persistidos en la tienda global de Zustand (según ADR-003) y en la base de datos de borrador de SQLite (según ADR-001).
- **Riesgo:** El equipo debe familiarizarse con los componentes y hooks específicos de TanStack Form (`form.Field`, `field.state`).

## Verificación
- Los formularios de captura utilizan el hook `useForm` de `@tanstack/react-form`.
- Al cambiar la opción de estado del medidor de *Normal* a *Inaccesible*, el campo de entrada de lectura se deshabilita instantáneamente y el campo de motivo se marca como requerido.

## Uso de IA
Se le consultó a la IA sobre usar React Hook Form vs TanStack Form. Se eligió TanStack Form por coherencia arquitectónica con TanStack Query y su soporte de tipado directo en TypeScript.