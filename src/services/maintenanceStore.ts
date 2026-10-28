import type { IssueType, RequestStatus, ServiceRequest, Urgency, User } from '../types';
import { advisoriesStore, formatTimestampNow } from './advisoriesStore';
import { pushRoleNotification } from './accountsStore';

export const FIXED_ISSUE_TYPES: IssueType[] = [
  { id: 1, name: 'No water supply', default_urgency: 'high' },
  { id: 2, name: 'Pipe leak or burst', default_urgency: 'high' },
  { id: 3, name: 'Water quality problem', default_urgency: 'high' },
  { id: 4, name: 'Low water pressure', default_urgency: 'medium' },
  { id: 5, name: 'Meter problem', default_urgency: 'medium' },
  { id: 6, name: 'Other concern', default_urgency: 'low' },
];

export const DEFAULT_ACTIVE_STAFF: User[] = [
  {
    id: 201,
    role: 'staff',
    status: 'active',
    name: 'Pedro Cruz',
    mobile_number: '09170000002',
    email: 'staff@siwass.gov',
    is_verified: true,
    must_change_password: false,
    staff_profile: {
      id: 1,
      user_id: 201,
      first_name: 'Pedro',
      last_name: 'Cruz',
      name: 'Pedro Cruz',
      assigned_barangay_id: 1,
      assigned_barangay: { id: 1, name: 'Poblacion' },
    },
  },
];

/**
 * Section 8 Step 5a (Customers layer):
 * Each Active customer appears as a home icon at the home location that the customer marked at registration.
 * Pending, Declined, and Inactive (suspended) customers do not appear.
 */
export function isCustomerActiveForGisMap(user: User): boolean {
  return user.role === 'customer' && user.status === 'active' && user.is_verified !== false;
}

