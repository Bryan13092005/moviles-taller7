# MEMORY.md - Metodología FDD (Feature Driven Development)

## Propósito
Este archivo sirve como memoria de referencia para proyectos que utilizan la metodología FDD (Feature Driven Development), permitiendo mantener criterios, decisiones y prácticas consistentes durante el desarrollo.

---

## Principios de FDD

1. Desarrollar un modelo general del dominio.
2. Construir una lista de funcionalidades (Features).
3. Planificar por funcionalidad.
4. Diseñar por funcionalidad.
5. Construir por funcionalidad.

---

## Definición de Feature

Una feature debe:
- Aportar valor al negocio.
- Ser pequeña y desarrollable en pocos días.
- Tener un resultado observable.

Formato recomendado:

<Acción> <Resultado> <Objeto>

Ejemplos:
- Generar reporte de ventas.
- Actualizar información de cliente.
- Consultar historial de pagos.

---

## Estructura del Proyecto

### Dominios
- Gestión de Clientes
- Gestión de Productos
- Gestión de Ventas
- Reportes

### Roles
- Project Manager
- Chief Architect
- Development Manager
- Chief Programmer
- Class Owner
- Domain Expert

---

## Convenciones

### Nomenclatura
- Features: Verbo + Objeto.
- Clases: PascalCase.
- Métodos: camelCase.
- Variables: camelCase.

### Control de Versiones
- main: producción.
- develop: integración.
- feature/<nombre-feature>: desarrollo.

## Registro de Decisiones

| Fecha | Decisión | Responsable |
|---------|---------|---------|
| YYYY-MM-DD | Descripción | Nombre |

---

## Lecciones Aprendidas

- Documentar hallazgos relevantes.
- Registrar problemas recurrentes.
- Mantener recomendaciones para futuras iteraciones.

---

## Métricas Recomendadas

- Features completadas por iteración.
- Tiempo promedio por feature.
- Defectos por feature.
- Cobertura de pruebas.
- Velocidad del equipo.

---

## Ya implementado

