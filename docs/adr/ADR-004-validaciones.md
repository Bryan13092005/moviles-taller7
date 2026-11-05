# ADR-004: Usar Expresiones Regulares y TanStack Form para la validación de datos en tiempo real

## Estado
Aceptado.

## Fecha
2026-10-27

## Requisitos relacionados
R2, R5, R6

## Contexto
La aplicación requiere verificar la integridad de la información ingresada por el técnico en tiempo real antes de procesar cualquier acción. En particular:
1. El código de medidor debe cumplir con la máscara estricta `MED-` seguido de exactamente 6 dígitos numéricos (R2). Si el código no está completo o es inválido, la aplicación no debe realizar consultas al sistema ni a la base de datos (R2).
2. Se deben aplicar reglas de validación condicionales según el estado del medidor (*Normal*, *Inaccesible*, *Dañado*) (R5).
3. Se deben validar umbrales numéricos de consumo para identificar anomalías (R6).

 Se requiere un mecanismo de validación reactivo en tiempo real que prevenga errores de ingreso en campo de forma inmediata.

## Alternativas consideradas

| Alternativa | Ventajas en este proyecto | Desventajas en este proyecto |
| :--- | :--- | :--- |
| **Expresiones Regulares (Regex) + TanStack Form** | TanStack Form permite ejecutar validaciones en tiempo real (`onChange` / `onBlur`) campo por campo directamente en la interfaz. El uso de la expresión regular `/^MED-\d{6}$/` garantiza una validación matemática estricta de la máscara sin requerir librerías de esquemas adicionales como Zod o Yup. | La lógica de validación condicional compleja debe escribirse dentro de las funciones de validación de los campos de TanStack Form. |
| **Validaciones manuales imperativas (`if / else`) en eventos de Submit** | No agrega configuración ni conceptos de librerías de formularios; usa condicionales nativos de JavaScript. | No proporciona retroalimentación en tiempo real al usuario mientras escribe. Se corre el riesgo de ejecutar peticiones a la API o SQLite si se omite un condicional en el flujo de ejecución. |
| **Integración de Zod / Yup con TanStack Form** | Permite definir esquemas de validación fuertemente tipados en archivos independientes. | Agrega una librería de esquemas adicional al `package.json` cuando TanStack Form ya posee capacidades de validación nativa fuertemente tipada en TypeScript. |

## Decisión
Se usan **Expresiones Regulares (Regex)** para la validación estricta del formato del medidor (`/^MED-\d{6}$/`) integradas directamente en las reglas de validación en tiempo real de **TanStack Form**. La consulta a la red o base de datos queda completamente bloqueada hasta que el campo cumpla con la regla Regex.

## Consecuencias
- Retroalimentación visual inmediata al técnico mientras escribe el código del medidor o la lectura actual.
- Se cumple de forma infalible el requisito R2: ninguna cadena que no coincida con `MED-XXXXXX` dispara peticiones a MockAPI o SQLite.
- **Riesgo:** Si las expresiones regulares son demasiado estrictas o no contemplan caracteres especiales permitidos en los campos de texto libre (como el motivo de inaccesibilidad), podrían bloquear al técnico. Se deben definir pruebas unitarias simples para las Regex.

## Verificación
- El archivo `src/features/medidores/medidores.validator.ts` contiene la constante de la Regex `/^MED-\d{6}$/`.
- En la interfaz, al escribir `MED-1234` (incompleto) y presionar buscar, el botón permanece deshabilitado o muestra el mensaje de error inmediatamente sin realizar peticiones de red ni consultas en la consola.

## Uso de IA
Se consultó a la IA sobre si valía la pena instalar otra dependencia como Zod para validar el código del medidor o utilizar TanStack Form con validación Regex nativa para evitar dependencias innecesarias en el `package.json`. Se decidió usar TanStack Form con Regex.