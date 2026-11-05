# ADR-001: Usar SQLite para datos estructurados y AsyncStorage para la sesión del técnico

## Estado
Aceptado.

## Fecha
2026-10-26

## Requisitos relacionados
R1, R3, R4, R8, R10

## Contexto
La aplicación opera en zonas de Quito donde no hay cobertura de red (como Nono, Lloa o sótanos). La aplicación necesita guardar en el teléfono la información de los medidores consultados, almacenar las lecturas tomadas durante la jornada offline, conservar los borradores de formularios interrumpidos y controlar que no se dupliquen registros en un mismo mes. Estos datos requieren consultas estructuradas y relacionales.

## Alternativas consideradas

| Alternativa | Ventajas en este proyecto | Desventajas en este proyecto |
| :--- | :--- | :--- |
| **SQLite (`expo-sqlite`) + AsyncStorage** | SQLite permite realizar consultas SQL directas para validar duplicados mensuales (R10) y filtrar lecturas por estado sin sobrecargar la memoria. AsyncStorage resuelve la sesión simple del técnico (R1) sin requerir tablas complejas. | Exige definir esquemas de tablas SQL al inicio y gestionar la inicialización de la base de datos en código. |
| **AsyncStorage para todo el proyecto** | API muy simple de pares clave-valor que no requiere definir tablas ni esquemas SQL. | Guardar arreglos grandes de lecturas en JSON obliga a deserializar todo el contenido en memoria para buscar un medidor o verificar duplicados, aumentando el riesgo de lentitud y corrupción de datos si la app se cierra. |
| **Realm / WatermelonDB** | ORM de alto rendimiento con sincronización avanzada orientada a objetos. | Agrega configuraciones nativas complejas y dependencias pesadas innecesarias para la escala de datos de la prueba, lo que contraviene la regla de minimizar librerías. |

## Decisión
Se usa **SQLite (`expo-sqlite`)** para almacenar la caché de medidores, las lecturas pendientes de envío y el borrador de la captura en curso. Se usa **AsyncStorage** de forma puntual y exclusiva para mantener la sesión activa del técnico (código y clave) entre reinicios.

## Consecuencias
- Se garantiza la consulta inmediata en modo avión de medidores previamente descargados.
- Se simplifica la validación de duplicados en el mismo mes mediante consultas `SELECT` en SQLite.
- **Riesgo:** Si la app se cierra bruscamente durante una escritura en SQLite, se debe asegurar el uso de transacciones o el modo WAL (`PRAGMA journal_mode = WAL`) para no perder datos.

## Verificación
- El archivo `src/db/database.ts` contiene las instrucciones `CREATE TABLE` para `medidores_cache`, `lecturas_pendientes` y `borrador_registro`.
- En el teléfono, tras realizar búsquedas y activar el modo avión, los datos guardados en SQLite se muestran inmediatamente.

## Uso de IA
Se le consultó a la IA sobre usar `AsyncStorage` para almacenar todas las lecturas del día. La IA sugirió un único arreglo de objetos guardado en clave-valor. Se descartó esa recomendación por la dificultad de validar duplicados por mes (R10) y se le ordenó estructurar la base de datos con `expo-sqlite`.