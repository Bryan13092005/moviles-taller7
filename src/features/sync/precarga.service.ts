import NetInfo from '@react-native-community/netinfo';

import { lecturasService, medidoresService } from '@/axios/api.services';
import { getDb } from '@/db/database';

let ejecutando = false;

// Al abrir la app con red: GET /medidores (caché SQLite, R3) y GET /lecturas (historial remoto para R10).
export async function precargarDatosRemotos(): Promise<void> {
  if (ejecutando) return;
  ejecutando = true;
  try {
    const red = await NetInfo.fetch();
    if (red.isConnected !== true || red.isInternetReachable === false) return;

    const [medidores, lecturas] = await Promise.all([
      medidoresService.getAll(),
      lecturasService.getAll(),
    ]);
    const db = await getDb();
    const ahora = new Date().toISOString();

    await db.withTransactionAsync(async () => {
      for (const m of medidores) {
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
            ahora,
          ],
        );
      }

      // Lecturas ya enviadas: se registran como ENVIADAS salvo que ya existan localmente.
      for (const l of lecturas) {
        const rawLat = l.latitud ?? (l as any).latitude;
        const rawLng = l.longitud ?? (l as any).longitude;
        const latVal = rawLat != null && !isNaN(Number(rawLat)) ? Number(rawLat) : null;
        const lngVal = rawLng != null && !isNaN(Number(rawLng)) ? Number(rawLng) : null;

        const existe = await db.getFirstAsync<{ id: number; latitud: number | null; longitud: number | null }>(
          'SELECT id, latitud, longitud FROM lecturas_pendientes WHERE medidor_codigo = ? AND fecha_registro = ?',
          [l.medidorCodigo, l.fechaRegistro],
        );
        if (existe) {
          // Si ya existe pero le faltan coordenadas y vienen remotas, actualizamos
          if ((existe.latitud == null || existe.longitud == null) && (latVal != null && lngVal != null)) {
            await db.runAsync(
              'UPDATE lecturas_pendientes SET latitud = COALESCE(latitud, ?), longitud = COALESCE(longitud, ?) WHERE id = ?',
              [latVal, lngVal, existe.id],
            );
          }
          continue;
        }
        await db.runAsync(
          `INSERT INTO lecturas_pendientes
            (medidor_codigo, lectura, estado_medidor, motivo, descripcion_dano,
             consumo_calculado, foto_uri, fecha_registro, sincronizado, codigo_empleado, latitud, longitud)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`,
          [
            l.medidorCodigo,
            l.lectura,
            l.estadoMedidor,
            l.motivo ?? null,
            l.descripcionDano ?? null,
            l.consumoCalculado,
            l.fotoURL ?? null,
            l.fechaRegistro,
            l.codigoEmpleado,
            latVal,
            lngVal,
          ],
        );
      }
    });
  } catch {
    // Sin red o API caída: la app sigue operando con lo que ya hay en SQLite.
  } finally {
    ejecutando = false;
  }
}
