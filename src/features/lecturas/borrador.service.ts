import { AppState } from 'react-native';

import { getDb } from '@/db/database';

import { seleccionarDatos, useLecturaStore, type DatosLectura } from './useLecturaStore';

interface BorradorRow {
  medidor_codigo: string | null;
  datos_json: string | null;
}

export async function guardarBorrador(datos: DatosLectura): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO borrador_registro (id, medidor_codigo, datos_json, updated_at)
     VALUES (1, ?, ?, ?)`,
    [datos.medidorCodigo, JSON.stringify(datos), new Date().toISOString()],
  );
}

export async function obtenerBorrador(): Promise<DatosLectura | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<BorradorRow>(
    'SELECT medidor_codigo, datos_json FROM borrador_registro WHERE id = 1',
  );
  if (!row?.datos_json) return null;
  try {
    return JSON.parse(row.datos_json) as DatosLectura;
  } catch {
    // JSON corrupto: se descarta para no bloquear el arranque.
    await limpiarBorrador();
    return null;
  }
}

export async function limpiarBorrador(): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM borrador_registro WHERE id = 1');
}

// R8: "Continuar" carga el borrador completo en Zustand.
export async function restaurarBorrador(): Promise<boolean> {
  const datos = await obtenerBorrador();
  if (!datos) return false;
  useLecturaStore.getState().restaurarFormulario(datos);
  return true;
}

// R8: guarda en SQLite cada cambio del formulario; devuelve la función para detenerlo.
export function iniciarAutoguardado(): () => void {
  return useLecturaStore.subscribe((state, prev) => {
    const datos = seleccionarDatos(state);
    if (!datos.medidorCodigo) return;
    const anterior = seleccionarDatos(prev);
    if (JSON.stringify(datos) === JSON.stringify(anterior)) return;
    guardarBorrador(datos).catch(() => undefined);
  });
}

// R8: autoguardado global y volcado final cuando la app pasa a segundo plano o se cierra.
export function iniciarProteccionBorrador(): () => void {
  const detener = iniciarAutoguardado();
  const appState = AppState.addEventListener('change', (estado) => {
    if (estado === 'active') return;
    const datos = seleccionarDatos(useLecturaStore.getState());
    if (datos.medidorCodigo) guardarBorrador(datos).catch(() => undefined);
  });
  return () => {
    detener();
    appState.remove();
  };
}

// Descarta el registro en curso (botón Cancelar): primero el estado en memoria, luego el borrador.
export async function cancelarRegistro(): Promise<void> {
  useLecturaStore.getState().resetFormulario();
  await limpiarBorrador();
}
