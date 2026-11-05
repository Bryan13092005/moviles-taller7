import { getDb } from '@/db/database';
import { getSession } from '@/features/auth/auth.service';

import { limpiarBorrador } from './borrador.service';
import type { EstadoMedidor } from './useLecturaStore';

export interface DatosLecturaLocal {
  medidorCodigo: string;
  estadoMedidor: EstadoMedidor;
  lectura: number | null;
  motivo?: string;
  descripcionDano?: string;
  consumoCalculado: number | null;
  fotoUri: string | null;
  /** Coordenadas GPS de la ubicación del medidor en el momento del registro. */
  latitud?: number | null;
  longitud?: number | null;
}

const ETIQUETA_ESTADO: Record<EstadoMedidor, string> = {
  normal: 'Normal',
  inaccesible: 'Inaccesible',
  danado: 'Dañado',
};

// R10: un medidor solo puede registrarse una vez por mes (cualquier estado de sincronización).
export async function validarLecturaExistente(
  medidorCodigo: string,
): Promise<{ existe: boolean; mensaje?: string }> {
  const db = await getDb();
  const now = new Date();
  const inicio = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const fin = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
  const row = await db.getFirstAsync<{ id: number }>(
    `SELECT id FROM lecturas_pendientes
     WHERE medidor_codigo = ? AND fecha_registro >= ? AND fecha_registro < ? LIMIT 1`,
    [medidorCodigo, inicio, fin],
  );
  return row
    ? { existe: true, mensaje: `El medidor ${medidorCodigo} ya tiene una lectura registrada este mes.` }
    : { existe: false };
}

// R4: queda PENDIENTE (sincronizado = 0) hasta que la cola la envíe.
export async function guardarLecturaLocal(datos: DatosLecturaLocal): Promise<number> {
  const duplicada = await validarLecturaExistente(datos.medidorCodigo);
  if (duplicada.existe) throw new Error(duplicada.mensaje);

  const db = await getDb();
  const codigoEmpleado = (await getSession())?.codigoEmpleado ?? null;
  const res = await db.runAsync(
    `INSERT INTO lecturas_pendientes
      (medidor_codigo, lectura, estado_medidor, motivo, descripcion_dano,
       consumo_calculado, foto_uri, fecha_registro, sincronizado, codigo_empleado,
       latitud, longitud)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
    [
      datos.medidorCodigo,
      datos.lectura,
      ETIQUETA_ESTADO[datos.estadoMedidor],
      datos.motivo ?? null,
      datos.descripcionDano ?? null,
      datos.consumoCalculado,
      datos.fotoUri,
      new Date().toISOString(),
      codigoEmpleado,
      datos.latitud ?? null,
      datos.longitud ?? null,
    ],
  );

  // R8: el borrador ya no es necesario una vez guardada la lectura.
  await limpiarBorrador();
  return res.lastInsertRowId;
}

export interface LecturaRegistrada {
  id: number;
  medidor_codigo: string;
  lectura: number | null;
  estado_medidor: string;
  motivo: string | null;
  descripcion_dano: string | null;
  consumo_calculado: number | null;
  foto_uri: string | null;
  fecha_registro: string;
  sincronizado: number;
  latitud: number | null;
  longitud: number | null;
}

export async function listarLecturas(): Promise<LecturaRegistrada[]> {
  const db = await getDb();
  return db.getAllAsync<LecturaRegistrada>(
    'SELECT * FROM lecturas_pendientes ORDER BY fecha_registro DESC',
  );
}

export interface CambiosLectura {
  lectura: number | null;
  motivo: string | null;
  descripcionDano: string | null;
  fotoUri?: string | null;
}

// Datos del medidor en caché para reevaluar el consumo al editar (R6).
export async function obtenerReferenciaConsumo(
  medidorCodigo: string,
): Promise<{ ultimaLectura: number; promedioMensual: number } | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ ultima_lectura: number; promedio_mensual: number }>(
    'SELECT ultima_lectura, promedio_mensual FROM medidores_cache WHERE codigo = ?',
    [medidorCodigo],
  );
  return row ? { ultimaLectura: row.ultima_lectura, promedioMensual: row.promedio_mensual } : null;
}

// R10: solo se edita mientras siga PENDIENTE (sincronizado = 0).
export async function actualizarLecturaPendiente(id: number, cambios: CambiosLectura): Promise<void> {
  const db = await getDb();
  const actual = await db.getFirstAsync<{ medidor_codigo: string }>(
    'SELECT medidor_codigo FROM lecturas_pendientes WHERE id = ?',
    [id],
  );
  const cache = actual
    ? await db.getFirstAsync<{ ultima_lectura: number }>(
        'SELECT ultima_lectura FROM medidores_cache WHERE codigo = ?',
        [actual.medidor_codigo],
      )
    : null;
  const consumo =
    cambios.lectura !== null && cache ? cambios.lectura - cache.ultima_lectura : null;

  const res = await db.runAsync(
    `UPDATE lecturas_pendientes
     SET lectura = ?, motivo = ?, descripcion_dano = ?, consumo_calculado = ?,
         foto_uri = COALESCE(?, foto_uri)
     WHERE id = ? AND sincronizado = 0`,
    [cambios.lectura, cambios.motivo, cambios.descripcionDano, consumo, cambios.fotoUri ?? null, id],
  );
  if (res.changes === 0) throw new Error('La lectura ya fue enviada y no se puede editar');
}
