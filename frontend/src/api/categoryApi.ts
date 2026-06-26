import apiClient from './apiClient';
import type { Category, CategoryRequest } from '../types/category';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string | null;
}

export const categoryApi = {
  getAll: async (): Promise<Category[]> => {
    const res = await apiClient.get<ApiResponse<Category[]>>('/categories');
    return res.data.data;
  },

  create: async (request: CategoryRequest): Promise<Category> => {
    const res = await apiClient.post<ApiResponse<Category>>('/categories', request);
    return res.data.data;
  },

  update: async (id: number, request: CategoryRequest): Promise<Category> => {
    const res = await apiClient.put<ApiResponse<Category>>(`/categories/${id}`, request);
    return res.data.data;
  },

  reorder: async (ids: number[]): Promise<void> => {
    await apiClient.put('/categories/reorder', { ids });
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/categories/${id}`);
  },
};
