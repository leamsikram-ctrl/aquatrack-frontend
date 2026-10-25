import { apiClient } from './client';

export const notificationsApi = {
  list: async (params?: { page?: number; per_page?: number }) => {
    const res = await apiClient.get<{
      data: Array<{
        id: number;
        user_id: number;
        title: string;
        message: string;
        related_type: string | null;
        related_id: number | null;
        read_at: string | null;
        created_at: string;
      }>;
      unread_count: number;
      pagination: {
        current_page: number;
        per_page: number;
        total: number;
        last_page: number;
      };
    }>('/notifications', { params });
    return res.data;
  },

  markAsRead: async (id: number | string) => {
    const res = await apiClient.post<{ message: string }>(`/notifications/${id}/read`);
    return res.data;
  },

  markAllAsRead: async () => {
    const res = await apiClient.post<{ message: string; updated_count: number }>('/notifications/read-all');
    return res.data;
  },

  delete: async (id: number | string) => {
    const res = await apiClient.delete<{ message: string }>(`/notifications/${id}`);
    return res.data;
  },
};

