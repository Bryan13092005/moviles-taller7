# ADR-002: Usar TanStack Query y Axios para la gestión de caché y peticiones al sistema de oficina

## Estado
Aceptado.

## Fecha
2026-10-26

## Requisitos relacionados
R1, R2, R3, R9

## Contexto
La aplicación consulta los datos del medidor a MockAPI (sistema de oficina) cuando el técnico ingresa un código válido (R2). Si el técnico vuelve a consultar el mismo medidor durante la jornada laboral, la aplicación no debe realizar una nueva descarga a través de la red (R3). Además, se deben gestionar de forma defensiva los estados de carga, la perdida de red y los reintentos cuando la conexión sea inestable.

## Alternativas consideradas

| Alternativa | Ventajas en este proyecto | Desventajas en este proyecto |
| :--- | :--- | :--- |
| **TanStack Query + Axios** | TanStack Query gestiona la caché en memoria mediante un `staleTime` largo para evitar descargas repetidas del mismo medidor (R3). Axios permite configurar una `baseURL` única para MockAPI y tiempos de espera (`timeout`) cortos ante falta de señal. | Agrega dos dependencias adicionales al proyecto y requiere envolver la raíz de la aplicación con un `QueryClientProvider`. |
| **Fetch nativo con `useState` / `useEffect` manual** | No agrega dependencias externas al `package.json`, usando las herramientas nativas del entorno de ejecución. | Exige escribir lógica manual extensa en cada pantalla para verificar si la consulta ya existe en la memoria o en SQLite, además de manejar manualmente los estados de reintento, errores y timeouts de red. |

## Decisión
Se usan **TanStack Query** y **Axios** para gestionar la capa de red y la caché en memoria de las consultas a MockAPI. Las consultas de medidores se configuran con un tiempo de validez indefinido durante la sesión (`staleTime` de 24 horas, respaldado por la caché diaria en SQLite) para garantizar el cumplimiento estricto del requisito R3.

### Precarga de datos al iniciar la app
Al abrir la app con red, y también al recuperar la conexión, `src/features/sync/precarga.service.ts` ejecuta dos `GET` en paralelo contra MockAPI: `/medidores` y `/lecturas` (`medidoresService.getAll` y `lecturasService.getAll`, donde un 404 equivale a lista vacía).
- Los medidores se guardan por *upsert* en `medidores_cache` con `cached_at` actual, de modo que quedan disponibles sin red (R3).
- Las lecturas remotas se insertan en `lecturas_pendientes` con `sincronizado = 1` (ENVIADA) si no existe ya una con el mismo medidor y `fecha_registro`. Así el control de duplicados mensuales (R10) conoce lo ya enviado desde otros dispositivos.
- Si no hay red o la API falla, el error se ignora y la app sigue con lo que hay en SQLite. Un cerrojo evita ejecuciones concurrentes.
- Se dispara desde `useSyncListener`, después de enviar la cola pendiente.

### Credenciales de empleado (R1)
No existe un endpoint de autenticación en MockAPI, por lo que el login se valida localmente contra tres usuarios fijos definidos en `src/features/auth/auth.service.ts`: Bryan, Salvador y Juan, con claves `Bryan123`, `Salvador123` y `Juan123`. El usuario no distingue mayúsculas; la clave sí. Cualquier otra combinación se rechaza con "Credenciales inválidas" y no se guarda sesión. La sesión (`codigoEmpleado` = nombre del técnico) se persiste en AsyncStorage hasta el cierre de sesión explícito. Estos datos fijos son una decisión de la prueba técnica y no deben usarse en producción.

## Consecuencias
- Se evita realizar peticiones HTTP innecesarias al sistema de la oficina cuando el técnico consulta un medidor por segunda vez.
- La gestión de estados de carga (`isLoading`), error y datos se realiza de forma declarativa con el hook `useQuery`.
- **Riesgo:** Si no se sincroniza la respuesta de TanStack Query con la base de datos local (SQLite, según ADR-001), los datos en caché podrían perderse al reiniciar completamente la aplicación en modo avión. Se debe asegurar la persistencia en SQLite en la primera descarga.

## Verificación
- El archivo `src/axios/apiClient.ts` define la instancia de Axios con la URL de MockAPI y `src/axios/api.services.ts` los servicios de medidores y lecturas (incluido `getAll`).
- La raíz en `src/app/_layout.tsx` envuelve la navegación en un `QueryClientProvider` (`staleTime` de 24 horas).
- Al abrir la app con red, `medidores_cache` y las lecturas enviadas quedan pobladas en SQLite sin consultar manualmente.
- Iniciar sesión con Bryan/Bryan123 funciona; con una clave distinta se muestra "Usuario o clave incorrectos".
- Al consultar un medidor con señal, activar el modo avión y volver a consultar el mismo medidor, la aplicación muestra la información en pantalla al instante sin arrojar error de red.

## Uso de IA
Se le consultó a la IA sobre cómo evitar peticiones duplicadas a la API al consultar un mismo medidor. La IA sugirió TanStack Query configurado con `staleTime`. Se aceptó la recomendación debido a la simplicidad que aporta en la gestión de caché y estados de red.