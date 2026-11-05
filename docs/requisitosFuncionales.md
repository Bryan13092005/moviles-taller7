# Requisitos Funcionales - App EPMAPS Campo
 
## R1: Autenticación del Técnico
El técnico se identifica con correo electrónico y contraseña mediante Firebase Authentication (proveedor email/password). La sesión se persiste en AsyncStorage y se mantiene hasta que el usuario la cierre explícitamente. La contraseña debe tener mínimo 6 caracteres, al menos una mayúscula, una minúscula y un número. Incluye registro de cuenta, recuperación de contraseña por correo, cambio de contraseña con sesión activa y actualización del nombre visible (displayName) con updateProfile. Al crear o cambiar la contraseña se muestra un indicador animado de seguridad (débil, media o fuerte) según longitud, mayúsculas, minúsculas, números y símbolos.
 
## R2: Validación de Código de Medidor
El código de medidor debe cumplir la máscara estricta `MED-` seguido de 6 dígitos numéricos (`/^MED-\d{6}$/`). La aplicación no realiza peticiones ni consultas con un código incompleto.
 
## R3: Consulta y Caché de Datos
Con red, la app consulta los 7 datos del medidor desde MockAPI. En búsquedas posteriores o modo avión, los datos se sirven directamente desde la caché local (SQLite).
 
## R4: Registro Offline
Permite registrar lecturas sin conexión. El registro se guarda en SQLite marcado como pendiente de verificación.
 
## R5: Reglas de los Estados del Medidor
- **Normal:** Lectura actual obligatoria.
- **Inaccesible:** Motivo obligatorio, lectura deshabilitada.
- **Dañado:** Descripción obligatoria, lectura opcional, foto obligatoria.
 
## R6: Cálculo de Consumo y Anomalías
Calcula `Consumo = Lectura Actual - Última Lectura`. Si el consumo supera el triple del promedio mensual, muestra advertencia visual, exige confirmación del técnico y vuelve la foto obligatoria.
 
## R7: Fotografías y Permisos
La foto es obligatoria si el consumo es anómalo o el medidor está dañado. Las fotos se conservan en el almacenamiento permanente del teléfono (`FileSystem.documentDirectory`). Si se deniega el permiso de cámara, se explica la razón.
 
## R8: Borrador de Captura e Interrupción
Guarda el borrador del registro en tiempo real. Si la app se cierra inesperadamente, al abrirla ofrece continuar o descartar el proceso pendiente.
 
## R9: Detección de Conexión y Envíos Automáticos
Muestra en el Header global de todas las pantallas el estado de red y el contador de lecturas pendientes. Al recuperar la red, las lecturas pendientes se envían automáticamente a MockAPI sin duplicar.
 
## R10: Control de Edición y Duplicados
Permite editar lecturas en estado `PENDIENTE`. Bloquea la edición de lecturas `ENVIADAS` e impide registrar dos veces el mismo medidor en el mismo mes.