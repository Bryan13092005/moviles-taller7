# ADR-003: Usar Zustand para la gestión del estado compartido entre las pantallas de captura

## Estado
Aceptado.

## Fecha
2026-10-26

## Requisitos relacionados
R5, R6, R7, R8

## Contexto
El registro completo de la lectura de un medidor se divide en un flujo de varias pantallas continuas (Paso 1: Estado y motivos, Paso 2: Lectura y cálculo de consumo, Paso 3: Fotografía de respaldo). El técnico debe poder avanzar y retroceder entre estas pantallas conservando los datos ingresados en cada paso. Se requiere una solución de estado global/compartido ligera que evite pasar propiedades manualmente entre rutas (*prop drilling*) o sufrir re-renderizados innecesarios en componentes de la interfaz.

## Alternativas consideradas

| Alternativa | Ventajas en este proyecto | Desventajas en este proyecto |
| :--- | :--- | :--- |
| **Zustand** | Proporciona un almacén (*store*) global con una API sumamente concisa sin necesidad de envolver la aplicación en proveedores (*Context Providers*). Permite actualizar y leer propiedades específicas sin provocar re-renderizados masivos en componentes no suscritos, y facilitar la limpieza del formulario al finalizar la captura. | Agrega una dependencia adicional de terceros al `package.json`. |
| **React Context API (Nativo de React)** | Viene integrado en el núcleo de React sin requerir paquetes externos en `package.json`. | Requiere crear un contexto con su respectivo `Provider` que envuelva la sub-ruta del registro. Si no se memorizan adecuadamente los valores, cualquier cambio en una propiedad del formulario (como el texto de la lectura) re-renderiza todas las pantallas suscritas al contexto. |
| **Parámetros de ruta en la navegación (Expo Router)** | Pasa los datos como argumentos en la URL de cada pantalla sin necesidad de estado global. | Los parámetros de ruta se pierden o se vuelven inmanejables al pasar estructuras complejas (como metadatos de la imagen o banderas de anomalías) y complican la restauración directa del estado si la app se cierra (R8). |

## Decisión
Se usa **Zustand** para gestionar el estado compartido en memoria durante el flujo de captura de lecturas. Se crea un *store* `useLecturaStore` que mantiene los datos temporales del proceso activo (código de medidor, estado, motivos, lectura, fotos y banderas de anomalía) y expone métodos para actualizar cada campo y reiniciar el formulario.

## Consecuencias
- La transferencia de datos entre pantallas interconectadas es fluida e independiente de la estructura de navegación.
- Se simplifica el reinicio de los datos cuando el técnico completa o cancela el registro.
- **Riesgo:** Zustand almacena los datos principalmente en la memoria RAM del dispositivo; si la aplicación es eliminada de la memoria por el sistema operativo, los datos temporales se borrarían. Por este motivo, el estado de Zustand se sincroniza en segundo plano con la tabla de borradores en SQLite (según ADR-001) para dar cumplimiento al requisito R8.

## Verificación
- El archivo `src/features/lecturas/useLecturaStore.ts` define la tienda Zustand con los campos y acciones de la captura.
- Al ingresar el estado en el Paso 1, avanzar al Paso 2 y regresar al Paso 1 con el botón atrás de Android, los campos conservan exactamente la información ingresada.

## Uso de IA
Se le consultó a la IA la mejor forma de compartir el estado de un formulario de tres pasos. La IA sugirió Zustand o React Context. Se prefirió Zustand por la limpieza de código, evitando la sobrecarga de envolver componentes en *Providers* y optimizando el rendimiento de re-renderizado en dispositivos de gama baja en campo.