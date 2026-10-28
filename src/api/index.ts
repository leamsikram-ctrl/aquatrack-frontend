import { apiClient } from './client';
import type { ServiceRequest, Billing, WaterInterruption, User, Barangay, Meter, IssueType, Urgency } from '../types';

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

  changePassword: async (payload: {
    current_password: string;
    password: string;
    password_confirmation: string;
  }) => {
    const res = await apiClient.post<{ message: string; user: User }>('/auth/change-password', payload);
    return res.data;
  },

  requestPasswordReset: async (payload: { identifier: string; method: 'sms' | 'email' }) => {
    const res = await apiClient.post<{ message: string; debug_token_or_pin?: string | null }>(
      '/auth/forgot-password/request',
      payload
    );
    return res.data;
  },

  completePasswordReset: async (payload: {
    identifier: string;
    method: 'sms' | 'email';
    token_or_pin: string;
    password: string;
    password_confirmation: string;
  }) => {
    const res = await apiClient.post<{ message: string }>('/auth/forgot-password/reset', payload);
    return res.data;
  },

  acceptTerms: async (payload?: { terms_version?: string; privacy_version?: string }) => {
    const res = await apiClient.post<{ message: string; user: User }>('/auth/accept-terms', payload || {});
    return res.data;
  },
};

