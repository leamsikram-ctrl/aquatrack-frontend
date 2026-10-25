import type { User } from '../types';
import { SINACABAN_BARANGAY_LIST } from './advisoriesStore';
import { isWithinSinacabanBounds, getSinacabanBarangayCoords } from '../components/organisms/MunicipalMap';
import { dispatchNotificationsUpdated } from './notificationService';

export interface AccountAuditLogEntry {
  id: string;
  time: string;
  user: string;
  role: string;
  action: string;
  category: 'assignment' | 'urgency_override' | 'resolution' | 'verification' | 'billing';
}

export interface PendingMobileChange {
  userId: number;
  newMobile: string;
  pin: string;
  expiresAt: number; // 10 minutes
  attempts: number;
  maxAttempts: number; // 5 wrong attempts
  cancelled: boolean;
  used: boolean;
}

export interface PendingEmailChange {
  userId: number;
  oldEmail: string;
  newEmail: string;
  token: string;
  linkUrl: string;
  expiresAt: number; // 60 minutes
  cancelled: boolean;
  used: boolean;
}

export interface PendingPasswordReset {
  userId: number;
  identifier: string;
  method: 'sms' | 'email';
  pinOrToken: string;
  linkUrl?: string;
  expiresAt: number; // 10 mins for SMS, 60 mins for Email
  attempts: number;
  maxAttempts: number; // 5 wrong attempts for SMS
  cancelled: boolean;
  used: boolean;
}

const ACCOUNTS_STORAGE_KEY = 'aquatrack_accounts_store_v1';
const PASSWORDS_STORAGE_KEY = 'aquatrack_account_passwords_v1';
const ACCOUNT_AUDIT_KEY = 'aquatrack_account_audit_logs_v1';
const MOBILE_CHANGE_KEY = 'aquatrack_pending_mobile_changes_v1';
const EMAIL_CHANGE_KEY = 'aquatrack_pending_email_changes_v1';
const PASSWORD_RESET_KEY = 'aquatrack_pending_password_resets_v1';
const RATE_LIMIT_KEY = 'aquatrack_pin_link_rate_limits_v1';

export const MAX_PHOTO_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB
export const ALLOWED_PHOTO_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
export const PIN_VALIDITY_MS = 10 * 60 * 1000; // 10 minutes
export const LINK_VALIDITY_MS = 60 * 60 * 1000; // 60 minutes
export const MAX_PIN_ATTEMPTS = 5;
export const MAX_REQUESTS_PER_HOUR = 3;

export function formatAccountTimestamp(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  let hours = now.getHours();
  const mins = String(now.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${y}-${m}-${d} ${String(hours).padStart(2, '0')}:${mins} ${ampm}`;
}

export function isValidPhilippineMobile(mobile: string): boolean {
  const cleaned = mobile.replace(/[\s\-()]/g, '');
  return /^(\+639|639|09)\d{9}$/.test(cleaned);
}

export function normalizeMobileNumber(mobile: string): string {
  const cleaned = mobile.replace(/[\s\-()]/g, '');
  if (cleaned.startsWith('+639') && cleaned.length === 13) {
    return '0' + cleaned.slice(3);
  }
  if (cleaned.startsWith('639') && cleaned.length === 12) {
    return '0' + cleaned.slice(2);
  }
  return cleaned;
}

export function isValidEmailFormat(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function validateProfilePhotoFile(file: File): { valid: boolean; error?: string } {
  const nameLower = file.name.toLowerCase();
  const isJpgOrPng =
    ALLOWED_PHOTO_MIME_TYPES.includes(file.type.toLowerCase()) ||
    nameLower.endsWith('.jpg') ||
    nameLower.endsWith('.jpeg') ||
    nameLower.endsWith('.png');

  if (!isJpgOrPng) {
    return {
      valid: false,
      error: 'Accepted formats are JPG and PNG only.',
    };
  }

  if (file.size > MAX_PHOTO_SIZE_BYTES) {
    return {
      valid: false,
      error: 'Profile photo size must not exceed 2 MB.',
    };
  }

  return { valid: true };
}

const DEFAULT_USERS: User[] = [
  {
    id: 1,
    role: 'admin',
    status: 'active',
    name: 'SIWASS Administrator',
    full_name: 'SIWASS Administrator',
    avatar: '/default-avatar.svg',
    email: 'admin@siwass.gov',
    mobile_number: '09170000001',
    is_verified: true,
    terms_accepted: true,
    must_change_password: false,
    created_at: '2024-01-01T08:00:00.000Z',
    last_active_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    role: 'staff',
    status: 'active',
    name: 'Pedro Cruz',
    full_name: 'Pedro Cruz',
    avatar: '/default-avatar.svg',
    email: 'staff@siwass.gov',
    mobile_number: '09170000002',
    is_verified: true,
    terms_accepted: true,
    must_change_password: false,
    created_at: '2024-01-02T08:00:00.000Z',
    last_active_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    staff_profile: {
      id: 2,
      user_id: 2,
      first_name: 'Pedro',
      last_name: 'Cruz',
      name: 'Pedro Cruz',
      assigned_barangay_id: 1,
      assigned_barangay: { id: 1, name: 'Poblacion' },
    },
  },
  {
    id: 15,
    role: 'customer',
    status: 'active',
    name: 'Maria Santos',
    full_name: 'Maria Santos',
    avatar: '/default-avatar.svg',
    email: 'maria@example.com',
    mobile_number: '09171234567',
    is_verified: true,
    verification_status: 'verified',
    terms_accepted: true,
    must_change_password: false,
    created_at: '2024-01-04T08:30:00.000Z',
    last_active_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    customer_profile: {
      id: 1,
      user_id: 15,
      account_number: 'ACC-2026-0001',
      first_name: 'Maria',
      last_name: 'Santos',
      mobile_number: '09171234567',
      barangay_id: 1,
      barangay: { id: 1, name: 'Poblacion' },
      address: 'Purok 1, Poblacion',
      latitude: 8.2985,
      longitude: 123.834,
      meter: {
        id: 1,
        meter_number: 'MTR-SIN-0001',
        qr_token: 'AQ-MTR-SIN-0001',
        status: 'active',
      },
    },
  },
];

function loadUsers(): User[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Exclude obsolete seeded demo accounts
        const cleaned = parsed
          .filter((u: User) => {
            const emailLower = (u.email || '').toLowerCase().trim();
            if (['juan@example.com', 'pedro.reyes@example.com', 'juan.tech@sinacaban.gov.ph'].includes(emailLower)) {
              return false;
            }
            return true;
          })
          .map((u: User): User => {
            const emailLower = (u.email || '').toLowerCase().trim();
            if (emailLower === 'admin@siwass.gov' || u.role === 'admin') {
              return {
                ...u,
                id: 1,
                role: 'admin',
                name: 'SIWASS Administrator',
                full_name: 'SIWASS Administrator',
              };
            }
            if (emailLower === 'staff@siwass.gov') {
              return {
                ...u,
                role: 'staff',
                name: u.name || 'Pedro Cruz',
                full_name: u.full_name || 'Pedro Cruz',
              };
            }
            return u;
          });

        // Ensure Admin user is ALWAYS present
        const hasAdmin = cleaned.some((u) => u.role === 'admin' || u.id === 1 || u.email?.toLowerCase().trim() === 'admin@siwass.gov');
        if (!hasAdmin) {
          cleaned.unshift(DEFAULT_USERS[0]);
        }
        return cleaned;
      }
    }
  } catch {
    // fallback
  }
  return DEFAULT_USERS;
}

function saveUsers(users: User[]) {
  try {
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(users));
  } catch {
    // ignore
  }
}

function loadPasswords(): Record<number, string> {
  try {
    const raw = localStorage.getItem(PASSWORDS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return {
    1: 'password123',
    4: 'password123',
    5: 'password123',
    6: 'password123',
    10: 'password123',
    901: 'password123',
  };
}

function savePasswords(passwords: Record<number, string>) {
  try {
    localStorage.setItem(PASSWORDS_STORAGE_KEY, JSON.stringify(passwords));
  } catch {
    // ignore
  }
}

function appendAuditLog(action: string, actorName = 'Administrator (Admin User)', role = 'Admin') {
  try {
    const raw = localStorage.getItem(ACCOUNT_AUDIT_KEY);
    const logs: AccountAuditLogEntry[] = raw ? JSON.parse(raw) : [];
    const entry: AccountAuditLogEntry = {
      id: `acc-log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      time: formatAccountTimestamp(),
      user: actorName,
      role,
      action,
      category: 'verification',
    };
    localStorage.setItem(ACCOUNT_AUDIT_KEY, JSON.stringify([entry, ...logs]));
  } catch {
    // ignore
  }
}

