import apiClient from './apiClient';
import type { Task, TaskCreateRequest, TaskUpdateRequest } from '../types/task';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string | null;
}

export const taskApi = {
  getByMonth: async (year: number, month: number): Promise<Task[]> => {
    const res = await apiClient.get<ApiResponse<Task[]>>('/tasks', { params: { year, month } });
    return res.data.data;
  },

  create: async (request: TaskCreateRequest): Promise<Task> => {
    const res = await apiClient.post<ApiResponse<Task>>('/tasks', request);
    return res.data.data;
  },

  update: async (id: number, request: TaskUpdateRequest): Promise<Task> => {
    const res = await apiClient.put<ApiResponse<Task>>(`/tasks/${id}`, request);
    return res.data.data;
  },

  toggleComplete: async (id: number): Promise<Task> => {
    const res = await apiClient.patch<ApiResponse<Task>>(`/tasks/${id}/complete`);
    return res.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/tasks/${id}`);
  },

  reorder: async (ids: number[]): Promise<void> => {
    await apiClient.put('/tasks/reorder', { ids });
  },

  getSubCategories: async (): Promise<string[]> => {
    const res = await apiClient.get<ApiResponse<string[]>>('/tasks/sub-categories');
    return res.data.data;
  },

  deleteSubCategory: async (name: string): Promise<void> => {
    await apiClient.delete(`/tasks/sub-categories/${encodeURIComponent(name)}`);
  },
};
