import api from './api';
import type { CarReviewsResponse, CreateReviewRequest, Review } from '@/types';

export const createReview = (payload: CreateReviewRequest) =>
  api.post<Review>('/reviews', payload);

export const getMyBookingReview = (bookingId: number | string) =>
  api.get<Review>(`/reviews/my/booking/${bookingId}`);

export const getCarReviews = (carId: number | string, page = 0, size = 5) =>
  api.get<CarReviewsResponse>(`/cars/${carId}/reviews`, { params: { page, size } });

export const adminGetReviews = () =>
  api.get<Review[]>('/admin/reviews');

export const adminUpdateReviewVisibility = (id: number | string, visible: boolean) =>
  api.patch<Review>(`/admin/reviews/${id}/visibility`, { visible });

export const adminReplyToReview = (id: number | string, staffReply: string) =>
  api.patch<Review>(`/admin/reviews/${id}/reply`, { staffReply });
