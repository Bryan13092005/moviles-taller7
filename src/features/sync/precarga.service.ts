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
        const existe = await db.getFirstAsync<{ id: number }>(
          'SELECT id FROM lecturas_pendientes WHERE medidor_codigo = ? AND fecha_registro = ?',
          [l.medidorCodigo, l.fechaRegistro],
        );
        if (existe) continue;
        await db.runAsync(
          `INSERT INTO lecturas_pendientes
            (medidor_codigo, lectura, estado_medidor, motivo, descripcion_dano,
             consumo_calculado, foto_uri, fecha_registro, sincronizado, codigo_empleado)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
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
