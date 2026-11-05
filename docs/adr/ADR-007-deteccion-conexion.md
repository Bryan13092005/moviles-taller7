# ADR-007: Usar NetInfo y una cola de sincronización en SQLite para la detección de red y el envío automático de lecturas

## Estado
Aceptado.

## Fecha
2026-10-27

## Requisitos relacionados
R4, R9

## Contexto
El trabajo en campo abarca sectores rurales y sótanos con cobertura de red intermitente o nula. La aplicación debe resolver dos desafíos de conectividad y sincronización:
1. El técnico necesita conocer en todo momento (en cualquier pantalla de la aplicación) su estado de conexión actual (Con señal / Sin señal) y la cantidad de lecturas que tiene guardadas en el teléfono pendientes de envío (R9).
2. Cuando el dispositivo reconecte a internet, la aplicación debe procesar y enviar automáticamente la cola de lecturas pendientes acumuladas hacia MockAPI sin requerir que el técnico presione un botón de sincronización ni generar registros duplicados si la señal se interrumpe a mitad de una transacción (R9).

## Alternativas consideradas

| Alternativa | Ventajas en este proyecto | Desventajas en este proyecto |
| :--- | :--- | :--- |
| **`@react-native-community/netinfo` + Cola de envío en SQLite** | `NetInfo` provee un oyente (*listener*) global en tiempo real sobre el estado de la red. Al detectar que la conexión se restablece, dispara un servicio en segundo plano que consulta en SQLite las lecturas con `sincronizado = 0` y las envía secuencialmente a MockAPI. Si se interrumpe la red en medio del envío, la lectura permanece marked como no enviada y no se duplica. | Requiere controlar los estados de envio mediante transacciones en la base de datos local para garantizar la idempotencia de las lecturas enviadoas. |
| **Peticiones periódicas en segundo plano (*Polling* con `expo-background-fetch`)** | Intenta enviar datos cada intervalo fijo de tiempo (por ejemplo, cada 15 minutos) independientemente de si hay cambios de estado de red explícitos. | Consume batería innecesariamente en el dispositivo durante largas jornadas en zonas sin cobertura. No reacciona de forma inmediata en cuanto el teléfono recupera la señal. |
| **Botón de sincronización manual** | Simplifica enormemente la programación, dejando la responsabilidad del envío en manos del usuario cuando este decida presionar un botón. | Incumple de forma directa el requisito R9, el cual exige explícitamente que las lecturas pendientes se envíen solas y de manera automática al recuperar la conexión. |

## Decisión
Se usa **`@react-native-community/netinfo`** mediante un hook global (`useNetworkStatus`) que provee el estado de conexión a la barra superior (Header) de la app. Al detectar transición de estado a "Conectado" (y al abrir la app ya con red), `useSyncListener` ejecuta automáticamente el servicio de sincronización (`sincronizarLecturasPendientes`), que envía una a una las lecturas pendientes de SQLite a MockAPI. Cuando termina, llama a `precargarDatosRemotos` (`src/features/sync/precarga.service.ts`), que hace `GET /medidores` y `GET /lecturas` y los guarda en SQLite: medidores en `medidores_cache` y lecturas remotas como `sincronizado = 1`, sin duplicar las existentes (mismo medidor y `fecha_registro`). Si la precarga falla, se ignora y la app sigue offline.

## Consecuencias
- Cumplimiento total de R9: el técnico visualiza de forma permanente su estado de red y las lecturas pendientes desde cualquier pantalla.
- Sincronización transparente y automática tan pronto como el teléfono detecte señal celular o Wi-Fi.
- **Riesgo:** Si la red es sumamente inestable y oscila constantemente entre conectada y desconectada, se podrían disparar múltiples ejecuciones del servicio de sincronización. Se debe implementar un cerrojo lógico (*flag* de ejecución activa) en `syncService` para evitar peticiones concurrentes simultáneas.

## Verificación
- La barra de estado en `src/components/network-status-bar.tsx`, dentro de `header-epmaps.tsx`, refleja el estado de red y la cantidad de registros pendientes.
- Al abrir la app con red, o al reconectar, se ejecutan los `GET` a `/medidores` y `/lecturas` y la caché local queda actualizada.
- Al registrar lecturas en modo avión (quedan en estado `PENDIENTE`), desactivar el modo avión y restaurar la red, los registros en SQLite cambian automáticamente su estado a `ENVIADO` (`sincronizado = 1`) y el contador del Header regresa a 0.

## Uso de IA
Se le consultó a la IA sobre cómo evitar envíos duplicados al recuperar la señal. La IA recomendó un listener con `NetInfo` combinado con un atributo de control de sincronización en SQLite. Se aceptó la recomendación por asegurar idempotencia en el envío.