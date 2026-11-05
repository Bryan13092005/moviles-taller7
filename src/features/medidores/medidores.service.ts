import NetInfo from '@react-native-community/netinfo';

import { medidoresService } from '@/axios/api.services';
import { getDb } from '@/db/database';
import { validarLecturaExistente } from '@/features/lecturas/lecturas.service';

import type { Medidor } from './medidores.types';
import { validarCodigoMedidor } from './medidores.validator';

interface MedidorRow {
  codigo: string;
  direccion: string;
  sector: string;
  numero_cuenta: string;
  estado: string;
  ultima_lectura: number;
  fecha_lectura: string;
  promedio_mensual: number;
  cached_at: string;
}

const toMedidor = (r: MedidorRow): Medidor => ({
  codigo: r.codigo,
  direccion: r.direccion,
  sector: r.sector,
  numeroCuenta: r.numero_cuenta,
  estado: r.estado,
  ultimaLectura: r.ultima_lectura,
  fechaLectura: r.fecha_lectura,
  promedioMensual: r.promedio_mensual,
});

// Fecha calendario en Quito (UTC-5, sin horario de verano) para no vencer la caché a las 19:00 locales.
const OFFSET_QUITO_MS = -5 * 60 * 60 * 1000;
const fechaQuito = (d: Date) => new Date(d.getTime() + OFFSET_QUITO_MS).toISOString().slice(0, 10);
const hoy = () => fechaQuito(new Date());

async function leerCache(codigo: string): Promise<MedidorRow | null> {
  const db = await getDb();
  return db.getFirstAsync<MedidorRow>('SELECT * FROM medidores_cache WHERE codigo = ?', [codigo]);
}

async function guardarCache(m: Medidor): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO medidores_cache
      (codigo, direccion, sector, numero_cuenta, estado, ultima_lectura, fecha_lectura, promedio_mensual, cached_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      m.codigo,
      m.direccion,
      m.sector,
      m.numeroCuenta,
      m.estado,
      m.ultimaLectura,
      m.fechaLectura,
      m.promedioMensual,
      new Date().toISOString(),
    ],
  );
}

export async function obtenerMedidor(codigo: string): Promise<Medidor> {
  // R2: código inválido no toca red ni BD.
  const validacion = validarCodigoMedidor(codigo);
  if (!validacion.esValido) {
    throw new Error(validacion.mensajeError);
  }

  // R10: si ya se registró este mes, se informa antes de llenar el formulario.
  const duplicada = await validarLecturaExistente(codigo);
  if (duplicada.existe) throw new Error(duplicada.mensaje);

  // R3: caché del día (hora de Quito) se sirve sin descargar de nuevo.
  const cache = await leerCache(codigo);
  if (cache && fechaQuito(new Date(cache.cached_at)) === hoy()) {
    return toMedidor(cache);
  }

  const red = await NetInfo.fetch();
  const hayRed = red.isConnected === true && red.isInternetReachable !== false;

  if (hayRed) {
    try {
      const remoto = await medidoresService.getByCodigo(codigo);
      if (!remoto) throw new Error('Medidor no encontrado');
      await guardarCache(remoto);
      return remoto;
    } catch (e) {
      // Sin respuesta de red: se usa el dato local aunque sea de otro día.
      if (cache) return toMedidor(cache);
      throw e;
    }
  }

  if (cache) return toMedidor(cache);
  throw new Error('Sin conexión y el medidor no está en caché local');
}
