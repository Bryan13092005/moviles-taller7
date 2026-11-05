import NetInfo from '@react-native-community/netinfo';
import axios from 'axios';

import { lecturasService, type Lectura } from '@/axios/api.services';
import { getDb } from '@/db/database';
import { getSession } from '@/features/auth/auth.service';

interface FilaPendiente {
  id: number;
  medidor_codigo: string;
  lectura: number | null;
  estado_medidor: Lectura['estadoMedidor'];
  motivo: string | null;
  descripcion_dano: string | null;
  consumo_calculado: number | null;
  foto_uri: string | null;
  fecha_registro: string;
  codigo_empleado: string | null;
  promedio_mensual: number | null;
  latitud: number | null;
  longitud: number | null;
}

export interface ResultadoSync {
  enviadas: number;
  fallidas: number;
  omitida: boolean;
}

// Cerrojo lógico (ADR-007): evita ejecuciones concurrentes si la red oscila.
let ejecutandoSincronizacion = false;

export async function sincronizarLecturasPendientes(): Promise<ResultadoSync> {
  if (ejecutandoSincronizacion) return { enviadas: 0, fallidas: 0, omitida: true };
  ejecutandoSincronizacion = true;

  let enviadas = 0;
  let fallidas = 0;
  try {
    const db = await getDb();
    const filas = await db.getAllAsync<FilaPendiente>(
      `SELECT l.id, l.medidor_codigo, l.lectura, l.estado_medidor, l.motivo,
              l.descripcion_dano, l.consumo_calculado, l.foto_uri, l.fecha_registro,
              l.codigo_empleado, l.latitud, l.longitud, m.promedio_mensual
       FROM lecturas_pendientes l
       LEFT JOIN medidores_cache m ON m.codigo = l.medidor_codigo
       WHERE l.sincronizado = 0
       ORDER BY l.id ASC`,
    );
    if (filas.length === 0) return { enviadas, fallidas, omitida: false };

    // Solo para filas antiguas sin empleado guardado.
    const empleadoSesion = (await getSession())?.codigoEmpleado ?? 'desconocido';

    for (const f of filas) {
      try {
        // Si un envío previo llegó al servidor pero se perdió la respuesta, no se vuelve a crear.
        const remotas = await lecturasService.findByMedidor(f.medidor_codigo);
        const yaExiste = remotas.some((r) => r.fechaRegistro === f.fecha_registro);

        if (!yaExiste) {
          await lecturasService.create({
            medidorCodigo: f.medidor_codigo,
            codigoEmpleado: f.codigo_empleado ?? empleadoSesion,
            estadoMedidor: f.estado_medidor,
            lectura: f.lectura,
            motivo: f.motivo ?? undefined,
            descripcionDano: f.descripcion_dano ?? undefined,
            consumoCalculado: f.consumo_calculado,
            esAnomalo:
              f.consumo_calculado !== null &&
              f.promedio_mensual !== null &&
              f.consumo_calculado > f.promedio_mensual * 3,
            fotoURL: f.foto_uri ?? undefined,
            fechaRegistro: f.fecha_registro,
            // Solo incluir si hay valor numérico; omitir el campo si es null.
            ...(f.latitud !== null && f.latitud !== undefined && { latitud: f.latitud }),
            ...(f.longitud !== null && f.longitud !== undefined && { longitud: f.longitud }),
          });
        }

        await db.runAsync('UPDATE lecturas_pendientes SET sincronizado = 1 WHERE id = ?', [f.id]);
        enviadas++;
      } catch (e) {
        // Un 4xx/5xx afecta solo a esa lectura; sin respuesta (red caída) se corta y se reintenta luego.
        fallidas++;
        if (axios.isAxiosError(e) && !e.response) break;
      }
    }
    return { enviadas, fallidas, omitida: false };
  } finally {
    ejecutandoSincronizacion = false;
  }
}

// Para llamar tras guardar una lectura: envía de inmediato si ya hay red.
export async function sincronizarSiHayRed(): Promise<void> {
  const red = await NetInfo.fetch();
  if (red.isConnected === true && red.isInternetReachable !== false) {
    await sincronizarLecturasPendientes();
  }
}
