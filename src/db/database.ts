import * as SQLite from 'expo-sqlite';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function init(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync('epmaps.db');
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS medidores_cache (
      codigo TEXT PRIMARY KEY NOT NULL,
      direccion TEXT,
      sector TEXT,
      numero_cuenta TEXT,
      estado TEXT,
      ultima_lectura REAL,
      fecha_lectura TEXT,
      promedio_mensual REAL,
      cached_at TEXT
    );
    CREATE TABLE IF NOT EXISTS lecturas_pendientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      medidor_codigo TEXT NOT NULL,
      lectura REAL,
      estado_medidor TEXT NOT NULL,
      motivo TEXT,
      descripcion_dano TEXT,
      consumo_calculado REAL,
      foto_uri TEXT,
      fecha_registro TEXT NOT NULL,
      sincronizado INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS borrador_registro (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      medidor_codigo TEXT,
      datos_json TEXT,
      updated_at TEXT
    );
  `);

  // Migración para instalaciones previas sin el empleado que capturó la lectura.
  const columnas = await db.getAllAsync<{ name: string }>('PRAGMA table_info(lecturas_pendientes)');
  if (!columnas.some((c) => c.name === 'codigo_empleado')) {
    await db.execAsync('ALTER TABLE lecturas_pendientes ADD COLUMN codigo_empleado TEXT');
  }

  // Migración: columnas de geolocalización GPS.
  if (!columnas.some((c) => c.name === 'latitud')) {
    await db.execAsync('ALTER TABLE lecturas_pendientes ADD COLUMN latitud REAL');
  }
  if (!columnas.some((c) => c.name === 'longitud')) {
    await db.execAsync('ALTER TABLE lecturas_pendientes ADD COLUMN longitud REAL');
  }

  return db;
}

export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) dbPromise = init();
  return dbPromise;
}
