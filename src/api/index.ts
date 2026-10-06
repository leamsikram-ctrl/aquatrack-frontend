import { apiClient } from './client';
import type { ServiceRequest, Billing, WaterInterruption, User } from '../types';

export const authApi = {
  login: async (credentials: { login: string; password: string; device_name?: string }) => {
    const res = await apiClient.post<{ token: string; user: User }>('/auth/login', credentials);
    return res.data;
  },

  register: async (payload: Record<string, unknown>) => {
    const res = await apiClient.post<{ message: string; status: string; user: User }>('/auth/register', payload);
    return res.data;
  },

  me: async () => {
    const res = await apiClient.get<{ user: User }>('/auth/me');
    return res.data.user;
  },

  logout: async () => {
    const res = await apiClient.post('/auth/logout');
    return res.data;
  },
};

export const requestsApi = {
  list: async (params?: { status?: string; page?: number; per_page?: number }) => {
    const res = await apiClient.get<{ data: ServiceRequest[]; pagination: { total: number } }>('/requests', { params });
    return res.data;
  },

  get: async (id: number) => {
    const res = await apiClient.get<{ data: ServiceRequest }>(`/requests/${id}`);
    return res.data.data;
  },

  create: async (data: { issue_type_id: number; customer_urgency: string; description: string; latitude?: number; longitude?: number }) => {
    const res = await apiClient.post<{ message: string; data: ServiceRequest }>('/requests', data);
    return res.data.data;
  },

  assign: async (id: number, staffUserId: number, notes?: string) => {
    const res = await apiClient.post<{ message: string; data: ServiceRequest }>(`/requests/${id}/assign`, {
      staff_user_id: staffUserId,
      assignment_notes: notes,
    });
    return res.data.data;
  },

  start: async (id: number) => {
    const res = await apiClient.post<{ message: string; data: ServiceRequest }>(`/requests/${id}/start`);
    return res.data.data;
  },

  resolve: async (id: number, remarks: string, evidencePhotoPath?: string) => {
    const res = await apiClient.post<{ message: string; data: ServiceRequest }>(`/requests/${id}/resolve`, {
      resolution_remarks: remarks,
      evidence_photo_path: evidencePhotoPath,
    });
    return res.data.data;
  },

  cancel: async (id: number, reason?: string) => {
    const res = await apiClient.post<{ message: string; data: ServiceRequest }>(`/requests/${id}/cancel`, {
      cancellation_reason: reason,
    });
    return res.data.data;
  },
};

export const billingApi = {
  list: async (params?: { billing_period?: string; payment_status?: string }) => {
    const res = await apiClient.get<{ data: Billing[]; pagination: { total: number } }>('/billing', { params });
    return res.data;
  },

  publish: async (billingIds: number[]) => {
    const res = await apiClient.post<{ message: string; published_count: number }>('/billing/publish', {
      billing_ids: billingIds,
    });
    return res.data;
  },
};

export const interruptionsApi = {
  list: async () => {
    const res = await apiClient.get<{ data: WaterInterruption[]; pagination: { total: number } }>('/interruptions');
    return res.data;
  },
};

export const adminApi = {
  pendingRegistrations: async () => {
    const res = await apiClient.get<{ data: User[]; pagination: { total: number } }>('/admin/pending-registrations');
    return res.data;
  },

  verifyRegistration: async (userId: number, meterId: number) => {
    const res = await apiClient.post<{ message: string; user: User }>(`/admin/registrations/${userId}/verify`, {
      meter_id: meterId,
    });
    return res.data;
  },
};