export const DEFAULT_GIS_CUSTOMERS: User[] = [
  {
    id: 301,
    role: 'customer',
    status: 'active',
    is_verified: true,
    name: 'Maria Santos',
    mobile_number: '09171234561',
    email: 'maria.santos@example.com',
    must_change_password: false,
    customer_profile: {
      id: 1,
      user_id: 301,
      account_number: 'ACC-2026-0001',
      first_name: 'Maria',
      last_name: 'Santos',
      barangay_id: 10,
      barangay: { id: 10, name: 'Poblacion' },
      address: 'Purok 2, Near Public Market',
      latitude: 8.2861,
      longitude: 123.8434,
      meter: {
        id: 1,
        meter_number: 'MTR-88912',
        qr_token: 'QR-88912',
        status: 'active',
      },
    },
  },
  {
    id: 302,
    role: 'customer',
    status: 'active',
    is_verified: true,
    name: 'Pedro Santos',
    mobile_number: '09171234562',
    email: 'pedro.santos@example.com',
    must_change_password: false,
    customer_profile: {
      id: 5,
      user_id: 302,
      account_number: 'ACC-2026-0005',
      first_name: 'Pedro',
      last_name: 'Santos',
      barangay_id: 10,
      barangay: { id: 10, name: 'Poblacion' },
      address: 'Purok 2, Near Public Market',
      // Shares home location with Maria Santos (Step 5c grouping)
      latitude: 8.2861,
      longitude: 123.8434,
      meter: {
        id: 5,
        meter_number: 'MTR-88913',
        qr_token: 'QR-88913',
        status: 'active',
      },
    },
  },
  {
    id: 303,
    role: 'customer',
    status: 'active',
    is_verified: true,
    name: 'Juan Dela Cruz',
    mobile_number: '09171234563',
    email: 'juan.delacruz@example.com',
    must_change_password: false,
    customer_profile: {
      id: 2,
      user_id: 303,
      account_number: 'ACC-2026-0002',
      first_name: 'Juan',
      last_name: 'Dela Cruz',
      barangay_id: 11,
      barangay: { id: 11, name: 'San Isidro Alto' },
      address: 'Sitio Riverside, Purok 4',
      // Home location differs from his reported pipe issue location (Step 5b)
      latitude: 8.2768,
      longitude: 123.7512,
      meter: {
        id: 2,
        meter_number: 'MTR-88915',
        qr_token: 'QR-88915',
        status: 'active',
      },
    },
  },
  {
    id: 304,
    role: 'customer',
    status: 'active',
    is_verified: true,
    name: 'Elena Ramos',
    mobile_number: '09171234564',
    email: 'elena.ramos@example.com',
    must_change_password: false,
    customer_profile: {
      id: 3,
      user_id: 304,
      account_number: 'ACC-2026-0003',
      first_name: 'Elena',
      last_name: 'Ramos',
      barangay_id: 1,
      barangay: { id: 1, name: 'Cagay-anon' },
      address: 'Purok 1, Highway Crossing',
      // Co-located with her meter request AT-2026-0103 (Step 5c grouping)
      latitude: 8.3152,
      longitude: 123.8487,
      meter: {
        id: 3,
        meter_number: 'MTR-88920',
        qr_token: 'QR-88920',
        status: 'active',
      },
    },
  },
  {
    id: 305,
    role: 'customer',
    status: 'active',
    is_verified: true,
    name: 'Roberto Tan',
    mobile_number: '09171234565',
    email: 'roberto.tan@example.com',
    must_change_password: false,
    customer_profile: {
      id: 4,
      user_id: 305,
      account_number: 'ACC-2026-0004',
      first_name: 'Roberto',
      last_name: 'Tan',
      barangay_id: 3,
      barangay: { id: 3, name: 'Colupan Alto' },
      address: 'Purok 3, Highway Junction',
      latitude: 8.2951,
      longitude: 123.8174,
      meter: {
        id: 4,
        meter_number: 'MTR-88924',
        qr_token: 'QR-88924',
        status: 'active',
      },
    },
  },
  // Pending, Declined, and Inactive (suspended) customers — excluded from GIS map (Step 5a)
  {
    id: 306,
    role: 'customer',
    status: 'pending',
    is_verified: false,
    name: 'Carlos Mendoza',
    mobile_number: '09171234566',
    must_change_password: false,
    customer_profile: {
      id: 6,
      user_id: 306,
      account_number: 'ACC-2026-0006',
      first_name: 'Carlos',
      last_name: 'Mendoza',
      barangay_id: 10,
      barangay: { id: 10, name: 'Poblacion' },
      address: 'Purok 5, Poblacion',
      latitude: 8.2845,
      longitude: 123.8421,
      meter: {
        id: 6,
        meter_number: 'MTR-88930',
        qr_token: 'QR-88930',
        status: 'unassigned',
      },
    },
  },
  {
    id: 307,
    role: 'customer',
    status: 'declined',
    is_verified: false,
    name: 'Ricardo Gomez',
    mobile_number: '09171234567',
    must_change_password: false,
    customer_profile: {
      id: 7,
      user_id: 307,
      account_number: 'ACC-2026-0007',
      first_name: 'Ricardo',
      last_name: 'Gomez',
      barangay_id: 2,
      barangay: { id: 2, name: 'Camanse' },
      address: 'Purok 1, Camanse',
      latitude: 8.3008,
      longitude: 123.8244,
      meter: {
        id: 7,
        meter_number: 'MTR-88931',
        qr_token: 'QR-88931',
        status: 'unassigned',
      },
    },
  },
  {
    id: 308,
    role: 'customer',
    status: 'suspended',
    is_verified: true,
    name: 'Lorna Villanueva',
    mobile_number: '09171234568',
    must_change_password: false,
    customer_profile: {
      id: 8,
      user_id: 308,
      account_number: 'ACC-2026-0008',
      first_name: 'Lorna',
      last_name: 'Villanueva',
      barangay_id: 15,
      barangay: { id: 15, name: 'Sinonoc' },
      address: 'Purok 3, Sinonoc',
      latitude: 8.3034,
      longitude: 123.8474,
      meter: {
        id: 8,
        meter_number: 'MTR-88932',
        qr_token: 'QR-88932',
        status: 'active',
      },
    },
  },
];

/**
 * Section 3 & Section 4.4 Rule:
 * The system sets the urgency from the issue type's default and shows it to the customer.
 * The customer may raise the urgency by one level and can never lower it.
 */
export function getAllowedCustomerUrgencies(defaultUrgency: Urgency): Urgency[] {
  if (defaultUrgency === 'low') {
    return ['low', 'medium'];
  }
  if (defaultUrgency === 'medium') {
    return ['medium', 'high'];
  }
  return ['high'];
}

