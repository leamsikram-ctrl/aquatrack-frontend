export type AdvisoryStatus = 'scheduled' | 'ongoing' | 'completed' | 'cancelled';

export interface AdvisoryRecord {
  id: number;
  title: string;
  reason: string;
  barangay_ids: number[];
  barangay_names: string[];
  starts_at: string; // YYYY-MM-DDTHH:mm
  ends_at: string; // Expected end (or actual end when restored)
  actual_restored_at?: string;
  remarks?: string;
  restoration_remark?: string;
  is_cancelled?: boolean;
  is_restored?: boolean;
  affected_customers_count: number;
  sms_sent_count: number;
  in_app_only_count: number;
  sms_text: string;
  created_at: string;
  updated_at: string;
}

export interface AdvisoryAuditLogItem {
  id: string;
  time: string;
  user: string;
  role: string;
  action: string;
  category: 'assignment';
}

export interface AdvisoryConsumer {
  id: number;
  name: string;
  barangay_id: number;
  barangay_name: string;
  mobile_number: string; // Empty string if customer has no mobile number
  is_active: boolean;
}

export interface AdvisoryRecipientPreview {
  totalAffected: number;
  smsCount: number;
  inAppOnlyCount: number;
  smsText: string;
}

const STORAGE_KEY_ADVISORIES = 'aquatrack_water_advisories_v2';
const STORAGE_KEY_ADVISORY_LOGS = 'aquatrack_water_advisory_logs_v2';

export const SINACABAN_BARANGAY_LIST: { id: number; name: string }[] = [
  { id: 1, name: 'Cagay-anon' },
  { id: 2, name: 'Camanse' },
  { id: 3, name: 'Colupan Alto' },
  { id: 4, name: 'Colupan Bajo' },
  { id: 5, name: 'Dinas' },
  { id: 6, name: 'Estrella' },
  { id: 7, name: 'Katipunan' },
  { id: 8, name: 'Libertad Alto' },
  { id: 9, name: 'Libertad Bajo' },
  { id: 10, name: 'Poblacion' },
  { id: 11, name: 'San Isidro Alto' },
  { id: 12, name: 'San Isidro Bajo' },
  { id: 13, name: 'San Lorenzo Ruiz' },
  { id: 14, name: 'San Vicente' },
  { id: 15, name: 'Señor' },
  { id: 16, name: 'Sinonoc' },
  { id: 17, name: 'Tipan' },
];

// Active & Pending Customers across Sinacaban Barangays (including customers with & without mobile numbers to support Section 3.5 & 3.8)
export const DEFAULT_ADVISORY_CONSUMERS: AdvisoryConsumer[] = [
  { id: 101, name: 'Maria Santos', barangay_id: 1, barangay_name: 'Poblacion', mobile_number: '09171234567', is_active: true },
  { id: 102, name: 'Carlos Mendoza', barangay_id: 1, barangay_name: 'Poblacion', mobile_number: '09179876543', is_active: true },
  { id: 103, name: 'Lydia Villanueva', barangay_id: 1, barangay_name: 'Poblacion', mobile_number: '', is_active: true }, // Active customer without mobile number -> in-app only
  { id: 104, name: 'Juan Dela Cruz', barangay_id: 2, barangay_name: 'San Isidro Alto', mobile_number: '09182345678', is_active: true },
  { id: 105, name: 'Ramon Bautista', barangay_id: 2, barangay_name: 'San Isidro Alto', mobile_number: '', is_active: true }, // In-app only
  { id: 106, name: 'Pedro Penduko', barangay_id: 3, barangay_name: 'Cagay-anon', mobile_number: '09193456789', is_active: true },
  { id: 107, name: 'Elena Reyes', barangay_id: 4, barangay_name: 'Colupan Bajo', mobile_number: '09204567890', is_active: true },
  { id: 108, name: 'Roberto Gomez', barangay_id: 5, barangay_name: 'Sinonoc', mobile_number: '09215678901', is_active: true },
  { id: 109, name: 'Lorna Tolentino', barangay_id: 6, barangay_name: 'Libertad Bajo', mobile_number: '09226789012', is_active: true },
  { id: 110, name: 'Antonio Luna', barangay_id: 7, barangay_name: 'Camanse', mobile_number: '09237890123', is_active: true },
  { id: 111, name: 'Gabriela Silang', barangay_id: 8, barangay_name: 'Tipan', mobile_number: '09248901234', is_active: false }, // Unverified/Inactive -> excluded per Section 7
  { id: 112, name: 'Nestor Perez', barangay_id: 8, barangay_name: 'Tipan', mobile_number: '09251112233', is_active: true },
];

