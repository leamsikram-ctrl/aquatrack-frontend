export type UserRole = 'admin' | 'staff' | 'customer';
export type UserStatus = 'pending' | 'active' | 'declined' | 'suspended';
export type RequestStatus = 'submitted' | 'assigned' | 'in_progress' | 'resolved' | 'cancelled';
export type Urgency = 'low' | 'medium' | 'high';
export type PaymentStatus = 'unpaid' | 'paid' | 'overdue';

export interface User {
  id: number;
  role: UserRole;
  status: UserStatus;
  name?: string;
  mobile_number: string;
  email?: string;
  is_verified?: boolean;
  must_change_password: boolean;
  customer_profile?: CustomerProfile;
  staff_profile?: StaffProfile;
}

export interface Barangay {
  id: number;
  name: string;
}

export interface CustomerProfile {
  id: number;
  user_id: number;
  account_number?: string;
  first_name: string;
  last_name: string;
  mobile_number?: string;
  barangay_id: number;
  barangay?: Barangay;
  address: string;
  latitude?: number;
  longitude?: number;
  meter?: Meter;
}

export interface StaffProfile {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  name?: string;
  assigned_barangay_id?: number;
  assigned_barangay?: Barangay;
}

export interface Meter {
  id: number;
  meter_number: string;
  qr_token: string;
  status: 'unassigned' | 'active' | 'assigned' | 'faulty' | 'decommissioned';
  location_notes?: string;
}

export interface IssueType {
  id: number;
  name: string;
  description?: string;
  default_urgency: Urgency;
}

export interface ServiceRequest {
  id: number;
  reference_no?: string;
  reference: string; // e.g. AT-0001
  reference_number?: string;
  customer_profile_id: number;
  customer_profile?: CustomerProfile;
  barangay?: Barangay;
  customer?: {
    id: number;
    account_number?: string;
    full_name: string;
    barangay?: string;
    address?: string;
  };
  issue_type_id: number;
  issue_type?: IssueType;
  customer_urgency: Urgency;
  urgency: Urgency;
  urgency_adjustment_reason?: string;
  status: RequestStatus;
  assigned_staff_id?: number;
  assigned_staff?: {
    id: number;
    email?: string;
    mobile_number: string;
    name: string;
  };
  assigned_at?: string;
  assignment_notes?: string;
  started_at?: string;
  resolved_at?: string;
  resolution_remarks?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  description: string;
  latitude?: number;
  longitude?: number;
  photo_path?: string;
  evidence_photo_path?: string;
  created_at: string;
  updated_at: string;
}

export interface Billing {
  id: number;
  customer_profile_id: number;
  customer_profile?: CustomerProfile;
  billing_period: string;
  amount_due: number;
  amount_paid: number;
  due_date: string;
  payment_status: PaymentStatus;
  is_published: boolean;
  published_at?: string;
}

export interface WaterInterruption {
  id: number;
  title?: string;
  description?: string;
  message?: string;
  starts_at: string;
  ends_at: string;
  is_published?: boolean;
  status?: 'scheduled' | 'ongoing' | 'ended' | 'cancelled';
  barangays?: Barangay[];
}

