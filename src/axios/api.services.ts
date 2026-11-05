import axios from 'axios';

import type { Medidor } from '@/features/medidores/medidores.types';

import { apiClient } from './apiClient';

export interface Lectura {
  id?: string;
  medidorCodigo: string;
  codigoEmpleado: string;
  estadoMedidor: 'Normal' | 'Inaccesible' | 'Dañado';
  lectura: number | null;
  motivo?: string;
  descripcionDano?: string;
  consumoCalculado: number | null;
  esAnomalo: boolean;
  fotoURL?: string;
  fechaRegistro: string;
  /** Latitud GPS del punto de registro del medidor (decimal, ej. -0.180653). */
  latitud?: number;
  /** Longitud GPS del punto de registro del medidor (decimal, ej. -78.467838). */
  longitud?: number;
}

export const medidoresService = {
  async getAll(): Promise<Medidor[]> {
    try {
      const { data } = await apiClient.get<Medidor[]>('/medidores');
      return data;
    } catch (e) {
      if (axios.isAxiosError(e) && e.response?.status === 404) return [];
      throw e;
    }
  },
  async getByCodigo(codigo: string): Promise<Medidor | null> {
    try {
      const { data } = await apiClient.get<Medidor[]>(`/medidores?codigo=${codigo}`);
      return data.find((m) => m.codigo === codigo) ?? null;
    } catch (e) {
      // MockAPI responde 404 cuando el filtro no tiene coincidencias.
      if (axios.isAxiosError(e) && e.response?.status === 404) return null;
      throw e;
    }
  },
};

export const lecturasService = {
  async getAll(): Promise<Lectura[]> {
    try {
      const { data } = await apiClient.get<Lectura[]>('/lecturas');
      return data;
    } catch (e) {
      if (axios.isAxiosError(e) && e.response?.status === 404) return [];
      throw e;
    }
  },
  async create(lectura: Lectura): Promise<Lectura> {
    const { data } = await apiClient.post<Lectura>('/lecturas', lectura);
    return data;
  },
  async findByMedidor(medidorCodigo: string): Promise<Lectura[]> {
    try {
      const { data } = await apiClient.get<Lectura[]>('/lecturas', { params: { medidorCodigo } });
      return data;
    } catch (e) {
      // MockAPI responde 404 cuando el filtro no tiene coincidencias.
      if (axios.isAxiosError(e) && e.response?.status === 404) return [];
      throw e;
    }
  },
};