export function deriveCustomerUrgency(defaultUrgency: Urgency, chosenUrgency: Urgency): Urgency {
  const rank = (u: Urgency) => (u === 'high' ? 3 : u === 'medium' ? 2 : 1);
  const fromRank = (r: number): Urgency => (r >= 3 ? 'high' : r === 2 ? 'medium' : 'low');

  const defRank = rank(defaultUrgency);
  const chosenRank = rank(chosenUrgency);
  // Cannot lower below default; cannot raise more than 1 level above default
  const finalRank = Math.min(defRank + 1, Math.max(defRank, chosenRank));
  return fromRank(finalRank);
}

export function formatTimelineDateTime(isoOrDate?: string): string {
  if (!isoOrDate) return '';
  const d = new Date(isoOrDate);
  if (isNaN(d.getTime())) return isoOrDate;
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

const REQUESTS_STORAGE_KEY = 'aquatrack_maintenance_requests_v2';

const INITIAL_REQUESTS: ServiceRequest[] = [
  {
    id: 101,
    reference: 'AT-2026-0101',
    reference_no: 'AT-2026-0101',
    customer_profile_id: 1,
    customer: {
      id: 1,
      account_number: 'ACC-2026-0001',
      full_name: 'Maria Santos',
      barangay: 'Poblacion',
      address: 'Purok 2, Near Public Market',
    },
    issue_type_id: 2,
    issue_type: FIXED_ISSUE_TYPES[1], // Pipe leak or burst (High)
    customer_urgency: 'high',
    urgency: 'high',
    status: 'assigned',
    assigned_staff_id: 201,
    assigned_staff: {
      id: 201,
      name: 'Pedro Cruz',
      mobile_number: '09170000002',
      email: 'staff@siwass.gov',
    },
    assigned_at: '2026-10-21T08:30:00',
    description: 'Burst feeder pipe near Purok 2 junction causing water loss along the street.',
    latitude: 8.2855,
    longitude: 123.8429,
    photo_path: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&auto=format&fit=crop&q=80',
    created_at: '2026-10-21T08:15:00',
    updated_at: '2026-10-21T08:30:00',
  },
  {
    id: 105,
    reference: 'AT-2026-0105',
    reference_no: 'AT-2026-0105',
    customer_profile_id: 1,
    customer: {
      id: 1,
      account_number: 'ACC-2026-0001',
      full_name: 'Maria Santos',
      barangay: 'Poblacion',
      address: 'Purok 2, Near Public Market',
    },
    issue_type_id: 1,
    issue_type: FIXED_ISSUE_TYPES[0], // No water supply (High)
    customer_urgency: 'high',
    urgency: 'high',
    status: 'resolved',
    assigned_staff_id: 201,
    assigned_staff: {
      id: 201,
      name: 'Pedro Cruz',
      mobile_number: '09170000002',
      email: 'staff@siwass.gov',
    },
    assigned_at: '2026-10-18T09:00:00',
    assignment_notes: 'Check airlock on Purok 2 branch line.',
    started_at: '2026-10-18T10:15:00',
    resolved_at: '2026-10-18T14:30:00',
    resolution_remarks: 'Flushed airlock and replaced 1-inch gate valve; normal flow restored.',
    evidence_photo_path: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&auto=format&fit=crop&q=80',
    description: 'Complete loss of water supply since early morning.',
    latitude: 8.2848,
    longitude: 123.8415,
    created_at: '2026-10-18T08:10:00',
    updated_at: '2026-10-18T14:30:00',
  },
];

export const maintenanceStore = {
  getRequests(): ServiceRequest[] {
    try {
      const raw = localStorage.getItem(REQUESTS_STORAGE_KEY);
      if (!raw) {
        localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(INITIAL_REQUESTS));
        return INITIAL_REQUESTS;
      }
      const parsed = JSON.parse(raw) as ServiceRequest[];
      if (Array.isArray(parsed)) {
        return parsed;
      }
      return [];
    } catch {
      return [];
    }
  },

  saveRequests(requests: ServiceRequest[]): void {
    try {
      localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(requests));
    } catch {
      // Ignore quota errors
    }
  },

  /**
   * Section 4: Customer Submits a Request
   */
  createRequest(input: {
    issueTypeId: number;
    customerUrgency: Urgency;
    description: string;
    latitude: number;
    longitude: number;
    barangay: string;
    customerName?: string;
    accountNumber?: string;
    address?: string;
    photoPath?: string;
  }): ServiceRequest {
    const all = this.getRequests();
    const issueType =
      FIXED_ISSUE_TYPES.find((t) => t.id === input.issueTypeId) || FIXED_ISSUE_TYPES[0];
    const finalUrgency = deriveCustomerUrgency(issueType.default_urgency, input.customerUrgency);
    const nextId = all.reduce((max, r) => Math.max(max, r.id), 100) + 1;
    const refNo = `AT-2026-${String(nextId).padStart(4, '0')}`;
    const nowIso = new Date().toISOString();

    const newReq: ServiceRequest = {
      id: nextId,
      reference: refNo,
      reference_no: refNo,
      customer_profile_id: 1,
      customer: {
        id: 1,
        account_number: input.accountNumber || 'ACC-2026-0001',
        full_name: input.customerName || 'Maria Santos',
        barangay: input.barangay || 'Poblacion',
        address: input.address || 'Purok 2, Sinacaban',
      },
      issue_type_id: issueType.id,
      issue_type: issueType,
      customer_urgency: finalUrgency,
      urgency: finalUrgency,
      status: 'submitted',
      assigned_staff_id: null,
      assigned_staff: null,
      description: input.description,
      latitude: input.latitude,
      longitude: input.longitude,
      photo_path: input.photoPath,
      created_at: nowIso,
      updated_at: nowIso,
    };

    const updated = [newReq, ...all];
    this.saveRequests(updated);

    // Section 9 & 10: Log status change in Activity Log & notify admin (in-app)
    advisoriesStore.appendAuditLog(
      `[${refNo}] Request Submitted (${issueType.name}, Urgency: ${finalUrgency.toUpperCase()}) in Brgy. ${newReq.customer?.barangay} at ${formatTimestampNow()} · Admin notified (in-app)`
    );

    pushRoleNotification(
      'admin',
      `New service request ${refNo} (${issueType.name}) submitted in Barangay ${newReq.customer?.barangay || 'Sinacaban'}.`,
      'request',
      '/admin/maintenance'
    );

    return newReq;
  },

  /**
   * Section 5.3: Admin adjusts urgency after reviewing the request
   */
  adjustUrgency(requestId: number, newUrgency: Urgency, reason?: string): ServiceRequest | null {
    const all = this.getRequests();
    const target = all.find((r) => r.id === requestId);
    if (!target) return null;

    const updatedReq: ServiceRequest = {
      ...target,
      urgency: newUrgency,
      urgency_adjustment_reason: reason,
      updated_at: new Date().toISOString(),
    };

    this.saveRequests(all.map((r) => (r.id === requestId ? updatedReq : r)));
    advisoriesStore.appendAuditLog(
      `[${target.reference}] Admin adjusted urgency to ${newUrgency.toUpperCase()}${
        reason ? ` (${reason})` : ''
      } at ${formatTimestampNow()}`
    );
    return updatedReq;
  },

  /**
   * Section 5.4 - 5.6 & Section 10:
   * Admin assigns or reassigns an Active staff member and adds assignment notes.
   * Status becomes Assigned. Notifies staff and customer (in-app and SMS).
   * If reassigned, notifies old staff, new staff, and customer (in-app).
   */
  assignStaff(
    requestId: number,
    staff: User,
    notes?: string
  ): { request: ServiceRequest; isReassigned: boolean } {
    if (staff.status && staff.status !== 'active') {
      throw new Error('Only an Active staff member can be assigned.');
    }

    const all = this.getRequests();
    const target = all.find((r) => r.id === requestId);
    if (!target) {
      throw new Error('Maintenance request not found.');
    }
    if (target.status === 'resolved' || target.status === 'cancelled') {
      throw new Error('Resolved or Cancelled requests cannot be assigned or reopened.');
    }

    const isReassigned = Boolean(target.assigned_staff_id && target.assigned_staff_id !== staff.id);
    const oldStaffName = target.assigned_staff?.name;
    const nowIso = new Date().toISOString();

    const updatedReq: ServiceRequest = {
      ...target,
      status: target.status === 'in_progress' ? 'in_progress' : 'assigned',
      assigned_staff_id: staff.id,
      assigned_staff: {
        id: staff.id,
        name:
          staff.name ||
          `${staff.staff_profile?.first_name || ''} ${staff.staff_profile?.last_name || ''}`.trim() ||
          'Field Technician',
        mobile_number: staff.mobile_number || '',
        email: staff.email,
      },
      assigned_at: nowIso,
      assignment_notes: notes || target.assignment_notes,
      updated_at: nowIso,
    };

    this.saveRequests(all.map((r) => (r.id === requestId ? updatedReq : r)));

    if (isReassigned) {
      advisoriesStore.appendAuditLog(
        `[${target.reference}] Reassigned from ${oldStaffName} to ${updatedReq.assigned_staff?.name} at ${formatTimestampNow()} · Old staff, new staff, and customer notified (in-app)`
      );
    } else {
      advisoriesStore.appendAuditLog(
        `[${target.reference}] Status -> Assigned to ${updatedReq.assigned_staff?.name} at ${formatTimestampNow()} · Staff and customer notified (in-app & SMS)`
      );
    }

    if (staff.id) {
      pushRoleNotification(
        'staff',
        `New work order ${target.reference} assigned to you in Barangay ${target.customer?.barangay || 'Sinacaban'}.`,
        'request',
        '/staff/tasks',
        staff.id
      );
    }
    const customerUserId = (target.customer as any)?.user_id || target.customer_profile?.user_id;
    if (customerUserId) {
      pushRoleNotification(
        'customer',
        `Your request ${target.reference} is now Assigned to Technician ${updatedReq.assigned_staff?.name}.`,
        'request',
        '/customer/requests',
        customerUserId
      );
    }

    return { request: updatedReq, isReassigned };
  },

  /**
   * Section 5.6: Admin unassigns request (back to Submitted)
   * Section 9: Reassigned or unassigned: old and new staff, and the customer (in-app).
   */
  unassignStaff(requestId: number): ServiceRequest | null {
    const all = this.getRequests();
    const target = all.find((r) => r.id === requestId);
    if (!target) {
      return null;
    }
    if (target.status === 'resolved' || target.status === 'cancelled') {
      throw new Error('Resolved or Cancelled requests cannot be modified.');
    }

    const oldStaffName = target.assigned_staff?.name || 'Technician';
    const nowIso = new Date().toISOString();

    const updatedReq: ServiceRequest = {
      ...target,
      status: 'submitted',
      assigned_staff_id: null,
      assigned_staff: null,
      assigned_at: undefined,
      started_at: undefined,
      updated_at: nowIso,
    };

    this.saveRequests(all.map((r) => (r.id === requestId ? updatedReq : r)));

    advisoriesStore.appendAuditLog(
      `[${target.reference}] Status -> Submitted (Unassigned from ${oldStaffName}) at ${formatTimestampNow()} · Staff and customer notified (in-app)`
    );

    return updatedReq;
  },

  /**
   * Section 6.2 & Section 10:
   * Staff selects Get Started. Status must be Assigned -> becomes In progress (cannot skip).
   * Customer is notified (in-app).
   */
  startWork(requestId: number): ServiceRequest {
    const all = this.getRequests();
    const target = all.find((r) => r.id === requestId);
    if (!target) {
      throw new Error('Maintenance request not found.');
    }
    if (target.status !== 'assigned') {
      throw new Error('Statuses follow Submitted -> Assigned -> In progress -> Resolved. Request must be Assigned before starting.');
    }

    const nowIso = new Date().toISOString();
    const updatedReq: ServiceRequest = {
      ...target,
      status: 'in_progress',
      started_at: nowIso,
      updated_at: nowIso,
    };

    this.saveRequests(all.map((r) => (r.id === requestId ? updatedReq : r)));

    advisoriesStore.appendAuditLog(
      `[${target.reference}] Status -> In progress at ${formatTimestampNow()} · Customer notified (in-app)`
    );

    const startCustUserId = (target.customer as any)?.user_id || target.customer_profile?.user_id;
    if (startCustUserId) {
      pushRoleNotification(
        'customer',
        `Technician ${target.assigned_staff?.name || 'Staff'} has started work on your request ${target.reference}.`,
        'request',
        '/customer/requests',
        startCustUserId
      );
    }

    return updatedReq;
  },

  /**
   * Section 6.3 - 6.5 & Section 10:
   * Staff selects Resolve, enters remarks, and uploads evidence photos.
   * Status must be In progress -> becomes Resolved (cannot skip).
   * Customer is notified (in-app and SMS), and admin by in-app notification.
   */
  resolveRequest(
    requestId: number,
    remarks: string,
    evidencePhotoPath?: string
  ): ServiceRequest {
    const all = this.getRequests();
    const target = all.find((r) => r.id === requestId);
    if (!target) {
      throw new Error('Maintenance request not found.');
    }
    if (target.status !== 'in_progress') {
      throw new Error('Statuses follow Submitted -> Assigned -> In progress -> Resolved. Request must be In progress before resolving.');
    }
    if (!remarks.trim()) {
      throw new Error('Resolution remarks are required.');
    }

    const nowIso = new Date().toISOString();
    const updatedReq: ServiceRequest = {
      ...target,
      status: 'resolved',
      resolved_at: nowIso,
      resolution_remarks: remarks.trim(),
      evidence_photo_path: evidencePhotoPath || target.evidence_photo_path,
      updated_at: nowIso,
    };

    this.saveRequests(all.map((r) => (r.id === requestId ? updatedReq : r)));

    advisoriesStore.appendAuditLog(
      `[${target.reference}] Status -> Resolved at ${formatTimestampNow()} ("${remarks.trim()}") · Customer (in-app & SMS) and Admin (in-app) notified`
    );

    const resolveCustUserId = (target.customer as any)?.user_id || target.customer_profile?.user_id;
    if (resolveCustUserId) {
      pushRoleNotification(
        'customer',
        `Your request ${target.reference} has been resolved: ${remarks.trim()}`,
        'request',
        '/customer/requests',
        resolveCustUserId
      );
    }
    pushRoleNotification(
      'admin',
      `Service request ${target.reference} resolved by ${target.assigned_staff?.name || 'Staff'}.`,
      'request',
      '/admin/maintenance'
    );

    return updatedReq;
  },

  /**
   * Section 5.6, Section 7.2 - 7.3, Section 9:
   * Customer can cancel ONLY while Submitted or Assigned (once In progress, customer cancellation is not allowed).
   * Admin can cancel while Submitted, Assigned, or In progress.
   * Resolved requests cannot be cancelled or reopened.
   */
  cancelRequest(
    requestId: number,
    actorRole: 'customer' | 'admin',
    reason?: string
  ): ServiceRequest {
    const all = this.getRequests();
    const target = all.find((r) => r.id === requestId);
    if (!target) {
      throw new Error('Maintenance request not found.');
    }
    if (target.status === 'resolved') {
      throw new Error('A Resolved request cannot be reopened or cancelled.');
    }
    if (actorRole === 'customer' && target.status !== 'submitted' && target.status !== 'assigned') {
      throw new Error('Customer can cancel only while the request is Submitted or Assigned.');
    }

    const nowIso = new Date().toISOString();
    const updatedReq: ServiceRequest = {
      ...target,
      status: 'cancelled',
      cancelled_at: nowIso,
      cancellation_reason: reason?.trim() || `Cancelled by ${actorRole}`,
      updated_at: nowIso,
    };

    this.saveRequests(all.map((r) => (r.id === requestId ? updatedReq : r)));

    const notifyNote =
      actorRole === 'customer'
        ? 'Admin and assigned staff notified (in-app)'
        : 'Customer and assigned staff notified (in-app)';

    advisoriesStore.appendAuditLog(
      `[${target.reference}] Status -> Cancelled by ${actorRole} at ${formatTimestampNow()} · ${notifyNote}`
    );

    pushRoleNotification(
      'admin',
      `Service request ${target.reference} was cancelled by ${actorRole}.`,
      'cancellation',
      '/admin/maintenance'
    );
    if (target.assigned_staff_id) {
      pushRoleNotification(
        'staff',
        `${target.reference} was cancelled by ${actorRole}.`,
        'cancellation',
        '/staff/tasks',
        target.assigned_staff_id
      );
    }

    return updatedReq;
  },

  /**
   * Section 10 Rule 2:
   * A staff member with open tasks (Assigned or In progress) cannot be deactivated until the tasks are reassigned.
   */
  getOpenTasksCountForStaff(staffId: number, externalRequests?: ServiceRequest[]): number {
    const list = externalRequests && externalRequests.length > 0 ? externalRequests : this.getRequests();
    return list.filter(
      (r) =>
        r.assigned_staff_id === staffId &&
        (r.status === 'assigned' || r.status === 'in_progress')
    ).length;
  },
};

export type { RequestStatus };