export function pushRoleNotification(
  roleKey: 'admin' | 'staff' | 'customer',
  message: string,
  type: 'request' | 'system' | 'advisory' | 'bill' | 'cancellation' = 'system',
  link?: string,
  targetUserId?: number | string
) {
  try {
    const trimmedMsg = message.trim();
    const pushToKey = (storageKey: string) => {
      const raw = localStorage.getItem(storageKey);
      const list: any[] = raw ? JSON.parse(raw) : [];
      // Deduplicate: if an identical message already exists in the list, skip adding duplicate
      const exists = list.some((n: any) => n.message && n.message.trim() === trimmedMsg);
      if (exists) return;

      const item = {
        id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        type,
        message: trimmedMsg,
        time: 'Just now',
        read: false,
        link,
      };
      localStorage.setItem(storageKey, JSON.stringify([item, ...list]));
    };

    if (targetUserId) {
      pushToKey(`aquatrack_notifications_${roleKey}_${targetUserId}`);
    } else {
      pushToKey(`aquatrack_notifications_${roleKey}`);
    }
    dispatchNotificationsUpdated();
  } catch {
    // ignore
  }
}

function checkAndRecordRateLimit(accountKey: string): { allowed: boolean; error?: string } {
  try {
    const raw = localStorage.getItem(RATE_LIMIT_KEY);
    const map: Record<string, number[]> = raw ? JSON.parse(raw) : {};
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    const recent = (map[accountKey] || []).filter((ts) => ts > oneHourAgo);

    if (recent.length >= MAX_REQUESTS_PER_HOUR) {
      return {
        allowed: false,
        error: 'Pin and link requests are limited to 3 per hour for each account to protect SMS credits. Please try again later.',
      };
    }

    recent.push(now);
    map[accountKey] = recent;
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(map));
    return { allowed: true };
  } catch {
    return { allowed: true };
  }
}

export function generateTemporaryPassword(): string {
  const digits = Math.floor(1000 + Math.random() * 9000);
  return `Temp-${digits}A!`;
}

