import { apiClient } from './client';
import type { ServiceRequest, Billing, WaterInterruption, User, Barangay, Meter, IssueType } from '../types';

export interface OfficeAccountDetails {
  account_number: string;
  meter_number: string;
  first_name: string;
  last_name: string;
  full_name: string;
  barangay_id: number;
  barangay_name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
}

export interface MeterTagData {
  user_id: number;
  customer_name: string;
  account_number: string;
  meter_id: number;
  meter_number: string;
  meter_status: string;
  qr_token: string;
  barangay: string;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  verified_at: string;
  issued_by: string;
}

export const authApi = {
  login: async (credentials: { login: string; password: string; device_name?: string }) => {
    const res = await apiClient.post<{ token: string; user: User }>('/auth/login', credentials);
    return res.data;
  },

  register: async (payload: Record<string, unknown>) => {
    const res = await apiClient.post<{ message: string; status: string; user: User }>('/auth/register', payload);
    return res.data;
  },

  lookupAccount: async (payload: { account_number: string; meter_number: string }) => {
    const res = await apiClient.post<{ message: string; account: OfficeAccountDetails }>('/auth/register/lookup', payload);
    return res.data;
  },

  sendRegistrationOtp: async (payload: {
    account_number: string;
    meter_number: string;
    mobile_number: string;
    email?: string | null;
  }) => {
    const res = await apiClient.post<{ message: string; expires_in_seconds: number; debug_otp?: string | null }>(
      '/auth/register/send-otp',
      payload
    );
    return res.data;
  },

  verifyRegistrationOtp: async (payload: {
    account_number: string;
    meter_number: string;
    otp: string;
    email?: string | null;
    password: string;
    password_confirmation: string;
    latitude?: number | null;
    longitude?: number | null;
    consent_terms: boolean;
    consent_privacy: boolean;
    terms_version: string;
    privacy_version: string;
  }) => {
    const res = await apiClient.post<{ message: string; token: string; user: User }>('/auth/register/verify-otp', payload);
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

export const referenceApi = {
  getBarangays: async () => {
    const res = await apiClient.get<{ data: Barangay[] }>('/reference/barangays');
    return res.data.data;
  },

  getIssueTypes: async () => {
    const res = await apiClient.get<{ data: IssueType[] }>('/reference/issue-types');
    return res.data.data;
  },
};

export const adminApi = {
  pendingRegistrations: async () => {
    const res = await apiClient.get<{ data: User[]; pagination: { total: number } }>('/admin/pending-registrations');
    return res.data;
  },

  availableMeters: async (params?: { barangay_id?: number }) => {
    const res = await apiClient.get<{ data: Meter[] }>('/admin/available-meters', { params });
    return res.data.data;
  },

  verifyRegistration: async (userId: number, meterId: number) => {
    const res = await apiClient.post<{ message: string; user: User }>(`/admin/registrations/${userId}/verify`, {
      meter_id: meterId,
    });
    return res.data;
  },

  declineRegistration: async (userId: number, remarks: string) => {
    const res = await apiClient.post<{ message: string }>(`/admin/registrations/${userId}/decline`, {
      remarks,
    });
    return res.data;
  },

  staffList: async () => {
    const res = await apiClient.get<{ data: User[] }>('/admin/staff');
    return res.data.data;
  },

  customersList: async (params?: { status?: string; page?: number; per_page?: number }) => {
    const res = await apiClient.get<{ data: User[]; pagination: { total: number } }>('/admin/customers', { params });
    return res.data;
  },

  meterTag: async (userId: number) => {
    const res = await apiClient.get<{ tag: MeterTagData }>(`/admin/customers/${userId}/meter-tag`);
    return res.data.tag;
  },

  regenerateMeterQr: async (meterId: number) => {
    const res = await apiClient.post<{ message: string; meter: Meter }>(`/admin/meters/${meterId}/regenerate-qr`);
    return res.data;
  },
};

export const metersApi = {
  lookupByNumber: async (meterNumber: string) => {
    const res = await apiClient.get<{
      data: {
        meter_id: number;
        meter_number: string;
        qr_token: string;
        status: string;
        barangay?: string;
        customer?: {
          id: number;
          account_number?: string;
          name: string;
          address?: string;
          barangay?: string;
          mobile_number?: string;
        };
      };
    }>(`/meters/${meterNumber}`);
    return res.data.data;
  },

  lookupByQr: async (token: string) => {
    const res = await apiClient.get<{
      data: {
        meter_id: number;
        meter_number: string;
        qr_token: string;
        status: string;
        barangay?: string;
        customer?: {
          id: number;
          account_number?: string;
          name: string;
          address?: string;
          barangay?: string;
          mobile_number?: string;
        };
      };
    }>(`/meters/qr/${token}`);
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

  importCsv: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post<{
      message: string;
      batch_id: number;
      summary: { total_rows: number; created: number; updated: number; rejected: number; errors: string[] };
    }>('/billing/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
};

export const interruptionsApi = {
  list: async () => {
    const res = await apiClient.get<{ data: WaterInterruption[]; pagination: { total: number } }>('/interruptions');
    return res.data;
  },

  create: async (data: { message: string; starts_at: string; ends_at: string; barangay_ids: number[] }) => {
    const res = await apiClient.post<{ message: string; data: WaterInterruption }>('/interruptions', data);
    return res.data;
  },
};