- SQLite: src/db/database.ts (medidores_cache, lecturas_pendientes, borrador_registro).
- Axios: src/axios/apiClient.ts y api.services.ts (medidores, lecturas).
- Auth (R1/RF1): reemplazados los usuarios fijos por Firebase Authentication con email/password; sesión persistida en AsyncStorage.
- Login R1 en src/app/index.tsx (TanStack Form, redirige a /busqueda).
- Deps agregadas: expo-sqlite, @react-native-async-storage/async-storage.
- Sync (R9): sync.service.ts (cerrojo, sin duplicados) y useSyncListener montado en _layout.
- R10: validarLecturaExistente en lecturas.service (bloquea al guardar).
- Pantalla /historial (R10): chips PENDIENTE/ENVIADO, edición solo PENDIENTE, enlace desde /busqueda.
- Fixes UI auditoría: dismissAll al guardar, logout en /busqueda, barra de red en login, reevaluación de anomalía (confirmación + foto) al editar en /historial, expo-image reemplazado por Image nativo.
- Correcciones auditoría: .env + fallback URL, sync inmediato tras guardar, fallos 4xx/5xx no bloquean la cola, codigo_empleado por lectura (migración), duplicado mensual al buscar, caché con día de Quito (UTC-5).
- Fix sync: findByMedidor trata el 404 de MockAPI (sin coincidencias) como lista vacía; antes dejaba lecturas en pendientes.
- Alertas estilizadas: components/app-alert.tsx (appAlert + AppAlertHost en _layout) para login y consulta de medidor; 404 de medidores = "Medidor no encontrado".
- _layout.tsx: fuentes Roboto, QueryClientProvider (staleTime 24h), init SQLite, Stack.
- Medidores (R2, R3): medidores.types/validator/service.ts y hook useMedidorQuery.
- Pantalla /busqueda (TanStack Form + useQuery, tarjeta con 7 datos).
- NetworkStatusBar (R9) montada en busqueda, historial y registro.
- Store Zustand useLecturaStore (R5) y borrador.service.ts (R8: guardar, obtener, limpiar, restaurar, autoguardado).
- Pantalla /registro/paso1-estado (R5): estados, motivo/daño obligatorios.
- Precarga: sync/precarga.service.ts hace GET medidores y lecturas al abrir con red y al reconectar (upsert en SQLite).
- R8: autoguardado global + volcado en AppState (borrador.service), aviso Continuar/Descartar al abrir en /busqueda (useRecuperarBorrador).
- Botón Cancelar registro (components/boton-cancelar-registro.tsx) en paso1, paso2 y confirmación.
- Limpieza: eliminados explore, app-tabs, themed-*, hooks/theme, reset-project y assets de plantilla.
- Utilidades: calculoConsumo.ts (R6), utils/fileSystemStorage.ts (R7), lecturas.service.ts (R4, guarda y limpia borrador).
- Pantallas paso2-lectura (R5, R6) y confirmacion (R4, R7, R8: cámara, guardar, reset, alerta).
- UI moderna (skill epmaps-uio-moderno): components/header-epmaps.tsx (banner azul con logo+EPMAPS+píldoras de red/pendientes) en todas las pantallas incl. login; botones con relieve; Alert de cierre de sesión y de login fallido.
- Auth Firebase (R1): src/features/auth/auth.service.ts (login, registro, recuperarContrasena, cambiarContrasena, getSession, observarSesion, logout) con config/firebase.ts y persistencia en AsyncStorage; errores traducidos en auth.errors.ts y política en password.ts.
- Pantallas auth: login en src/app/index.tsx, registro en /auth/registro, recuperación en /auth/recuperar-password y cambio de contraseña en /cuenta/cambiar-password. Componentes compartidos en src/components/auth (AuthScreen, PasswordField, PasswordRequirements, estilos).
- Editar nombre: /cuenta/editar-nombre con actualizarNombre() en auth.service (updateProfile de Firebase) y validación en profile.ts (2 a 60 caracteres, espacios normalizados).
- Animaciones (skill reanimated-view): src/components/animations (AnimatedSpinner, FadeSlideIn, PressableScale, PulseView, useShakeAnimation). Barra animada en los 3 pasos del registro, shake al fallar el login, pulso en la barra de red, escala al presionar tarjetas del historial, fade/slide del banner de anomalía y del resumen del medidor, acento animado del header.
- Busqueda: guard de sesión, correo de la sesión visible y enlace a Cambiar contraseña junto a Cerrar Sesión.
- Regla de contraseña aplicada en registro y cambio: mínimo 6 caracteres, una mayúscula, una minúscula y un número.
- Login robusto: getSession espera authStateReady con timeout de 5 s y login usa timeout de 15 s; si no hay red o Firebase no responde, el botón deja de girar y se muestra un mensaje claro.
- Indicador de seguridad de contraseña: password-strength-indicator.tsx con barra animada (débil/media/fuerte) y cálculo en calcularFortalezaContrasena(); visible en registro y nueva contraseña.
- UI con Uniwind (Tailwind CSS v4): global.css con tokens EPMAPS y tipografías Roboto, metro.config.js con withUniwindConfig, SafeAreaListener en _layout; todas las pantallas usan className (sin StyleSheet) y las clases compartidas de auth están en auth-classes.ts (ADR-009).

---

- Fix APK: EXPO_PUBLIC_URL definida en eas.json (.env está ignorado por git); botón Buscar refetch si el código no cambia.

- Paso 2: lectura inválida (< última lectura, no numérica o vacía en normal) oculta el consumo y deshabilita "Siguiente Paso".

- Permiso de cámara: modal previo en español (appAlert con acciones) antes del diálogo del sistema.

- Búsqueda: alerta de éxito (✓ verde) al encontrar medidor y se oculta el teclado.
- Teclado: `KeyboardAvoidingView` con ajuste en iOS/Android y `ScrollView` interactivo en todos los formularios; edición de historial también desplaza su modal al enfocar campos.

## Falta por hacer

- Probar flujo completo en dispositivo (cámara, permisos, modo avión, sync al reconectar).
- R8: aviso de borrador al abrir la app, no solo en Paso 1.
- Subir la foto a MockAPI (hoy se envía la ruta local).
- ADR-002/006/007 actualizados (usuarios fijos, precarga). ADR-008 documenta borrador global y Cancelar.

---

## Checklist de Finalización

- [ ] Diseño aprobado.
- [ ] Código revisado.
- [ ] Pruebas ejecutadas.
- [ ] Documentación actualizada.
- [ ] Feature desplegada.
- [ ] Validación de negocio realizada.
