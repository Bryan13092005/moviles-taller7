import { create } from 'zustand';

export type EstadoMedidor = 'normal' | 'inaccesible' | 'danado';

export interface DatosLectura {
  medidorCodigo: string;
  estadoMedidor: EstadoMedidor;
  lecturaActual: string;
  motivoInaccesibilidad: string;
  descripcionDano: string;
  fotoUri: string | null;
  esAnomalo: boolean;
  confirmacionAnomalia: boolean;
  /** Coordenadas GPS capturadas durante el registro de la lectura. */
  latitud: number | null;
  longitud: number | null;
}

interface LecturaActions {
  setMedidorCodigo: (v: string) => void;
  setEstadoMedidor: (v: EstadoMedidor) => void;
  setLecturaActual: (v: string) => void;
  setMotivoInaccesibilidad: (v: string) => void;
  setDescripcionDano: (v: string) => void;
  setFotoUri: (v: string | null) => void;
  setEsAnomalo: (v: boolean) => void;
  setConfirmacionAnomalia: (v: boolean) => void;
  setUbicacion: (latitud: number, longitud: number) => void;
  restaurarFormulario: (datos: Partial<DatosLectura>) => void;
  resetFormulario: () => void;
}

export const estadoInicial: DatosLectura = {
  medidorCodigo: '',
  estadoMedidor: 'normal',
  lecturaActual: '',
  motivoInaccesibilidad: '',
  descripcionDano: '',
  fotoUri: null,
  esAnomalo: false,
  confirmacionAnomalia: false,
  latitud: null,
  longitud: null,
};

export const useLecturaStore = create<DatosLectura & LecturaActions>((set) => ({
  ...estadoInicial,
  setMedidorCodigo: (medidorCodigo) => set({ medidorCodigo }),
  // R5: Inaccesible bloquea la lectura; los campos de otros estados se limpian.
  setEstadoMedidor: (estadoMedidor) =>
    set((s) => ({
      estadoMedidor,
      lecturaActual: estadoMedidor === 'inaccesible' ? '' : s.lecturaActual,
      motivoInaccesibilidad: estadoMedidor === 'inaccesible' ? s.motivoInaccesibilidad : '',
      descripcionDano: estadoMedidor === 'danado' ? s.descripcionDano : '',
    })),
  setLecturaActual: (lecturaActual) => set({ lecturaActual }),
  setMotivoInaccesibilidad: (motivoInaccesibilidad) => set({ motivoInaccesibilidad }),
  setDescripcionDano: (descripcionDano) => set({ descripcionDano }),
  setFotoUri: (fotoUri) => set({ fotoUri }),
  setEsAnomalo: (esAnomalo) =>
    set((s) => ({ esAnomalo, confirmacionAnomalia: esAnomalo ? s.confirmacionAnomalia : false })),
  setConfirmacionAnomalia: (confirmacionAnomalia) => set({ confirmacionAnomalia }),
  setUbicacion: (latitud, longitud) => set({ latitud, longitud }),
  restaurarFormulario: (datos) => set({ ...estadoInicial, ...datos }),
  resetFormulario: () => set({ ...estadoInicial }),
}));

export const seleccionarDatos = (s: DatosLectura): DatosLectura => ({
  medidorCodigo: s.medidorCodigo,
  estadoMedidor: s.estadoMedidor,
  lecturaActual: s.lecturaActual,
  motivoInaccesibilidad: s.motivoInaccesibilidad,
  descripcionDano: s.descripcionDano,
  fotoUri: s.fotoUri,
  esAnomalo: s.esAnomalo,
  confirmacionAnomalia: s.confirmacionAnomalia,
  latitud: s.latitud,
  longitud: s.longitud,
});
