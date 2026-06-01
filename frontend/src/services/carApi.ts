import api from './api';
import type { ApiCarResponse, ApiPageResponse } from '@/types';

interface SearchCarsParams {
  page?: number;
  size?: number;
  status?: 'AVAILABLE' | 'MAINTENANCE' | 'RETIRED';
  branchId?: number;
  categoryId?: number;
  keyword?: string;
}

export const searchCars = (params: SearchCarsParams = {}) => {
  return api.get<ApiPageResponse<ApiCarResponse>>('/cars/search', { params });
};

interface GetAvailableCarsParams {
  from: string;
  to: string;
  branchId?: number;
}

export const getAvailableCars = (params: GetAvailableCarsParams) => {
  return api.get<ApiCarResponse[]>('/cars/available', { params });
};

export const getCarById = (id: number | string) => {
  return api.get<ApiCarResponse>(`/cars/${id}`);
};

// ---- Admin Car CRUD ----
export interface AdminCarPayload {
  brand: string;
  model: string;
  licensePlate: string;
  year?: number;
  transmission: 'AUTO' | 'MANUAL';
  pricePerDay: number;
  deposit?: number;
  status: 'AVAILABLE' | 'MAINTENANCE' | 'RETIRED';
  description?: string;
  categoryId?: number;
  branchId?: number;
  seats?: number;
}

export const adminCreateCar = (data: AdminCarPayload) => {
  return api.post<ApiCarResponse>('/admin/cars', data);
};

export const adminUpdateCar = (id: number | string, data: Partial<AdminCarPayload>) => {
  return api.put<ApiCarResponse>(`/admin/cars/${id}`, data);
};

export const adminDeleteCar = (id: number | string) => {
  return api.delete(`/admin/cars/${id}`);
};