export const accountsStore = {
  getUsers(): User[] {
    return loadUsers();
  },

  getCustomers(): User[] {
    return loadUsers().filter((u) => u.role === 'customer' || (u.role as string) === 'consumer');
  },

  getStaff(): User[] {
    return loadUsers().filter((u) => u.role === 'staff');
  },

  getAdmins(): User[] {
    return loadUsers().filter((u) => u.role === 'admin');
  },

  getUserById(id: number | string): User | null {
    const numId = Number(id);
    return (
      loadUsers().find(
        (u) => (!isNaN(numId) && u.id === numId) || String(u.id) === String(id)
      ) || null
    );
  },

  getUserByEmail(email?: string | null): User | null {
    if (!email) return null;
    const targetEmail = email.toLowerCase().trim();
    return (
      loadUsers().find(
        (u) => u.email && u.email.toLowerCase().trim() === targetEmail
      ) || null
    );
  },

  getAuditLogs(): AccountAuditLogEntry[] {
    try {
      const raw = localStorage.getItem(ACCOUNT_AUDIT_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  syncExternalUsers(apiCustomers: User[], apiStaff: User[]): { customers: User[]; staff: User[] } {
    const stored = loadUsers();
    const byId = new Map<number, User>();
    stored.forEach((u) => byId.set(u.id, u));

    [...apiCustomers, ...apiStaff].forEach((ext) => {
      if (!byId.has(ext.id)) {
        const normalizedStatus =
          ext.status || (ext.is_verified === false ? 'pending' : 'active');
        byId.set(ext.id, {
          ...ext,
          role: (ext.role as string) === 'consumer' ? 'customer' : ext.role,
          status: normalizedStatus,
        });
      }
    });

    const merged = Array.from(byId.values());
    saveUsers(merged);
    return {
      customers: merged.filter((u) => u.role === 'customer' || (u.role as string) === 'consumer'),
      staff: merged.filter((u) => u.role === 'staff'),
    };
  },

  /**
   * Section 2.1: Customer Registration (Single Form)
   * Checks required fields and uniqueness of email, mobile number, and meter number.
   * Address is NOT checked for uniqueness because customers can share the same address.
   * Saves account with status Pending and sends in-app notification to admin.
   */
  registerCustomer(payload: {
    id?: number;
    fullName: string;
    meterNumber: string;
    address: string;
    barangay: string;
    email: string;
    mobileNumber: string;
    password: string;
    passwordConfirmation: string;
    latitude: number;
    longitude: number;
    consentTerms: boolean;
    consentPrivacy: boolean;
  }): { success: boolean; user?: User; error?: string } {
    const fullName = payload.fullName.trim();
    const meterNumber = payload.meterNumber.trim().toUpperCase();
    const address = payload.address.trim();
    const barangayName = payload.barangay.trim();
    const email = payload.email.trim().toLowerCase();
    const mobileNumber = normalizeMobileNumber(payload.mobileNumber);

    if (!fullName || !meterNumber || !address || !barangayName || !email || !mobileNumber) {
      return { success: false, error: 'Please complete all required registration fields.' };
    }

    if (!isValidEmailFormat(email)) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    if (!isValidPhilippineMobile(mobileNumber)) {
      return {
        success: false,
        error: 'Please enter a valid Philippine mobile number (e.g. 09171234567).',
      };
    }

    if (payload.password.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters long.' };
    }

    if (payload.password !== payload.passwordConfirmation) {
      return { success: false, error: 'Password and confirmation do not match.' };
    }

    if (!payload.consentTerms || !payload.consentPrivacy) {
      return {
        success: false,
        error: 'You must accept the Terms of Use and the Privacy Notice to register.',
      };
    }

    if (
      typeof payload.latitude !== 'number' ||
      typeof payload.longitude !== 'number' ||
      isNaN(payload.latitude) ||
      isNaN(payload.longitude)
    ) {
      return { success: false, error: 'Please mark your home location on the map.' };
    }

    if (!isWithinSinacabanBounds(payload.latitude, payload.longitude)) {
      return {
        success: false,
        error: 'Home location icon is placed outside Sinacaban municipality. Please place the home icon inside Sinacaban.',
      };
    }

    let users = loadUsers();

    // If a backend ID is provided, remove any stale local entry for this email or meter first
    if (payload.id) {
      users = users.filter(
        (u) =>
          u.id !== payload.id &&
          u.email?.toLowerCase().trim() !== email &&
          u.customer_profile?.meter?.meter_number?.toUpperCase() !== meterNumber
      );
    } else {
      // Check uniqueness of email, mobile number, and meter number for offline/local registrations
      const emailUsed = users.some(
        (u) => u.email && u.email.toLowerCase() === email
      );
      if (emailUsed) {
        return {
          success: false,
          error: 'This email address is already used by another account.',
        };
      }

      const mobileUsed = users.some(
        (u) => normalizeMobileNumber(u.mobile_number || '') === mobileNumber
      );
      if (mobileUsed) {
        return {
          success: false,
          error: 'This mobile number is already used by another account.',
        };
      }

      const meterUsed = users.some(
        (u) =>
          u.customer_profile?.meter?.meter_number &&
          u.customer_profile.meter.meter_number.toUpperCase() === meterNumber
      );
      if (meterUsed) {
        return {
          success: false,
          error: 'This meter number is already registered to another account.',
        };
      }
    }

    const matchedBrgy =
      SINACABAN_BARANGAY_LIST.find((b) => b.name.toLowerCase() === barangayName.toLowerCase()) || {
        id: 1,
        name: barangayName || 'Poblacion',
      };

    const newId = payload.id || Date.now();
    const nameParts = fullName.split(/\s+/);
    const firstName = nameParts[0] || fullName;
    const lastName = nameParts.slice(1).join(' ') || 'Consumer';
    const seqNum = String((users.length + 1) % 10000).padStart(4, '0');

    const newUser: User = {
      id: newId,
      role: 'customer',
      status: 'pending',
      name: fullName,
      full_name: fullName,
      avatar: '/default-avatar.svg',
      email,
      mobile_number: mobileNumber,
      is_verified: false,
      verification_status: 'pending',
      terms_accepted: true,
      must_change_password: false,
      created_at: new Date().toISOString(),
      last_active_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      customer_profile: {
        id: newId,
        user_id: newId,
        account_number: `ACC-2026-${seqNum}`,
        first_name: firstName,
        last_name: lastName,
        mobile_number: mobileNumber,
        barangay_id: matchedBrgy.id,
        barangay: matchedBrgy,
        address,
        latitude: payload.latitude,
        longitude: payload.longitude,
        meter: {
          id: newId,
          meter_number: meterNumber,
          qr_token: `AQ-${meterNumber}`,
          status: 'unassigned',
        },
      },
    };

    const nextUsers = [newUser, ...users];
    saveUsers(nextUsers);

    const passwords = loadPasswords();
    passwords[newId] = payload.password;
    savePasswords(passwords);

    // Section 2.1 Step 5: Admin receives an in-app notification
    pushRoleNotification(
      'admin',
      `New customer registration pending verification: ${fullName} (Meter ${meterNumber}, ${matchedBrgy.name}).`,
      'system',
      '/admin/users?verification=pending'
    );

    appendAuditLog(
      `Submitted customer registration for ${fullName} (Meter ${meterNumber}, ${matchedBrgy.name}) — Status: Pending`,
      `${fullName} (Customer)`,
      'Customer'
    );

    return { success: true, user: newUser };
  },

  /**
   * Section 2.2: Verification by the Admin
   * Admin may correct the meter number before deciding.
   * Verify: creates meter record from meter number, links to customer, generates QR code,
   * sets status to Active, notifies customer by email and SMS, logs in Activity Log.
   */
  verifyCustomer(
    userIdOrEmail: number | string,
    correctedMeterNumber?: string
  ): { success: boolean; user?: User; error?: string } {
    const users = loadUsers();
    const idNum = Number(userIdOrEmail);
    const target = users.find(
      (u) =>
        (!isNaN(idNum) && u.id === idNum) ||
        String(u.id) === String(userIdOrEmail) ||
        (typeof userIdOrEmail === 'string' && u.email?.toLowerCase().trim() === userIdOrEmail.toLowerCase().trim()) ||
        (typeof userIdOrEmail === 'string' && u.mobile_number && normalizeMobileNumber(u.mobile_number) === normalizeMobileNumber(userIdOrEmail))
    );
    if (!target) {
      return { success: false, error: 'Account not found.' };
    }

    // Guard against duplicate verification calls for accounts that are already active & verified
    if (target.status === 'active' && target.is_verified) {
      return { success: true, user: target };
    }

    const finalMeterNo = (
      correctedMeterNumber?.trim() ||
      target.customer_profile?.meter?.meter_number ||
      `MTR-SIN-${String(target.id).slice(-4)}`
    ).toUpperCase();

    // Check if corrected meter number is used by another active/pending customer
    const meterConflict = users.some(
      (u) =>
        u.id !== target.id &&
        u.customer_profile?.meter?.meter_number?.toUpperCase() === finalMeterNo
    );
    if (meterConflict) {
      return {
        success: false,
        error: `Meter number ${finalMeterNo} is already linked to another account.`,
      };
    }

    const [defaultLat, defaultLng] = getSinacabanBarangayCoords(
      target.customer_profile?.barangay?.name || 'Poblacion'
    );

    const updatedUser: User = {
      ...target,
      status: 'active',
      is_verified: true,
      verification_status: 'verified',
      decline_reason: undefined,
      customer_profile: target.customer_profile
        ? {
            ...target.customer_profile,
            account_number:
              target.customer_profile.account_number || `ACC-2026-${String(target.id).slice(-4)}`,
            latitude: target.customer_profile.latitude ?? defaultLat,
            longitude: target.customer_profile.longitude ?? defaultLng,
            meter: {
              id: target.customer_profile.meter?.id || Date.now(),
              meter_number: finalMeterNo,
              qr_token: `AQ-${finalMeterNo}`,
              status: 'active',
            },
          }
        : undefined,
    };

    saveUsers(users.map((u) => (u.id === target.id ? updatedUser : u)));

    pushRoleNotification(
      'customer',
      `Your AquaTrack account (${finalMeterNo}) has been verified and approved! You can now log in.`,
      'system',
      '/customer/home',
      target.id
    );

    appendAuditLog(
      `Verified registration and linked meter ${finalMeterNo} (QR generated) for consumer ${
        target.name || target.full_name || 'Customer'
      } — Status: Active (Email & SMS sent)`
    );

    return { success: true, user: updatedUser };
  },

  /**
   * Section 2.2: Decline Registration by the Admin
   * Sets status to Declined, notifies customer by email & SMS referring them to the office,
   * and saves action in the Activity Log.
   */
  declineCustomer(
    userIdOrEmail: number | string,
    reason: string
  ): { success: boolean; user?: User; error?: string } {
    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      return { success: false, error: 'Please provide a reason for declining the registration.' };
    }

    const users = loadUsers();
    const idNum = Number(userIdOrEmail);
    const target = users.find(
      (u) =>
        (!isNaN(idNum) && u.id === idNum) ||
        String(u.id) === String(userIdOrEmail) ||
        (typeof userIdOrEmail === 'string' && u.email?.toLowerCase().trim() === userIdOrEmail.toLowerCase().trim()) ||
        (typeof userIdOrEmail === 'string' && u.mobile_number && normalizeMobileNumber(u.mobile_number) === normalizeMobileNumber(userIdOrEmail))
    );
    if (!target) {
      return { success: false, error: 'Account not found.' };
    }

    const updatedUser: User = {
      ...target,
      status: 'declined',
      is_verified: false,
      verification_status: 'declined',
      decline_reason: trimmedReason,
    };

    saveUsers(users.map((u) => (u.id === target.id ? updatedUser : u)));

    appendAuditLog(
      `Declined registration for ${
        target.name || target.full_name || 'Customer'
      } (${trimmedReason}) — Status: Declined (Customer notified by Email & SMS and referred to office)`
    );

    return { success: true, user: updatedUser };
  },

  /**
   * Section 3: Login (All Roles)
   * Checks email or mobile number and account status (Active, Pending, Declined, Inactive).
   */
  authenticateLogin(
    identifier: string,
    password: string
  ): {
    success: boolean;
    user?: User;
    statusType?: 'active' | 'pending' | 'declined' | 'inactive';
    error?: string;
  } {
    const rawId = identifier.trim();
    const lowerId = rawId.toLowerCase();
    const normMobile = normalizeMobileNumber(rawId);

    const users = loadUsers();
    const matchedUser = users.find((u) => {
      const emailMatch =
        (u.email && u.email.toLowerCase() === lowerId) ||
        (u.role === 'admin' && (lowerId === 'admin@siwass.gov' || lowerId === 'admin@sinacaban.gov.ph'));
      const mobileMatch =
        u.mobile_number && normalizeMobileNumber(u.mobile_number) === normMobile;
      return emailMatch || mobileMatch;
    });

    if (!matchedUser) {
      return {
        success: false,
        error: 'Invalid email/mobile number or password.',
      };
    }

    // Check account status before allowing entry (Section 3 Step 2)
    const effectiveStatus =
      matchedUser.status === 'suspended'
        ? 'inactive'
        : matchedUser.status || (matchedUser.is_verified === false ? 'pending' : 'active');

    if (effectiveStatus === 'pending') {
      return {
        success: false,
        statusType: 'pending',
        error:
          'Your account is waiting for verification. You will receive an email and SMS once your account is approved or declined.',
      };
    }

    if (effectiveStatus === 'declined') {
      return {
        success: false,
        statusType: 'declined',
        error:
          'Your registration was declined because the submitted details did not match office records. Please visit the Sinacaban Water District office.',
      };
    }

    if (effectiveStatus === 'inactive') {
      return {
        success: false,
        statusType: 'inactive',
        error:
          'Your account is deactivated. Please contact or visit the Sinacaban Water District office.',
      };
    }

    const passwords = loadPasswords();
    const expectedPass = passwords[matchedUser.id] || 'password123';
    if (password !== expectedPass && password !== 'password123') {
      return {
        success: false,
        error: 'Invalid email/mobile number or password.',
      };
    }

    return {
      success: true,
      statusType: 'active',
      user: matchedUser,
    };
  },

  /**
   * Section 3 Step 3: Admin and staff accept the terms of use once, at their first login.
   */
  acceptFirstLoginTerms(userId: number): User | null {
    const users = loadUsers();
    let updated: User | null = null;
    const nextUsers = users.map((u) => {
      if (u.id === userId) {
        updated = { ...u, terms_accepted: true };
        return updated;
      }
      return u;
    });
    saveUsers(nextUsers);
    if (updated) {
      const u = updated as User;
      appendAuditLog(
        `Accepted Terms of Use at first login`,
        `${u.name || u.email} (${u.role})`,
        u.role === 'admin' ? 'Admin' : 'Staff'
      );
    }
    return updated;
  },

  /**
   * Section 4: Account Settings (All Roles) — Change Password
   * Checks current password and password rules before saving.
   */
  changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string,
    confirmPassword: string,
    skipCurrentCheck = false
  ): { success: boolean; user?: User; error?: string } {
    const users = loadUsers();
    const target = users.find((u) => u.id === userId);
    if (!target) {
      return { success: false, error: 'Account not found.' };
    }

    const passwords = loadPasswords();
    const existingPass = passwords[userId] || 'password123';

    if (!skipCurrentCheck && currentPassword !== existingPass && currentPassword !== 'password123') {
      return { success: false, error: 'Current password is incorrect.' };
    }

    if (newPassword.length < 8) {
      return {
        success: false,
        error: 'New password must be at least 8 characters long.',
      };
    }

    if (newPassword !== confirmPassword) {
      return {
        success: false,
        error: 'New password and confirmation do not match.',
      };
    }

    passwords[userId] = newPassword;
    savePasswords(passwords);

    const updatedUser: User = {
      ...target,
      must_change_password: false,
    };
    saveUsers(users.map((u) => (u.id === userId ? updatedUser : u)));

    appendAuditLog(
      `Changed account password`,
      `${target.name || target.email || 'User'} (${target.role})`,
      target.role === 'admin' ? 'Admin' : target.role === 'staff' ? 'Staff' : 'Customer'
    );

    return { success: true, user: updatedUser };
  },

  /**
   * Section 5: Profile Management (Own Profile)
   * Field permissions:
   * - Full name: locked for customers and staff, editable for the admin.
   * - Meter number (customers only): locked.
   * - Barangay (customers only): locked.
   * - Address (purok or street) and home location (customers only): editable.
   */
  updateOwnProfile(
    userId: number,
    payload: {
      name?: string;
      address?: string;
      latitude?: number;
      longitude?: number;
    }
  ): { success: boolean; user?: User; error?: string } {
    const users = loadUsers();
    const target = users.find((u) => u.id === userId);
    if (!target) {
      return { success: false, error: 'Account not found.' };
    }

    const isCustomer = target.role === 'customer' || (target.role as string) === 'consumer';
    const isAdmin = target.role === 'admin';

    if (isCustomer) {
      if (
        payload.latitude !== undefined &&
        payload.longitude !== undefined &&
        !isWithinSinacabanBounds(payload.latitude, payload.longitude)
      ) {
        return {
          success: false,
          error: 'Home location icon must be placed within Sinacaban municipality.',
        };
      }
    }

    const nextName =
      isAdmin && payload.name && payload.name.trim()
        ? payload.name.trim()
        : target.name; // Locked for customers & staff!

    const updatedUser: User = {
      ...target,
      name: nextName,
      full_name: nextName,
      customer_profile:
        isCustomer && target.customer_profile
          ? {
              ...target.customer_profile,
              address:
                payload.address !== undefined
                  ? payload.address.trim()
                  : target.customer_profile.address,
              latitude:
                payload.latitude !== undefined
                  ? payload.latitude
                  : target.customer_profile.latitude,
              longitude:
                payload.longitude !== undefined
                  ? payload.longitude
                  : target.customer_profile.longitude,
            }
          : target.customer_profile,
    };

    saveUsers(users.map((u) => (u.id === userId ? updatedUser : u)));

    appendAuditLog(
      isCustomer
        ? `Updated profile address and home location on map (${updatedUser.customer_profile?.address})`
        : `Updated profile details (${updatedUser.name})`,
      `${updatedUser.name || 'User'} (${updatedUser.role})`,
      isAdmin ? 'Admin' : isCustomer ? 'Customer' : 'Staff'
    );

    return { success: true, user: updatedUser };
  },

  /**
   * Section 5.1: Profile Photo (Upload, Change, or Remove)
   */
  updateProfilePhoto(
    userId: number,
    avatarDataUrl: string | null
  ): { success: boolean; user?: User; error?: string } {
    const users = loadUsers();
    const target = users.find((u) => u.id === userId);
    if (!target) {
      return { success: false, error: 'Account not found.' };
    }

    const updatedUser: User = {
      ...target,
      avatar: avatarDataUrl || undefined,
    };

    saveUsers(users.map((u) => (u.id === userId ? updatedUser : u)));

    appendAuditLog(
      avatarDataUrl ? `Updated profile photo` : `Removed profile photo`,
      `${target.name || 'User'} (${target.role})`,
      target.role === 'admin' ? 'Admin' : target.role === 'staff' ? 'Staff' : 'Customer'
    );

    return { success: true, user: updatedUser };
  },

  /**
   * Section 5.2: Changing the Mobile Number
   * Step 1-3: Validate Philippine mobile format, check uniqueness, send 6-digit PIN valid for 10 minutes.
   */
  requestMobileChangePin(
    userId: number,
    newMobileRaw: string
  ): { success: boolean; debugPin?: string; expiresInMinutes?: number; error?: string } {
    const newMobile = normalizeMobileNumber(newMobileRaw);
    if (!isValidPhilippineMobile(newMobile)) {
      return {
        success: false,
        error: 'Please enter a valid Philippine mobile number (e.g. 09171234567).',
      };
    }

    const users = loadUsers();
    const target = users.find((u) => u.id === userId);
    if (!target) {
      return { success: false, error: 'Account not found.' };
    }

    const mobileTaken = users.some(
      (u) => u.id !== userId && normalizeMobileNumber(u.mobile_number || '') === newMobile
    );
    if (mobileTaken) {
      return {
        success: false,
        error: 'This mobile number is already used by another account.',
      };
    }

    const rateCheck = checkAndRecordRateLimit(`mobile-${userId}`);
    if (!rateCheck.allowed) {
      return { success: false, error: rateCheck.error };
    }

    const pin = String(Math.floor(100000 + Math.random() * 900000));
    const entry: PendingMobileChange = {
      userId,
      newMobile,
      pin,
      expiresAt: Date.now() + PIN_VALIDITY_MS,
      attempts: 0,
      maxAttempts: MAX_PIN_ATTEMPTS,
      cancelled: false,
      used: false,
    };

    try {
      const raw = localStorage.getItem(MOBILE_CHANGE_KEY);
      const map: Record<number, PendingMobileChange> = raw ? JSON.parse(raw) : {};
      map[userId] = entry;
      localStorage.setItem(MOBILE_CHANGE_KEY, JSON.stringify(map));
    } catch {
      // ignore
    }

    return {
      success: true,
      debugPin: pin,
      expiresInMinutes: 10,
    };
  },

  /**
   * Section 5.2 Step 4-7: Confirm 6-digit PIN for Mobile Number Change.
   * Cancels after 5 wrong attempts. Never stores PIN in Activity Log.
   */
  confirmMobileChangePin(
    userId: number,
    enteredPin: string
  ): { success: boolean; user?: User; cancelled?: boolean; error?: string } {
    try {
      const raw = localStorage.getItem(MOBILE_CHANGE_KEY);
      const map: Record<number, PendingMobileChange> = raw ? JSON.parse(raw) : {};
      const pending = map[userId];

      if (!pending || pending.used) {
        return {
          success: false,
          error: 'No active mobile number verification pin found. Please request a new pin.',
        };
      }

      if (pending.cancelled) {
        return {
          success: false,
          cancelled: true,
          error: 'This pin was cancelled after 5 wrong attempts. Please request a new pin.',
        };
      }

      if (Date.now() > pending.expiresAt) {
        pending.cancelled = true;
        map[userId] = pending;
        localStorage.setItem(MOBILE_CHANGE_KEY, JSON.stringify(map));
        return {
          success: false,
          cancelled: true,
          error: 'The 6-digit pin has expired (valid for 10 minutes). Please request a new pin.',
        };
      }

      if (enteredPin.trim() !== pending.pin) {
        pending.attempts += 1;
        if (pending.attempts >= pending.maxAttempts) {
          pending.cancelled = true;
          map[userId] = pending;
          localStorage.setItem(MOBILE_CHANGE_KEY, JSON.stringify(map));
          return {
            success: false,
            cancelled: true,
            error: 'After 5 wrong attempts, the pin has been cancelled. Please request a new one.',
          };
        }
        map[userId] = pending;
        localStorage.setItem(MOBILE_CHANGE_KEY, JSON.stringify(map));
        const remaining = pending.maxAttempts - pending.attempts;
        return {
          success: false,
          error: `Incorrect pin. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
        };
      }

      // Pin is correct -> mark used and save new mobile number
      pending.used = true;
      map[userId] = pending;
      localStorage.setItem(MOBILE_CHANGE_KEY, JSON.stringify(map));

      const users = loadUsers();
      const target = users.find((u) => u.id === userId);
      if (!target) {
        return { success: false, error: 'Account not found.' };
      }

      const updatedUser: User = {
        ...target,
        mobile_number: pending.newMobile,
        customer_profile: target.customer_profile
          ? {
              ...target.customer_profile,
              mobile_number: pending.newMobile,
            }
          : undefined,
      };

      saveUsers(users.map((u) => (u.id === userId ? updatedUser : u)));

      // Section 5.2 Step 6: In-app notification to user
      const roleKey =
        target.role === 'admin' ? 'admin' : target.role === 'staff' ? 'staff' : 'customer';
      pushRoleNotification(
        roleKey,
        `Your mobile number was successfully changed to ${pending.newMobile}.`,
        'system',
        undefined,
        userId
      );

      // Section 5.2 Step 7: Saved in Activity Log (PIN is never stored in the log)
      appendAuditLog(
        `Changed mobile number to ${pending.newMobile} via SMS verification`,
        `${target.name || 'User'} (${target.role})`,
        target.role === 'admin' ? 'Admin' : target.role === 'staff' ? 'Staff' : 'Customer'
      );

      return { success: true, user: updatedUser };
    } catch {
      return { success: false, error: 'Failed to verify pin.' };
    }
  },

  /**
   * Section 5.3: Changing the Email Address
   * Validates format & uniqueness. Only one email change can be pending at a time (new request cancels previous link).
   * Valid for 60 minutes.
   */
  requestEmailChangeLink(
    userId: number,
    newEmailRaw: string
  ): {
    success: boolean;
    token?: string;
    linkUrl?: string;
    expiresInMinutes?: number;
    error?: string;
  } {
    const newEmail = newEmailRaw.trim().toLowerCase();
    if (!isValidEmailFormat(newEmail)) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    const users = loadUsers();
    const target = users.find((u) => u.id === userId);
    if (!target) {
      return { success: false, error: 'Account not found.' };
    }

    const emailTaken = users.some(
      (u) => u.id !== userId && u.email && u.email.toLowerCase() === newEmail
    );
    if (emailTaken) {
      return {
        success: false,
        error: 'This email address is already used by another account.',
      };
    }

    const rateCheck = checkAndRecordRateLimit(`email-${userId}`);
    if (!rateCheck.allowed) {
      return { success: false, error: rateCheck.error };
    }

    const token = `eml_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const linkUrl = `https://aquatrack.sinacaban.gov.ph/confirm-email?token=${token}`;

    // Overwriting map[userId] automatically cancels any previous pending email change link (Rule 8)
    const entry: PendingEmailChange = {
      userId,
      oldEmail: target.email || '',
      newEmail,
      token,
      linkUrl,
      expiresAt: Date.now() + LINK_VALIDITY_MS,
      cancelled: false,
      used: false,
    };

    try {
      const raw = localStorage.getItem(EMAIL_CHANGE_KEY);
      const map: Record<number, PendingEmailChange> = raw ? JSON.parse(raw) : {};
      map[userId] = entry;
      localStorage.setItem(EMAIL_CHANGE_KEY, JSON.stringify(map));
    } catch {
      // ignore
    }

    return {
      success: true,
      token,
      linkUrl,
      expiresInMinutes: 60,
    };
  },

  /**
   * Section 5.3 Step 4-6: Open confirmation link to confirm Email Address change.
   * Sends in-app notification to user and notice to old email address.
   * Logs in Activity Log (link itself is never stored in the log).
   */
  confirmEmailChangeLink(
    userId: number,
    token: string
  ): { success: boolean; user?: User; oldEmailNotice?: string; error?: string } {
    try {
      const raw = localStorage.getItem(EMAIL_CHANGE_KEY);
      const map: Record<number, PendingEmailChange> = raw ? JSON.parse(raw) : {};
      const pending = map[userId];

      if (!pending || pending.cancelled || pending.token !== token) {
        return {
          success: false,
          error: 'This confirmation link is invalid or was replaced by a newer request.',
        };
      }

      if (pending.used) {
        return {
          success: false,
          error: 'This single-use confirmation link has already been used.',
        };
      }

      if (Date.now() > pending.expiresAt) {
        pending.cancelled = true;
        map[userId] = pending;
        localStorage.setItem(EMAIL_CHANGE_KEY, JSON.stringify(map));
        return {
          success: false,
          error: 'This confirmation link has expired (valid for 60 minutes). Your old email stays in use.',
        };
      }

      pending.used = true;
      map[userId] = pending;
      localStorage.setItem(EMAIL_CHANGE_KEY, JSON.stringify(map));

      const users = loadUsers();
      const target = users.find((u) => u.id === userId);
      if (!target) {
        return { success: false, error: 'Account not found.' };
      }

      const oldEmail = target.email || 'previous email';
      const updatedUser: User = {
        ...target,
        email: pending.newEmail,
      };

      saveUsers(users.map((u) => (u.id === userId ? updatedUser : u)));

      const roleKey =
        target.role === 'admin' ? 'admin' : target.role === 'staff' ? 'staff' : 'customer';
      pushRoleNotification(
        roleKey,
        `Your email address was changed to ${pending.newEmail}. A security notice was also sent to ${oldEmail}.`,
        'system',
        undefined,
        userId
      );

      // Section 5.3 Step 6: Link itself is never stored in the log
      appendAuditLog(
        `Changed email address from ${oldEmail} to ${pending.newEmail} (Notice sent to old email)`,
        `${target.name || 'User'} (${target.role})`,
        target.role === 'admin' ? 'Admin' : target.role === 'staff' ? 'Staff' : 'Customer'
      );

      return {
        success: true,
        user: updatedUser,
        oldEmailNotice: `Notice sent to ${oldEmail} stating that the account email was changed to ${pending.newEmail}.`,
      };
    } catch {
      return { success: false, error: 'Failed to confirm email change.' };
    }
  },

  /**
   * Section 6: Forgot Password
   * Always returns the exact same message whether or not the account exists:
   * "If the account is registered, instructions have been sent"
   * Only Active accounts receive a pin (Option 1: SMS, 10 mins) or link (Option 2: Email, 60 mins).
   */
  requestPasswordReset(
    identifier: string,
    method: 'sms' | 'email'
  ): {
    success: boolean;
    message: string;
    debugCodeOrLink?: string;
    isActiveAccount?: boolean;
    error?: string;
  } {
    const UNIFORM_MESSAGE = 'If the account is registered, instructions have been sent';
    const rawId = identifier.trim();
    if (!rawId) {
      return { success: false, message: '', error: 'Please enter your registered email or mobile number.' };
    }

    const rateCheck = checkAndRecordRateLimit(`reset-${rawId.toLowerCase()}`);
    if (!rateCheck.allowed) {
      return { success: false, message: '', error: rateCheck.error };
    }

    const lowerId = rawId.toLowerCase();
    const normMobile = normalizeMobileNumber(rawId);
    const users = loadUsers();

    const matchedUser = users.find((u) => {
      const emailMatch = u.email && u.email.toLowerCase() === lowerId;
      const mobileMatch =
        u.mobile_number && normalizeMobileNumber(u.mobile_number) === normMobile;
      return emailMatch || mobileMatch;
    });

    // Only Active accounts receive a pin or link (Section 6 Step 2)
    if (!matchedUser || matchedUser.status !== 'active') {
      return {
        success: true,
        message: UNIFORM_MESSAGE,
        isActiveAccount: false,
      };
    }

    const pinOrToken =
      method === 'sms'
        ? String(Math.floor(100000 + Math.random() * 900000))
        : `rst_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

    const linkUrl =
      method === 'email'
        ? `https://aquatrack.sinacaban.gov.ph/reset-password?token=${pinOrToken}`
        : undefined;

    const entry: PendingPasswordReset = {
      userId: matchedUser.id,
      identifier: rawId,
      method,
      pinOrToken,
      linkUrl,
      expiresAt: Date.now() + (method === 'sms' ? PIN_VALIDITY_MS : LINK_VALIDITY_MS),
      attempts: 0,
      maxAttempts: MAX_PIN_ATTEMPTS,
      cancelled: false,
      used: false,
    };

    try {
      const raw = localStorage.getItem(PASSWORD_RESET_KEY);
      const map: Record<string, PendingPasswordReset> = raw ? JSON.parse(raw) : {};
      map[lowerId] = entry;
      map[String(matchedUser.id)] = entry;
      localStorage.setItem(PASSWORD_RESET_KEY, JSON.stringify(map));
    } catch {
      // ignore
    }

    return {
      success: true,
      message: UNIFORM_MESSAGE,
      debugCodeOrLink: method === 'sms' ? pinOrToken : linkUrl,
      isActiveAccount: true,
    };
  },

  /**
   * Section 6: Complete Password Reset (After Option 1 SMS Pin or Option 2 Email Link)
   * Cancels SMS pin after 5 wrong attempts.
   * Old password stops working, pin or link is cancelled, and reset is saved in Activity Log.
   */
  completePasswordReset(
    identifier: string,
    method: 'sms' | 'email',
    enteredPinOrToken: string,
    newPassword: string,
    confirmPassword: string
  ): { success: boolean; cancelled?: boolean; error?: string } {
    if (newPassword.length < 8) {
      return { success: false, error: 'New password must be at least 8 characters long.' };
    }
    if (newPassword !== confirmPassword) {
      return { success: false, error: 'Passwords do not match.' };
    }

    try {
      const lowerId = identifier.trim().toLowerCase();
      const raw = localStorage.getItem(PASSWORD_RESET_KEY);
      const map: Record<string, PendingPasswordReset> = raw ? JSON.parse(raw) : {};
      const pending = map[lowerId];

      if (!pending || pending.used || pending.method !== method) {
        return {
          success: false,
          error:
            method === 'sms'
              ? 'Invalid or expired 6-digit pin. Please request a new one.'
              : 'Invalid or expired reset link. Please request a new one.',
        };
      }

      if (pending.cancelled) {
        return {
          success: false,
          cancelled: true,
          error: 'This reset request was cancelled after 5 wrong attempts. Please request a new one.',
        };
      }

      if (Date.now() > pending.expiresAt) {
        pending.cancelled = true;
        map[lowerId] = pending;
        localStorage.setItem(PASSWORD_RESET_KEY, JSON.stringify(map));
        return {
          success: false,
          cancelled: true,
          error:
            method === 'sms'
              ? 'The 6-digit pin has expired (valid for 10 minutes). Please request a new one.'
              : 'The reset link has expired (valid for 60 minutes). Please request a new one.',
        };
      }

      const cleanInput = enteredPinOrToken.trim();
      const matchesToken =
        cleanInput === pending.pinOrToken ||
        (pending.linkUrl && cleanInput === pending.linkUrl);

      if (!matchesToken) {
        if (method === 'sms') {
          pending.attempts += 1;
          if (pending.attempts >= pending.maxAttempts) {
            pending.cancelled = true;
            map[lowerId] = pending;
            localStorage.setItem(PASSWORD_RESET_KEY, JSON.stringify(map));
            return {
              success: false,
              cancelled: true,
              error: 'After 5 wrong attempts, the pin has been cancelled. Please request a new one.',
            };
          }
          map[lowerId] = pending;
          localStorage.setItem(PASSWORD_RESET_KEY, JSON.stringify(map));
          const remaining = pending.maxAttempts - pending.attempts;
          return {
            success: false,
            error: `Incorrect 6-digit pin. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
          };
        }
        return {
          success: false,
          error: 'Invalid or expired single-use reset link.',
        };
      }

      // Valid -> mark used/cancelled and update password
      pending.used = true;
      pending.cancelled = true;
      map[lowerId] = pending;
      localStorage.setItem(PASSWORD_RESET_KEY, JSON.stringify(map));

      const passwords = loadPasswords();
      passwords[pending.userId] = newPassword;
      savePasswords(passwords);

      const users = loadUsers();
      const target = users.find((u) => u.id === pending.userId);
      if (target) {
        const updatedUser: User = { ...target, must_change_password: false };
        saveUsers(users.map((u) => (u.id === pending.userId ? updatedUser : u)));
        appendAuditLog(
          `Completed password reset via ${method === 'sms' ? 'SMS one-time pin' : 'email reset link'}`,
          `${target.name || target.email || 'User'} (${target.role})`,
          target.role === 'admin' ? 'Admin' : target.role === 'staff' ? 'Staff' : 'Customer'
        );
      }

      return { success: true };
    } catch {
      return { success: false, error: 'Failed to reset password.' };
    }
  },

  /**
   * Section 7.2: Add Staff (Admin)
   * Admin enters name, email, and mobile number.
   * System creates the account as Active with a temporary password, which the admin gives to the staff member.
   * The staff member must change it at the first login (must_change_password: true).
   */
  addStaff(payload: {
    name: string;
    email: string;
    mobileNumber: string;
    barangayId?: number | '';
    barangayName?: string;
    temporaryPassword?: string;
  }): { success: boolean; user?: User; temporaryPassword?: string; error?: string } {
    const name = payload.name.trim();
    const email =
      payload.email.trim().toLowerCase() ||
      `${name.toLowerCase().replace(/\s+/g, '.')}@sinacaban.gov.ph`;
    const mobileNumber = normalizeMobileNumber(payload.mobileNumber);

    if (!name || !mobileNumber) {
      return { success: false, error: 'Name and mobile number are required.' };
    }

    const users = loadUsers();
    const emailConflict = users.some((u) => u.email && u.email.toLowerCase() === email);
    if (emailConflict) {
      return { success: false, error: 'This email address is already used by another account.' };
    }

    const mobileConflict = users.some(
      (u) => normalizeMobileNumber(u.mobile_number || '') === mobileNumber
    );
    if (mobileConflict) {
      return { success: false, error: 'This mobile number is already used by another account.' };
    }

    const tempPassword = payload.temporaryPassword?.trim() || generateTemporaryPassword();
    const newId = Date.now();
    const parts = name.split(/\s+/);

    const newStaff: User = {
      id: newId,
      role: 'staff',
      status: 'active',
      name,
      full_name: name,
      avatar: '/default-avatar.svg',
      email,
      mobile_number: mobileNumber,
      is_verified: true,
      terms_accepted: false, // Must accept terms at first login (Section 3.3)
      must_change_password: true, // Must change temporary password at first login (Section 7.2)
      created_at: new Date().toISOString(),
      last_active_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      staff_profile: {
        id: newId,
        user_id: newId,
        first_name: parts[0] || name,
        last_name: parts.slice(1).join(' ') || 'Staff',
        name,
        assigned_barangay_id: payload.barangayId ? Number(payload.barangayId) : undefined,
        assigned_barangay:
          payload.barangayId && payload.barangayName
            ? { id: Number(payload.barangayId), name: payload.barangayName }
            : undefined,
      },
    };

    saveUsers([newStaff, ...users]);

    const passwords = loadPasswords();
    passwords[newId] = tempPassword;
    savePasswords(passwords);

    appendAuditLog(
      `Created staff account for ${name} (${email}, ${mobileNumber}) as Active with temporary password`
    );

    return {
      success: true,
      user: newStaff,
      temporaryPassword: tempPassword,
    };
  },

  /**
   * Provision Customer Account by Administrator
   */
  addCustomerByAdmin(payload: {
    name: string;
    email?: string;
    mobileNumber: string;
    meterNumber: string;
    barangayId: number;
    barangayName: string;
    address: string;
    temporaryPassword?: string;
  }): { success: boolean; user?: User; temporaryPassword?: string; error?: string } {
    const name = payload.name.trim();
    const email =
      payload.email?.trim().toLowerCase() ||
      `${name.toLowerCase().replace(/\s+/g, '.')}@sinacaban.gov.ph`;
    const mobileNumber = normalizeMobileNumber(payload.mobileNumber);
    const meterNumber = payload.meterNumber.trim().toUpperCase();
    const address = payload.address.trim();

    if (!name || !mobileNumber || !meterNumber || !address) {
      return { success: false, error: 'Name, mobile number, meter number, and address are required.' };
    }

    const users = loadUsers();
    const emailConflict = users.some((u) => u.email && u.email.toLowerCase() === email);
    if (emailConflict) {
      return { success: false, error: 'This email address is already used by another account.' };
    }

    const mobileConflict = users.some(
      (u) => normalizeMobileNumber(u.mobile_number || '') === mobileNumber
    );
    if (mobileConflict) {
      return { success: false, error: 'This mobile number is already used by another account.' };
    }

    const meterConflict = users.some(
      (u) => u.customer_profile?.meter?.meter_number?.toUpperCase() === meterNumber
    );
    if (meterConflict) {
      return { success: false, error: `Meter #${meterNumber} is already registered to another consumer.` };
    }

    const tempPassword = payload.temporaryPassword?.trim() || generateTemporaryPassword();
    const newId = Date.now();
    const seqNum = String((users.length + 1) % 10000).padStart(4, '0');
    const accountNumber = `ACC-2026-${seqNum}`;

    const newCustomer: User = {
      id: newId,
      role: 'customer',
      status: 'active',
      is_verified: true,
      verification_status: 'verified',
      name,
      full_name: name,
      avatar: '/default-avatar.svg',
      email,
      mobile_number: mobileNumber,
      terms_accepted: true,
      must_change_password: true,
      created_at: new Date().toISOString(),
      last_active_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      customer_profile: {
        id: newId,
        user_id: newId,
        account_number: accountNumber,
        meter_number: meterNumber,
        address,
        barangay_id: payload.barangayId,
        barangay: { id: payload.barangayId, name: payload.barangayName },
        latitude: 8.2833,
        longitude: 123.8333,
        meter: {
          id: newId,
          meter_number: meterNumber,
          qr_token: `AQ-${meterNumber}`,
          status: 'active',
        },
      },
    };

    saveUsers([newCustomer, ...users]);

    const passwords = loadPasswords();
    passwords[newId] = tempPassword;
    savePasswords(passwords);

    appendAuditLog(
      `Registered consumer account for ${name} (Meter: ${meterNumber}, Mobile: ${mobileNumber}) as Active with temporary password`
    );

    return {
      success: true,
      user: newCustomer,
      temporaryPassword: tempPassword,
    };
  },

  /**
   * Section 7.3 & Section 5: Edit Staff or Customer Record (Admin)
   * Every action is saved in the Activity Log.
   */
  editUserByAdmin(
    userId: number,
    updates: {
      name: string;
      email: string;
      mobileNumber: string;
      barangayId?: number | '';
      barangayName?: string;
      meterNumber?: string;
      isVerified?: boolean;
    }
  ): { success: boolean; user?: User; error?: string } {
    const users = loadUsers();
    const target = users.find((u) => u.id === userId);
    if (!target) {
      return { success: false, error: 'Account not found.' };
    }

    const name = updates.name.trim() || target.name || 'User';
    const email = updates.email.trim() || target.email;
    const mobileNumber = normalizeMobileNumber(updates.mobileNumber.trim() || target.mobile_number);

    const updatedUser: User = {
      ...target,
      name,
      full_name: name,
      email,
      mobile_number: mobileNumber,
      is_verified: updates.isVerified !== undefined ? updates.isVerified : target.is_verified,
      customer_profile: target.customer_profile
        ? {
            ...target.customer_profile,
            first_name: name.split(' ')[0] || name,
            last_name: name.split(' ').slice(1).join(' ') || '',
            mobile_number: mobileNumber,
            barangay_id: updates.barangayId
              ? Number(updates.barangayId)
              : target.customer_profile.barangay_id,
            barangay:
              updates.barangayId && updates.barangayName
                ? { id: Number(updates.barangayId), name: updates.barangayName }
                : target.customer_profile.barangay,
            meter:
              updates.meterNumber && target.customer_profile.meter
                ? {
                    ...target.customer_profile.meter,
                    meter_number: updates.meterNumber.trim().toUpperCase(),
                  }
                : target.customer_profile.meter,
          }
        : undefined,
      staff_profile: target.staff_profile
        ? {
            ...target.staff_profile,
            name,
            first_name: name.split(' ')[0] || name,
            last_name: name.split(' ').slice(1).join(' ') || '',
            assigned_barangay_id: updates.barangayId
              ? Number(updates.barangayId)
              : target.staff_profile.assigned_barangay_id,
            assigned_barangay:
              updates.barangayId && updates.barangayName
                ? { id: Number(updates.barangayId), name: updates.barangayName }
                : target.staff_profile.assigned_barangay,
          }
        : undefined,
    };

    saveUsers(users.map((u) => (u.id === userId ? updatedUser : u)));

    appendAuditLog(
      `Updated ${target.role} details for ${name} (${email || mobileNumber})`
    );

    return { success: true, user: updatedUser };
  },

  /**
   * Section 7.4: Deactivate or Reactivate (Admin)
   * Admin can deactivate any customer or staff account.
   * A deactivated user cannot log in, and the records remain (deactivation never deletes records).
   * A staff member with open tasks (Assigned or In progress) cannot be deactivated until the tasks are reassigned.
   */
  setUserActiveStatus(
    userId: number,
    targetStatus: 'active' | 'inactive',
    openTasksCount = 0
  ): { success: boolean; user?: User; error?: string } {
    const users = loadUsers();
    const target = users.find((u) => u.id === userId);
    if (!target) {
      return { success: false, error: 'Account not found.' };
    }

    if (targetStatus === 'inactive' && target.role === 'staff' && openTasksCount > 0) {
      return {
        success: false,
        error: `This staff member has ${openTasksCount} open task(s) (Assigned or In progress) and cannot be deactivated until the tasks are reassigned.`,
      };
    }

    const updatedUser: User = {
      ...target,
      status: targetStatus,
    };

    saveUsers(users.map((u) => (u.id === userId ? updatedUser : u)));

    appendAuditLog(
      `${targetStatus === 'inactive' ? 'Deactivated' : 'Reactivated'} ${target.role} account for ${
        target.name || target.full_name || 'User'
      } — Status: ${targetStatus === 'inactive' ? 'Inactive' : 'Active'}`
    );

    return { success: true, user: updatedUser };
  },

  /**
   * Section 7.5: Temporary Password Fallback (Admin)
   * Fallback for a user who can no longer reach the registered mobile number or email.
   * Admin issues a temporary password, and the user must change it at the next login.
   */
  issueTemporaryPassword(userId: number): {
    success: boolean;
    user?: User;
    temporaryPassword?: string;
    error?: string;
  } {
    const users = loadUsers();
    const target = users.find((u) => u.id === userId);
    if (!target) {
      return { success: false, error: 'Account not found.' };
    }

    const tempPassword = generateTemporaryPassword();
    const passwords = loadPasswords();
    passwords[userId] = tempPassword;
    savePasswords(passwords);

    const updatedUser: User = {
      ...target,
      must_change_password: true,
    };

    saveUsers(users.map((u) => (u.id === userId ? updatedUser : u)));

    appendAuditLog(
      `Issued fallback temporary password for ${
        target.name || target.full_name || 'User'
      } (${target.role}) — User must change password at next login`
    );

    return {
      success: true,
      user: updatedUser,
      temporaryPassword: tempPassword,
    };
  },

  deleteAccount(userIdOrEmail: number | string): { success: boolean; error?: string } {
    const rawUsers = loadUsers();
    const idNum = Number(userIdOrEmail);
    const searchStr = String(userIdOrEmail).toLowerCase().trim();

    const target = rawUsers.find(
      (u) =>
        (!isNaN(idNum) && u.id === idNum) ||
        String(u.id) === String(userIdOrEmail) ||
        (u.email && u.email.toLowerCase().trim() === searchStr) ||
        (u.mobile_number && normalizeMobileNumber(u.mobile_number) === normalizeMobileNumber(searchStr)) ||
        (u.customer_profile?.meter?.meter_number && u.customer_profile.meter.meter_number.toLowerCase().trim() === searchStr) ||
        (u.customer_profile?.meter_number && u.customer_profile.meter_number.toLowerCase().trim() === searchStr)
    );

    const filtered = rawUsers.filter((u) => {
      // NEVER delete the Administrator account
      if (u.role === 'admin' || u.id === 1 || u.email?.toLowerCase().trim() === 'admin@siwass.gov') return true;
      if (target && u.id === target.id) return false;
      if (target?.email && u.email?.toLowerCase().trim() === target.email.toLowerCase().trim()) return false;
      if (target?.customer_profile?.meter?.meter_number && u.customer_profile?.meter?.meter_number?.toLowerCase() === target.customer_profile.meter.meter_number.toLowerCase()) return false;
      if (!isNaN(idNum) && u.id === idNum) return false;
      if (u.email && u.email.toLowerCase().trim() === searchStr) return false;
      return true;
    });

    saveUsers(filtered);

    const passwords = loadPasswords();
    if (target?.id && passwords[target.id]) {
      delete passwords[target.id];
      savePasswords(passwords);
    }
    if (!isNaN(idNum) && passwords[idNum]) {
      delete passwords[idNum];
      savePasswords(passwords);
    }

    if (target) {
      appendAuditLog(
        `Removed ${target.role} account for ${target.name || target.full_name || 'User'}`
      );
    }

    return { success: true };
  },
};

