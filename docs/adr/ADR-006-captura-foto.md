# ADR-006: Usar Expo Camera y Expo FileSystem para la captura, permisos y conservación permanente de fotografías

## Estado
Aceptado.

## Fecha
2026-10-27

## Requisitos relacionados
R6, R7

## Contexto
La evidencia fotográfica del medidor es un requisito obligatorio cuando se registra un consumo anómalo (más del triple del promedio mensual según R6) o cuando el medidor se encuentra dañado (R7), y opcional en los demás escenarios. 

La aplicación debe cumplir con dos condiciones críticas adicionales descritas en R7:
1. Las fotos deben conservarse intactas en el almacenamiento del dispositivo aunque transcurran varios días sin señal antes de enviar la lectura a la oficina.
2. Si el técnico niega el permiso de cámara, la aplicación debe explicar de forma transparente la razón del requerimiento y permitir continuar en los casos donde la foto no es obligatoria.

## Alternativas consideradas

| Alternativa | Ventajas en este proyecto | Desventajas en este proyecto |
| :--- | :--- | :--- |
| **`expo-camera` + `expo-file-system`** | `expo-camera` proporciona control directo sobre el flujo de permisos y la interfaz de disparo. `expo-file-system` permite copiar el archivo generado desde el directorio temporal de la app hacia el almacenamiento permanente del sistema (`FileSystem.documentDirectory`), garantizando que la imagen no sea borrada por el sistema operativo durante días de trabajo sin conexión. | Exige escribir la lógica de copia y persistencia de archivos de disco en el servicio de almacenamiento. |
| **`expo-image-picker`** | Interfaz preconstruida que invoca la cámara predeterminada del sistema operativo o la galería. | Las fotos tomadas a través del selector nativo suelen almacenarse en directorios de caché temporal (`cacheDirectory`) que el limpiador de espacio de Android puede eliminar si la sincronización se posterga varios días. |
| **Almacenar imágenes codificadas en Base64 dentro de SQLite** | Guarda el registro de datos y la fotografía en una sola celda dentro de la base de datos de SQLite (según ADR-001). | Cargar cadenas de texto gigantes en Base64 ralentiza considerablemente la base de datos SQLite, aumenta exponencialmente el tamaño de la base de datos y puede causar fallos de memoria RAM al renderizar listas de lecturas pendientes. |

## Decisión
Se usa **`expo-camera`** para la vista previa de la cámara y la gestión de permisos en tiempo de ejecución, en combinación con **`expo-file-system`** para guardar la fotografía capturada de forma permanente en la carpeta de documentos locales del teléfono. En el registro SQLite de la lectura se almacena únicamente la ruta local (`file://...`) de la imagen.

La ruta local de la foto viaja con la lectura al sincronizar (`fotoURL`), y las lecturas descargadas en la precarga de datos (ver ADR-002 y ADR-007) conservan la que traían del servidor. Subir el archivo a MockAPI queda como mejora pendiente. El botón "Cancelar registro" descarta la captura, incluido el borrador con la ruta de la foto, pero no borra el archivo de la carpeta de documentos.

## Consecuencias
- Las fotografías de respaldo permanecen seguras e inalteradas en el teléfono sin depender de la memoria caché temporal ni de la señal celular (R7).
- Si el permiso de cámara es denegado, la interfaz despliega una explicación Modal o Alerta explicativa y habilita el botón de omitir si la foto no es requerida por R6 o R7.
- **Riesgo:** Si el técnico captura decenas de imágenes de alta resolución, el espacio de almacenamiento del teléfono podría llenarse. Se debe configurar la compresión de imagen en `expo-camera` (por ejemplo, calidad de `0.5` a `0.7`).

## Verificación
- El archivo `src/utils/fileSystemStorage.ts` contiene la función para copiar imágenes a `FileSystem.documentDirectory`.
- Al tomar una foto en modo avión, reiniciar el teléfono y consultar la lista de lecturas pendientes, la vista previa de la imagen sigue cargando correctamente sin errores de ruta.

## Uso de IA
Se le consultó a la IA cómo mantener fotos guardadas en el teléfono por varios días sin que Android las borre. La IA recomendó mover las fotos desde la ruta temporal de `expo-camera` al directorio permanente usando `expo-file-system`. Se aceptó la recomendación por ser la única garantizada contra limpiezas de caché del sistema operativo.