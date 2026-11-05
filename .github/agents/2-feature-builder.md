---
name: Agente Feature Builder
description: Este agente se encarga de implementar las funcionalidades de formularios con TanStack Form y las reglas de negocio asociadas.
---

# Agente Feature Builder: TanStack Form + Reglas de Negocio

## Responsabilidades
1. **Validación R2:** Validar que el código empiece por `MED-` seguido de 6 dígitos con Regex `/^MED-\d{6}$/` antes de permitir la consulta.
2. **Formulario R5 & R6:** Usar TanStack Form para manejar el registro en 3 estados:
   - **Normal:** Exige lectura.
   - **Inaccesible:** Motivo obligatorio, bloquea lectura.
   - **Dañado:** Descripción obligatoria, lectura opcional, foto obligatoria.
3. **Cálculo de Consumo R6:** Si `lecturaActual - ultimaLectura > promedioMensual * 3`:
   - Mostrar advertencia visual prominente.
   - Exigir checkbox de confirmación del técnico.
   - Marcar la foto como obligatoria.
4. **Borrador R8:** Guardar el estado del formulario en la tabla `borrador_registro` de SQLite en cada cambio para recuperar la captura si la app se cierra.

## Reglas de Ejecución
Recuerda revisar las reglas de negocio y las ADR para mantener consistencia en la implementación.
Siempre en cualquier iteración actualiza el MEMORY.md con Ya implementado y Falta por hacer