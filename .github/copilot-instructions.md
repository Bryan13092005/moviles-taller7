# Instrucciones Globales de Proyecto: App EPMAPS Campo

Este documento contiene las reglas, estándares de arquitectura, diseño visual y contexto de negocio para el desarrollo de la prueba técnica de desarrollo móvil para **EPMAPS (Empresa Pública Metropolitana de Agua Potable y Saneamiento de Quito)**.

---

## 1. Contexto del Problema y Objetivo
Los técnicos de EPMAPS registran lecturas de medidores de agua en zonas rurales (Nono, Lloa, Pacto, Nanegalito, Calacalí) y subterráneas donde **no hay señal celular**. La aplicación debe permitir el trabajo 100% offline, guardar caché de consultas, registrar lecturas con fotos de respaldo, manejar errores, calcular anomalías de consumo y sincronizar automáticamente al recuperar la conexión.

---

## 2. Restricciones Técnicas y Stack Obligatorio
- **Framework:** React Native con Expo SDK 57 (Expo Router) y TypeScript en modo estricto.
- **Base de Datos Local / Offline:** `expo-sqlite` (Base de datos relacional para caché y colas) y `@react-native-async-storage/async-storage` (Únicamente para datos livianos de sesión).
- **Gestión de Red y Caché:** `axios` + `@tanstack/react-query` + `@react-native-community/netinfo`.
- **Formularios y Validaciones:** `@tanstack/react-form` + Expresiones Regulares (Regex) / `zod`.
- **Cámara y Archivos:** `expo-camera` + `expo-file-system`.
- **Backend / Mock:** MockAPI (recursos: `medidores` y `lecturas`).

> ⚠️ **REGLA DE DEPENDENCIAS:** No instales ni agregues librerías adicionales fuera de las mencionadas. Cada dependencia agregada que no responda a un requisito explicito resta puntos en la evaluación. A no ser que sean estrictamente necesarias y debidamente justificadas en los ADR correspondientes. Siempre pregunta antes de agregar nuevas dependencias.

---

## 3. Mapeo Rígido de Requisitos de Negocio (R1 a R10)

Cualquier código o componente generado debe respetar estrictamente estos requisitos:

1. **R1 (Sesión):** Login con código de empleado y clave. Persistir sesión en `AsyncStorage` hasta que el técnico cierre sesión explícitamente.
2. **R2 (Validación Código):** Formato estricto `MED-` seguido de 6 dígitos numéricos (`/^MED-\d{6}$/`). Si el código está incompleto o mal formateado, mostrar error inmediato y **NO realizar peticiones a la red ni a la base de datos**.
3. **R3 (Caché y Consulta):** Con red, consultar a MockAPI y mostrar los 7 datos del medidor (dirección, sector, cuenta, estado, última lectura, fecha última lectura, promedio mensual). Guardar en SQLite. En modo avión o re-consulta durante el día, servir los datos inmediatamente desde SQLite sin realizar nueva descarga.
4. **R4 (Registro Offline):** Permitir registrar la lectura en modo avión. La lectura queda guardada localmente con estado `PENDIENTE` para ser verificada.
5. **R5 (Reglas de los 3 Estados):**
   - **Normal:** Lectura actual obligatoria.
   - **Inaccesible:** Motivo obligatorio. Bloquea el campo de lectura.
   - **Dañado:** Descripción del daño obligatoria. Campo de lectura opcional.
6. **R6 (Anomalía de Consumo):** Calcular `Consumo = Lectura Actual - Última Lectura`. Si `Consumo > Promedio Mensual * 3`:
   - Mostrar advertencia visual prominente de consumo alto.
   - Exigir al técnico un checkbox de confirmación explícita.
   - Convertir la foto del medidor en **OBLIGATORIA**.
7. **R7 (Fotos y Permisos):** La foto es obligatoria si el consumo es anómalo o si el estado es `Dañado`. Guardar la imagen de forma permanente en el almacenamiento local (`expo-file-system`). Si el permiso de cámara es denegado, mostrar un mensaje explicativo y permitir continuar solo si la foto es opcional.
8. **R8 (Borrador e Interrupción):** El registro puede ocupar varias pantallas. Guardar el progreso en tiempo real en la tabla `borrador_registro` de SQLite. Si la app se cierra inesperadamente, al abrirla debe ofrecer opción de **Continuar** o **Descartar** la captura pendiente.
9. **R9 (Sincronización Transparente):**
   - Mostrar en el Header superior de **todas las pantallas**: Indicador de conexión (Con red / Sin red) y contador de lecturas pendientes por enviar.
   - Al recuperar señal, la cola de lecturas pendientes en SQLite debe enviarse automáticamente a MockAPI sin duplicar registros.
10. **R10 (Edición y Control de Duplicados):**
    - Mientras una lectura esté en estado `PENDIENTE`, se puede editar. Una vez enviada (`ENVIADA`), la edición queda bloqueada.
    - Impedir registrar 2 veces el mismo medidor en el mismo mes.

---

## 4. Guía de Diseño Visual (Evitar Sanción de Diseño Genérico)

- **Paleta de Colores Institucional (EPMAPS Quito):**
  - Azul Principal: `#004B87` (Headers, botones de acción principal, títulos)
  - Azul Acento / Secundario: `#00A3E0` (Tarjetas seleccionadas, bordes)
  - Verde Estado (Sincronizado): `#10B981` (Conexión activa, lecturas enviadas)
  - Naranja Advertencia (Pendiente / Anomalía): `#F59E0B` (Alerta de consumo triple, estado pendiente)
  - Rojo Error / Dañado: `#EF4444` (Medidor dañado, errores de validación)
  - Fondo Global: `#F8FAFC`
  - Tarjetas / Contenedores: `#FFFFFF` con border radius de `12px` y sombras suaves (`elevation: 2`).
- **Tipografía:** Usar la fuente `Roboto` (vía `@expo-google-fonts/roboto`).
- **Layout:** Pantallas limpias, botones amplios aptos para trabajo de campo, campos de número con teclado numérico por defecto (`keyboardType="numeric"`).

---

## 5. Gestión de ADR (Architecture Decision Records)
- Todas las decisiones técnicas relevantes están registradas en la carpeta `docs/adr/`.
- Cualquier cambio de librería o flujo de datos debe consultar primero los archivos ADR correspondientes (`ADR-001` a `ADR-007`).
- En las respuestas y código generado, prioriza la simplicidad, el rendimiento en dispositivos móviles físicos y el manejo defensivo de errores offline.
- Siempre documenta cualquier decisión que afecte la arquitectura o el flujo de datos en los ADR correspondientes.

Al finalizar cualquier instruccion modifica en MEMORY.md el apartado de Ya implementado y Falta por hacer con maximo 50 lineas