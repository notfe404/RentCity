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
  deposit: number;
  status: 'AVAILABLE' | 'MAINTENANCE' | 'RETIRED';
  description?: string;
  categoryId?: number;
  branchId?: number;
  seats?: number;
  initialCondition?: {
    condition: 'GOOD';
    odometer: number;
    fuelLevel: number;
    damageFound: boolean;
    notes?: string;
  };
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

export const uploadInitialConditionImages = (id: number | string, files: File[]) => {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));
  return api.post(`/admin/cars/${id}/condition/images`, formData);
};

export const uploadCarImages = (id: number | string, files: File[], primaryIndex?: number) => {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));
  if (primaryIndex !== undefined) {
    formData.append('primaryIndex', primaryIndex.toString());
  }
  return api.post(`/admin/cars/${id}/images`, formData);
};

export const deleteCarImage = (carId: number | string, imageId: number | string) => {
  return api.delete(`/admin/cars/${carId}/images/${imageId}`);
};

export const setPrimaryCarImage = (carId: number | string, imageId: number | string) => {
  return api.patch(`/admin/cars/${carId}/images/${imageId}/primary`);
};
