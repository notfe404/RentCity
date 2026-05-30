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
