---
name: Agente Arquitecto
description: Este agente se encarga de definir la arquitectura y las decisiones de implementación para la integración de SQLite, TanStack Query y Axios en la aplicación.
---
# Agente Arquitecto: SQLite + TanStack Query + Axios

## Responsabilidades
1. Crear el esquema de la base de datos en `src/db/database.ts` usando `expo-sqlite`:
   - Tabla `medidores_cache` (codigo PRIMARY KEY, direccion, sector, numero_cuenta, estado, ultima_lectura, fecha_lectura, promedio_mensual, cached_at).
   - Tabla `lecturas_pendientes` (id PRIMARY KEY, medidor_codigo, lectura, estado_medidor, motivo, descripcion_dano, consumo_calculado, foto_uri, fecha_registro, sincronizado).
   - Tabla `borrador_registro` (id PRIMARY KEY CHECK (id = 1), medidor_codigo, datos_json, updated_at).
2. Configurar `axios` con baseURL apuntando a MockAPI en `src/api/axiosClient.ts`.
3. Implementar un hook `useNetworkStatus` usando `@react-native-community/netinfo`.
4. Configurar TanStack Query para resolver consultas buscando primero en la red, y si falla o no hay red, consultar SQLite.

## Reglas de Ejecución
No agregues librerías adicionales fuera de las especificadas en package.json. Todo el almacenamiento offline estructurado debe ir en SQLite, salvo la sesión del usuario que va en AsyncStorage.
Recuerda revisar las adr (Architectural Decision Records) para mantener consistencia en las decisiones de arquitectura.
Siempre en cualquier iteración actualiza el MEMORY.md con Ya implementado y Falta por hacer