export const profileApi = {
  updateProfile: async (payload: {
    address?: string;
    latitude?: number | string;
    longitude?: number | string;
    name?: string;
  }) => {
    const res = await apiClient.put<{ message: string; user: User }>('/profile', payload);
    return res.data;
  },

  uploadPhoto: async (payload: { photo_data?: string }) => {
    const res = await apiClient.post<{ message: string; user: User }>('/profile/photo', payload);
    return res.data;
  },

  removePhoto: async () => {
    const res = await apiClient.delete<{ message: string; user: User }>('/profile/photo');
    return res.data;
  },

  requestMobilePin: async (payload: { mobile_number: string }) => {
    const res = await apiClient.post<{
      message: string;
      debug_pin?: string | null;
      expires_in_minutes: number;
    }>('/profile/mobile/request-pin', payload);
    return res.data;
  },

  verifyMobilePin: async (payload: { pin: string }) => {
    const res = await apiClient.post<{ message: string; user: User }>('/profile/mobile/verify-pin', payload);
    return res.data;
  },

  requestEmailLink: async (payload: { email: string }) => {
    const res = await apiClient.post<{
      message: string;
      link_url?: string;
      debug_token?: string | null;
      expires_in_minutes: number;
    }>('/profile/email/request-link', payload);
    return res.data;
  },

  verifyEmailLink: async (payload: { token: string }) => {
    const res = await apiClient.post<{ message: string; user: User }>('/profile/email/verify-link', payload);
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

  unassign: async (id: number) => {
    const res = await apiClient.post<{ message: string; data: ServiceRequest }>(`/requests/${id}/unassign`);
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

  adjustUrgency: async (id: number, urgency: Urgency, reason?: string) => {
    const res = await apiClient.post<{ message: string; data: ServiceRequest }>(`/requests/${id}/urgency`, {
      urgency,
      urgency_adjustment_reason: reason,
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
  dashboard: async () => {
    const res = await apiClient.get<{
      summary: {
        total_requests: number;
        resolved_requests: number;
        active_requests: number;
        unassigned_requests: number;
        overall_resolution_rate: number;
        total_users: number;
        users_by_role: {
          consumers: number;
          staff: number;
          admins: number;
        };
        users_by_status: {
          active: number;
          pending: number;
          declined: number;
        };
        total_consumers: number;
        active_consumers: number;
        pending_verifications: number;
        active_advisories: number;
        total_advisories: number;
        ongoing_advisories?: number;
        total_billed_amount: number;
        payments_this_month?: number;
        customers_with_balance?: number;
        open_billing_period?: string | null;
        unpaid_bills_count: number;
        paid_bills_count: number;
        unpublished_bills_count?: number;
        overdue_bills_count?: number;
        collection_rate: number;
        coverage_rate: number;
        active_meter_rate: number;
      };
      monthly_trends: Array<{
        month: string;
        year_month: string;
        logged: number;
        resolved: number;
        rate: number;
        collected?: number;
        billed?: number;
      }>;
      categories: Array<{
        category: string;
        count: number;
        resolved: number;
        percentage: number;
      }>;
      barangay_coverage: Array<{
        id: number;
        name: string;
        connections: number;
        open_requests: number;
        status: 'Normal' | 'Advisory';
      }>;
      recent_requests: ServiceRequest[];
      upcoming_interruptions: WaterInterruption[];
    }>('/admin/dashboard');
    return res.data;
  },

  pendingRegistrations: async () => {
    const res = await apiClient.get<{ data: User[]; pagination: { total: number } }>('/admin/pending-registrations');
    return res.data;
  },

  availableMeters: async (params?: { barangay_id?: number }) => {
    const res = await apiClient.get<{ data: Meter[] }>('/admin/available-meters', { params });
    return res.data.data;
  },

  verifyRegistration: async (userId: number, options?: { meter_id?: number; meter_number?: string } | number) => {
    const payload = typeof options === 'number' ? { meter_id: options } : (options || {});
    const res = await apiClient.post<{ message: string; user: User }>(`/admin/registrations/${userId}/verify`, payload);
    return res.data;
  },

  declineRegistration: async (userId: number, reason: string) => {
    const res = await apiClient.post<{ message: string }>(`/admin/registrations/${userId}/decline`, {
      reason,
      remarks: reason,
    });
    return res.data;
  },

  staffList: async () => {
    const res = await apiClient.get<{ data: User[] }>('/admin/staff');
    return res.data.data;
  },

  createStaff: async (payload: {
    name: string;
    email: string;
    mobile_number: string;
    assigned_barangay_id?: number;
    temporary_password?: string;
  }) => {
    const res = await apiClient.post<{ message: string; temporary_password: string; user: User }>('/admin/staff', payload);
    return res.data;
  },

  createCustomer: async (payload: {
    name: string;
    email?: string;
    mobile_number: string;
    meter_number: string;
    barangay_id: number;
    address: string;
    temporary_password?: string;
  }) => {
    const res = await apiClient.post<{ message: string; temporary_password: string; user: User }>('/admin/customers', payload);
    return res.data;
  },

  updateStaff: async (
    id: number,
    payload: { name?: string; email?: string; mobile_number?: string; assigned_barangay_id?: number | null }
  ) => {
    const res = await apiClient.put<{ message: string; user: User }>(`/admin/staff/${id}`, payload);
    return res.data;
  },

  updateUser: async (
    id: number,
    payload: { name?: string; email?: string; mobile_number?: string; barangay_id?: number; address?: string; avatar?: string | null; is_verified?: boolean }
  ) => {
    const res = await apiClient.put<{ message: string; user: User }>(`/admin/users/${id}`, payload);
    return res.data;
  },

  deleteUser: async (id: number) => {
    const res = await apiClient.delete<{ message: string }>(`/admin/users/${id}`);
    return res.data;
  },

  deactivateUser: async (id: number) => {
    const res = await apiClient.post<{ message: string; user: User }>(`/admin/users/${id}/deactivate`);
    return res.data;
  },

  reactivateUser: async (id: number) => {
    const res = await apiClient.post<{ message: string; user: User }>(`/admin/users/${id}/reactivate`);
    return res.data;
  },

  issueTemporaryPassword: async (id: number, temporaryPassword?: string) => {
    const res = await apiClient.post<{ message: string; temporary_password: string; user: User }>(
      `/admin/users/${id}/temporary-password`,
      { temporary_password: temporaryPassword }
    );
    return res.data;
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

  activityLogs: async (params?: {
    action?: string;
    category?: string;
    role?: string;
    user_id?: number;
    search?: string;
    from?: string;
    to?: string;
    page?: number;
    per_page?: number;
  }) => {
    const res = await apiClient.get<{
      data: Array<{
        id: number;
        user_id: number | null;
        user_name?: string | null;
        user_role?: string | null;
        category?: string;
        action: string;
        target?: string | null;
        detail?: string | null;
        subject_type: string | null;
        subject_id: number | null;
        old_values: Record<string, any> | null;
        new_values: Record<string, any> | null;
        ip_address: string | null;
        created_at: string;
        user?: {
          id: number;
          name?: string;
          email?: string;
          role?: string;
        } | null;
      }>;
      pagination: {
        current_page: number;
        per_page: number;
        total: number;
        last_page: number;
      };
    }>('/admin/activity-logs', { params });
    return res.data;
  },

  logActivityExport: async (data: {
    count: number;
    from?: string;
    to?: string;
    filters?: Record<string, any>;
  }) => {
    const res = await apiClient.post<{ message: string }>('/admin/activity-logs/log-export', data);
    return res.data;
  },
};

export * from './notifications';

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

  offlineSync: async () => {
    const res = await apiClient.get<{
      synced_at: string;
      total_meters: number;
      data: Array<{
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
      }>;
    }>('/meters/offline');
    return res.data;
  },
};

export const billingApi = {
  list: async (params?: { billing_period_id?: string | number; billing_period?: string; payment_status?: string; search?: string; balance_filter?: string; per_page?: number; page?: number }) => {
    const res = await apiClient.get<{ data: Billing[]; pagination: { total: number; current_page: number; per_page: number; last_page: number } }>('/billing', { params });
    return res.data;
  },

  periods: async () => {
    const res = await apiClient.get<{ data: any[] }>('/billing/periods');
    return res.data;
  },

  createPeriod: async (payload: { month: number; year: number; due_date: string }) => {
    const res = await apiClient.post<{ message: string; data: any }>('/billing/periods', payload);
    return res.data;
  },

  updatePeriod: async (id: number | string, payload: { due_date: string; month?: number; year?: number }) => {
    const res = await apiClient.put<{ message: string; data: any }>(`/billing/periods/${id}`, payload);
    return res.data;
  },

  closePeriod: async (id: number | string) => {
    const res = await apiClient.post<{ message: string; data: any }>(`/billing/periods/${id}/close`);
    return res.data;
  },

  reopenPeriod: async (id: number | string) => {
    const res = await apiClient.post<{ message: string; data: any }>(`/billing/periods/${id}/reopen`);
    return res.data;
  },

  deletePeriod: async (id: number | string) => {
    const res = await apiClient.delete<{ message: string }>(`/billing/periods/${id}`);
    return res.data;
  },

  previewCsv: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post<{
      message: string;
      data: {
        valid_rows: any[];
        invalid_rows: Array<{ row_number: number; meter_number: string; reason: string }>;
        open_period: any;
      };
    }>('/billing/preview', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  importCsv: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post<{
      message: string;
      data: {
        created_count: number;
        rejected_count: number;
        notices_sent: number;
        errors: string[];
        invalid_rows: Array<{ row_number: number; meter_number: string; reason: string }>;
        period: any;
      };
    }>('/billing/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  payments: async (params?: { billing_id?: number | string; customer_profile_id?: number; per_page?: number }) => {
    const res = await apiClient.get<{ data: any[]; pagination: { total: number } }>('/billing/payments', { params });
    return res.data;
  },

  recordPayment: async (
    billingId: number | string,
    payload: { amount: number; payment_date?: string; or_number?: string; remark?: string }
  ) => {
    const res = await apiClient.post<{ message: string; data: any }>(`/billing/records/${billingId}/pay`, payload);
    return res.data;
  },

  reversePayment: async (paymentId: number | string) => {
    const res = await apiClient.post<{ message: string; data: any }>(`/billing/payments/${paymentId}/reverse`);
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
  list: async (params?: { per_page?: number; barangay_id?: number; status?: string }) => {
    const res = await apiClient.get<{ data: WaterInterruption[]; pagination: { total: number } }>('/interruptions', { params });
    return res.data;
  },

  preview: async (data: { barangay_ids: number[] }) => {
    const res = await apiClient.post<{
      total_affected: number;
      sms_count: number;
      in_app_only_count: number;
    }>('/interruptions/preview', data);
    return res.data;
  },

  create: async (data: {
    title: string;
    reason: string;
    advisory_type?: string;
    remarks?: string;
    starts_at: string;
    ends_at: string;
    barangay_ids: number[];
    message?: string;
    publish_immediately?: boolean;
  }) => {
    const res = await apiClient.post<{ message: string; data: WaterInterruption }>('/interruptions', data);
    return res.data;
  },

  update: async (
    id: number,
    data: {
      title: string;
      reason: string;
      advisory_type?: string;
      remarks?: string;
      starts_at: string;
      ends_at: string;
      barangay_ids: number[];
      message?: string;
    }
  ) => {
    const res = await apiClient.put<{ message: string; data: WaterInterruption }>(`/interruptions/${id}`, data);
    return res.data;
  },

  cancel: async (id: number, data?: { reason?: string }) => {
    const res = await apiClient.post<{ message: string; data: WaterInterruption }>(`/interruptions/${id}/cancel`, data);
    return res.data;
  },

  restore: async (id: number, data?: { remark?: string }) => {
    const res = await apiClient.post<{ message: string; data: WaterInterruption }>(`/interruptions/${id}/restore`, data);
    return res.data;
  },
};

export const reportsApi = {
  getReport: async (params: {
    type?: string;
    from?: string;
    to?: string;
    barangay?: string;
  }) => {
    const res = await apiClient.get<{
      type: string;
      title: string;
      from: string;
      to: string;
      scope: string;
      count: number;
      summary: Record<string, any>;
      records?: any[];
    }>('/admin/reports', { params });
    return res.data;
  },

  logExport: async (payload: {
    report_type: string;
    from: string;
    to: string;
    barangay?: string;
    format: 'pdf' | 'csv';
  }) => {
    const res = await apiClient.post<{ message: string; entry: Record<string, any> }>(
      '/admin/reports/log',
      payload
    );
    return res.data;
  },
};
