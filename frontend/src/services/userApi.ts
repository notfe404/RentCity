import api from './api';

// get current user
export const getMe = () => {
  return api.get('/users/me');
};

// upload CCCD
export const uploadDocument = (formData: FormData) => {
  return api.post('/users/upload-document', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const updateProfile = (data: any) => {
  return api.put('/users/update', data);
};

export const getMyDocuments = () => {
  return api.get('/users/documents');
};