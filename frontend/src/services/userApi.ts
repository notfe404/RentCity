import api from './api';
import type { ApiUser, UserDocument } from '@/types';

export interface ProfileUpdatePayload {
  fullName?: string;
  phone?: string;
  idCardUrl?: string;
}

export const getMe = () => {
  return api.get<ApiUser>('/users/me');
};

export const uploadDocument = (formData: FormData) => {
  return api.post<UserDocument>('/users/upload-document', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const updateProfile = (data: ProfileUpdatePayload) => {
  return api.put<ApiUser>('/users/update', data);
};

export const getMyDocuments = () => {
  return api.get<UserDocument[]>('/users/documents');
};

