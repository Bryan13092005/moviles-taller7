import { Directory, File, Paths } from 'expo-file-system';
const CARPETA_FOTOS = 'fotos_lecturas';

// R7: copia la foto del caché temporal al directorio de documentos (permanente).
export function guardarFotoPermanente(uriTemporal: string, codigoMedidor: string): string {
  const carpeta = new Directory(Paths.document, CARPETA_FOTOS);
  carpeta.create({ intermediates: true, idempotent: true });

  const origen = new File(uriTemporal);
  const extension = origen.extension || '.jpg';
  const destino = new File(carpeta, `${codigoMedidor}_${Date.now()}${extension}`);
  origen.copy(destino);
  return destino.uri;
}