export function formatTimestampNow(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  let hours = now.getHours();
  const mins = String(now.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${yyyy}-${mm}-${dd} ${String(hours).padStart(2, '0')}:${mins} ${ampm}`;
}

export function formatReadableDateTime(isoStr: string): string {
  if (!isoStr) return '—';
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return isoStr;
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Section 2 Rule:
 * Scheduled, Ongoing, and Completed are set automatically by comparing the current time
 * with the start and end times. Only Cancelled is set by the admin.
 * When marked as restored, is_restored is true and ends_at is set to the restoration time -> Completed.
 */
export function computeAdvisoryStatus(
  advisory: Pick<AdvisoryRecord, 'starts_at' | 'ends_at' | 'is_cancelled' | 'is_restored'>,
  now: Date = new Date()
): AdvisoryStatus {
  if (advisory.is_cancelled) return 'cancelled';
  if (advisory.is_restored) return 'completed';

  const startMs = new Date(advisory.starts_at).getTime();
  const endMs = new Date(advisory.ends_at).getTime();
  const nowMs = now.getTime();

  if (nowMs < startMs) return 'scheduled';
  if (nowMs >= startMs && nowMs < endMs) return 'ongoing';
  return 'completed';
}

/**
 * Section 7 Rule:
 * The advisory SMS contains no personal or account details, so it is the same text for every recipient.
 */
export function buildUniformAdvisorySms(params: {
  type: 'publish' | 'update' | 'cancel' | 'restore' | 'removed_barangay';
  title: string;
  reason: string;
  barangayNames: string[];
  startsAt: string;
  endsAt: string;
  remarks?: string;
}): string {
  const areas = params.barangayNames.join(', ');
  const startTxt = formatReadableDateTime(params.startsAt);
  const endTxt = formatReadableDateTime(params.endsAt);

  if (params.type === 'cancel') {
    return `[SIWASS ADVISORY CANCELLED] ${params.title} for ${areas} (${startTxt}) has been cancelled. Normal water service continues.`;
  }
  if (params.type === 'restore') {
    return `[SIWASS WATER RESTORED] Water supply for ${areas} (${params.title}) has been restored as of ${endTxt}.${params.remarks ? ` Note: ${params.remarks}` : ''}`;
  }
  if (params.type === 'removed_barangay') {
    return `[SIWASS ADVISORY UPDATE] Your barangay is no longer affected by "${params.title}".`;
  }
  const prefix = params.type === 'update' ? '[SIWASS ADVISORY UPDATED]' : '[SIWASS WATER ADVISORY]';
  return `${prefix} ${params.title}: ${params.reason}. Affected: ${areas}. Schedule: ${startTxt} to ${endTxt}.${params.remarks ? ` Remarks: ${params.remarks}` : ''}`;
}

// Compute dynamic dates relative to current clock so there is always 1 Ongoing, 2 Scheduled, 1 Completed, and 1 Cancelled advisory on load
function createInitialAdvisories(): AdvisoryRecord[] {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const todayDay = now.getDate();

  const padDay = (d: number) => String(Math.max(1, Math.min(28, d))).padStart(2, '0');

  const ongoingStart = `${yyyy}-${mm}-${padDay(todayDay)}T06:00`;
  const ongoingEnd = `${yyyy}-${mm}-${padDay(todayDay)}T23:30`;

  const sched1Day = todayDay <= 25 ? todayDay + 2 : 28;
  const sched1Start = `${yyyy}-${mm}-${padDay(sched1Day)}T22:00`;
  const sched1End = `${yyyy}-${mm}-${padDay(sched1Day)}T23:55`;

  const sched2Day = todayDay <= 23 ? todayDay + 4 : 28;
  const sched2Start = `${yyyy}-${mm}-${padDay(sched2Day)}T21:00`;
  const sched2End = `${yyyy}-${mm}-${padDay(sched2Day)}T23:50`;

  const compDay = Math.max(1, todayDay - 4);
  const compStart = `${yyyy}-${mm}-${padDay(compDay)}T07:00`;
  const compEnd = `${yyyy}-${mm}-${padDay(compDay)}T14:00`;

  const cancDay = Math.max(1, todayDay - 2);
  const cancStart = `${yyyy}-${mm}-${padDay(cancDay)}T10:00`;
  const cancEnd = `${yyyy}-${mm}-${padDay(cancDay)}T16:00`;

  return [
    {
      id: 201,
      title: 'Main Feeder Pipe Repair',
      reason: 'Emergency leak repair along National Highway main distribution line',
      barangay_ids: [1, 2],
      barangay_names: ['Poblacion', 'San Isidro Alto'],
      starts_at: ongoingStart,
      ends_at: ongoingEnd,
      remarks: 'Water tanker stationed at Poblacion Public Market.',
      is_cancelled: false,
      is_restored: false,
      affected_customers_count: 5,
      sms_sent_count: 3,
      in_app_only_count: 2,
      sms_text: buildUniformAdvisorySms({
        type: 'publish',
        title: 'Main Feeder Pipe Repair',
        reason: 'Emergency leak repair along National Highway main distribution line',
        barangayNames: ['Poblacion', 'San Isidro Alto'],
        startsAt: ongoingStart,
        endsAt: ongoingEnd,
        remarks: 'Water tanker stationed at Poblacion Public Market.',
      }),
      created_at: `${yyyy}-${mm}-${padDay(todayDay)} 05:45 AM`,
      updated_at: `${yyyy}-${mm}-${padDay(todayDay)} 05:45 AM`,
    },
    {
      id: 202,
      title: 'Valve Replacement',
      reason: 'Scheduled gate valve replacement and pressure testing',
      barangay_ids: [1, 3, 4],
      barangay_names: ['Poblacion', 'Cagay-anon', 'Colupan Bajo'],
      starts_at: sched1Start,
      ends_at: sched1End,
      remarks: 'Store sufficient water ahead of schedule.',
      is_cancelled: false,
      is_restored: false,
      affected_customers_count: 5,
      sms_sent_count: 4,
      in_app_only_count: 1,
      sms_text: buildUniformAdvisorySms({
        type: 'publish',
        title: 'Valve Replacement',
        reason: 'Scheduled gate valve replacement and pressure testing',
        barangayNames: ['Poblacion', 'Cagay-anon', 'Colupan Bajo'],
        startsAt: sched1Start,
        endsAt: sched1End,
        remarks: 'Store sufficient water ahead of schedule.',
      }),
      created_at: `${yyyy}-${mm}-${padDay(todayDay)} 09:00 AM`,
      updated_at: `${yyyy}-${mm}-${padDay(todayDay)} 09:00 AM`,
    },
    {
      id: 203,
      title: 'Reservoir Flushing',
      reason: 'Quarterly reservoir cleaning and chlorination',
      barangay_ids: [5, 6],
      barangay_names: ['Sinonoc', 'Libertad Bajo'],
      starts_at: sched2Start,
      ends_at: sched2End,
      remarks: 'Temporary low pressure after restoration.',
      is_cancelled: false,
      is_restored: false,
      affected_customers_count: 2,
      sms_sent_count: 2,
      in_app_only_count: 0,
      sms_text: buildUniformAdvisorySms({
        type: 'publish',
        title: 'Reservoir Flushing',
        reason: 'Quarterly reservoir cleaning and chlorination',
        barangayNames: ['Sinonoc', 'Libertad Bajo'],
        startsAt: sched2Start,
        endsAt: sched2End,
        remarks: 'Temporary low pressure after restoration.',
      }),
      created_at: `${yyyy}-${mm}-${padDay(todayDay)} 10:15 AM`,
      updated_at: `${yyyy}-${mm}-${padDay(todayDay)} 10:15 AM`,
    },
    {
      id: 204,
      title: 'Pump Station Maintenance',
      reason: 'Booster pump electrical panel servicing',
      barangay_ids: [1, 7],
      barangay_names: ['Poblacion', 'Camanse'],
      starts_at: compStart,
      ends_at: compEnd,
      actual_restored_at: compEnd,
      remarks: 'Alternative tap available at Brgy Hall.',
      restoration_remark: 'Pump servicing completed early; normal pressure restored.',
      is_cancelled: false,
      is_restored: true,
      affected_customers_count: 4,
      sms_sent_count: 3,
      in_app_only_count: 1,
      sms_text: buildUniformAdvisorySms({
        type: 'restore',
        title: 'Pump Station Maintenance',
        reason: 'Booster pump electrical panel servicing',
        barangayNames: ['Poblacion', 'Camanse'],
        startsAt: compStart,
        endsAt: compEnd,
        remarks: 'Pump servicing completed early; normal pressure restored.',
      }),
      created_at: `${yyyy}-${mm}-${padDay(compDay)} 06:30 AM`,
      updated_at: `${yyyy}-${mm}-${padDay(compDay)} 02:00 PM`,
    },
    {
      id: 205,
      title: 'Line Interconnection',
      reason: 'Postponed due to heavy rainfall',
      barangay_ids: [3],
      barangay_names: ['Cagay-anon'],
      starts_at: cancStart,
      ends_at: cancEnd,
      remarks: 'Rescheduled to next month.',
      is_cancelled: true,
      is_restored: false,
      affected_customers_count: 1,
      sms_sent_count: 1,
      in_app_only_count: 0,
      sms_text: buildUniformAdvisorySms({
        type: 'cancel',
        title: 'Line Interconnection',
        reason: 'Postponed due to heavy rainfall',
        barangayNames: ['Cagay-anon'],
        startsAt: cancStart,
        endsAt: cancEnd,
      }),
      created_at: `${yyyy}-${mm}-${padDay(cancDay)} 08:00 AM`,
      updated_at: `${yyyy}-${mm}-${padDay(cancDay)} 09:15 AM`,
    },
  ];
}

function safeRead<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeWrite<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors
  }
}

export const advisoriesStore = {
  getAdvisories(): AdvisoryRecord[] {
    return safeRead<AdvisoryRecord[]>(STORAGE_KEY_ADVISORIES, createInitialAdvisories());
  },

  saveAdvisories(list: AdvisoryRecord[]): void {
    safeWrite(STORAGE_KEY_ADVISORIES, list);
  },

  getAuditLogs(): AdvisoryAuditLogItem[] {
    return safeRead<AdvisoryAuditLogItem[]>(STORAGE_KEY_ADVISORY_LOGS, []);
  },

  appendAuditLog(action: string, adminName = 'Administrator (Admin User)'): AdvisoryAuditLogItem {
    const logs = this.getAuditLogs();
    const entry: AdvisoryAuditLogItem = {
      id: `adv-log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      time: formatTimestampNow(),
      user: adminName,
      role: 'Admin',
      action,
      category: 'assignment',
    };
    safeWrite(STORAGE_KEY_ADVISORY_LOGS, [entry, ...logs]);
    return entry;
  },

  /**
   * Section 3.5, 3.7, 3.8 & Section 7 Rules:
   * - Customers are matched by barangay only, not by street or purok.
   * - Only Active customers are notified.
   * - Preview shows: number of affected customers, how many will receive SMS (have mobile number),
   *   and how many have no mobile number and will receive in-app notification only.
   */
  computeRecipientPreview(
    barangayIds: number[],
    consumers: AdvisoryConsumer[] = DEFAULT_ADVISORY_CONSUMERS,
    draftInfo?: {
      title: string;
      reason: string;
      barangayNames: string[];
      startsAt: string;
      endsAt: string;
      remarks?: string;
    }
  ): AdvisoryRecipientPreview {
    const activeMatched = consumers.filter(
      (c) => c.is_active && barangayIds.includes(c.barangay_id)
    );
    const smsRecipients = activeMatched.filter(
      (c) => Boolean(c.mobile_number && c.mobile_number.trim().length > 0)
    );
    const inAppOnlyRecipients = activeMatched.filter(
      (c) => !c.mobile_number || c.mobile_number.trim().length === 0
    );

    const smsText = draftInfo
      ? buildUniformAdvisorySms({
          type: 'publish',
          title: draftInfo.title || 'Water Interruption',
          reason: draftInfo.reason || 'Service maintenance',
          barangayNames: draftInfo.barangayNames,
          startsAt: draftInfo.startsAt,
          endsAt: draftInfo.endsAt,
          remarks: draftInfo.remarks,
        })
      : '';

    return {
      totalAffected: activeMatched.length,
      smsCount: smsRecipients.length,
      inAppOnlyCount: inAppOnlyRecipients.length,
      smsText,
    };
  },
};
