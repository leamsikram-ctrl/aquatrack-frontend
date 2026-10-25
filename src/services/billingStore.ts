export interface BillingPeriod {
  id: string;
  month: number; // 1 - 12
  year: number; // e.g. 2026
  label: string; // e.g. "October 2026"
  due_date: string; // YYYY-MM-DD
  status: 'open' | 'closed';
  records_count: number;
  notices_sent: number;
  created_at: string;
  updated_at: string;
}

export interface BillingPaymentEntry {
  id: string;
  record_id: string;
  period_id: string;
  period_label: string;
  customer_id: number;
  customer_name: string;
  account_number: string;
  meter_number: string;
  type: 'payment' | 'reversal';
  amount: number;
  applied_to_current: number;
  applied_to_previous: number;
  payment_date: string;
  or_number?: string;
  remark?: string;
  recorded_by: string;
  created_at: string;
  is_reversed?: boolean;
  reversed_by_entry_id?: string;
  reverses_entry_id?: string;
}

export interface CustomerBalanceRecord {
  id: string;
  period_id: string;
  period_label: string;
  customer_id: number;
  customer_name: string;
  account_number: string;
  meter_number: string;
  barangay: string;
  address: string;
  mobile_number: string;
  is_active_customer: boolean;
  original_current_balance: number;
  original_previous_balance: number;
  current_balance: number;
  previous_balance: number;
  total_balance: number; // current_balance + previous_balance
  due_date: string;
  notice_sent: boolean;
  sms_notice_preview?: string;
  last_updated: string;
}

export interface CsvPreviewValidRow {
  row_number: number;
  meter_number: string;
  customer_id: number;
  customer_name: string;
  account_number: string;
  barangay: string;
  address: string;
  mobile_number: string;
  current_balance: number;
  previous_balance: number;
  total_balance: number;
  due_date: string;
}

export interface CsvPreviewInvalidRow {
  row_number: number;
  raw_meter_number: string;
  reason: string;
}

export interface BillingAuditLogItem {
  id: string;
  time: string;
  user: string;
  role: string;
  action: string;
  category: 'billing';
}

export interface RegisteredDirectoryCustomer {
  id: number;
  name: string;
  account_number: string;
  meter_number: string;
  barangay: string;
  address: string;
  mobile_number: string;
  is_active: boolean; // Active & Verified
}

const STORAGE_KEY_PERIODS = 'aquatrack_billing_periods_v2';
const STORAGE_KEY_RECORDS = 'aquatrack_billing_records_v2';
const STORAGE_KEY_PAYMENTS = 'aquatrack_billing_payments_v2';
const STORAGE_KEY_AUDIT = 'aquatrack_billing_audit_v2';

export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function formatPeriodLabel(month: number, year: number): string {
  const mName = MONTH_NAMES[Math.max(0, Math.min(11, month - 1))];
  return `${mName} ${year}`;
}

export function formatNowTimestamp(): string {
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

// Baseline Sinacaban Consumer Directory (fallback for offline demo)
export const DEFAULT_SINACABAN_CUSTOMERS: RegisteredDirectoryCustomer[] = [
  {
    id: 101,
    name: 'Maria Santos',
    account_number: 'ACC-2026-0001',
    meter_number: 'MTR-SIN-0001',
    barangay: 'Poblacion',
    address: 'Purok 2, Near Public Market, Poblacion',
    mobile_number: '09171234567',
    is_active: true,
  },
];

const INITIAL_PERIODS: BillingPeriod[] = [
  {
    id: 'period-2026-10',
    month: 10,
    year: 2026,
    label: 'October 2026',
    due_date: '2026-10-25',
    status: 'open',
    records_count: 1,
    notices_sent: 1,
    created_at: '2026-10-01 08:30 AM',
    updated_at: '2026-10-06 02:10 PM',
  },
];

const INITIAL_RECORDS: CustomerBalanceRecord[] = [
  // October 2026 (Open Period) - Maria Santos Demo Account
  {
    id: 'rec-2026-10-101',
    period_id: 'period-2026-10',
    period_label: 'October 2026',
    customer_id: 101,
    customer_name: 'Maria Santos',
    account_number: 'ACC-2026-0001',
    meter_number: 'MTR-SIN-0001',
    barangay: 'Poblacion',
    address: 'Purok 2, Near Public Market, Poblacion',
    mobile_number: '09171234567',
    is_active_customer: true,
    original_current_balance: 400.0,
    original_previous_balance: 450.0,
    current_balance: 400.0,
    previous_balance: 450.0,
    total_balance: 850.0,
    due_date: '2026-10-25',
    notice_sent: true,
    sms_notice_preview:
      'SIWASS Billing Notice (October 2026): Current Balance: PHP 400.00, Previous Balance: PHP 450.00, Total Balance: PHP 850.00. Due Date: 2026-10-25.',
    last_updated: '2026-10-06 02:10 PM',
  },
];

const INITIAL_PAYMENTS: BillingPaymentEntry[] = [];

const INITIAL_AUDIT_LOGS: BillingAuditLogItem[] = [
  {
    id: 'bill-log-1',
    time: '2026-10-06 02:10 PM',
    user: 'Administrator (Admin User)',
    role: 'Admin',
    action:
      'Imported billing record into Open Period October 2026 and dispatched SMS & in-app notice',
    category: 'billing',
  },
];

function safeReadJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeWriteJson<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors
  }
}

export const billingStore = {
  getPeriods(): BillingPeriod[] {
    return safeReadJson<BillingPeriod[]>(STORAGE_KEY_PERIODS, INITIAL_PERIODS);
  },

  savePeriods(periods: BillingPeriod[]): void {
    safeWriteJson(STORAGE_KEY_PERIODS, periods);
  },

  getRecords(): CustomerBalanceRecord[] {
    const records = safeReadJson<CustomerBalanceRecord[]>(STORAGE_KEY_RECORDS, INITIAL_RECORDS);
    if (Array.isArray(records) && records.length > 0) {
      const cleaned = records.filter(
        (r) => r.customer_id === 101 || r.customer_name?.toLowerCase().includes('maria') || r.customer_id > 1000
      );
      return cleaned.length > 0 ? cleaned : INITIAL_RECORDS;
    }
    return INITIAL_RECORDS;
  },

  saveRecords(records: CustomerBalanceRecord[]): void {
    safeWriteJson(STORAGE_KEY_RECORDS, records);
  },

  getPayments(): BillingPaymentEntry[] {
    return safeReadJson<BillingPaymentEntry[]>(STORAGE_KEY_PAYMENTS, INITIAL_PAYMENTS);
  },

  savePayments(payments: BillingPaymentEntry[]): void {
    safeWriteJson(STORAGE_KEY_PAYMENTS, payments);
  },

  getAuditLogs(): BillingAuditLogItem[] {
    return safeReadJson<BillingAuditLogItem[]>(STORAGE_KEY_AUDIT, INITIAL_AUDIT_LOGS);
  },

  appendAuditLog(action: string, adminName = 'Administrator (Admin User)'): BillingAuditLogItem {
    const logs = this.getAuditLogs();
    const entry: BillingAuditLogItem = {
      id: `bill-log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      time: formatNowTimestamp(),
      user: adminName,
      role: 'Admin',
      action,
      category: 'billing',
    };
    const updated = [entry, ...logs];
    safeWriteJson(STORAGE_KEY_AUDIT, updated);
    return entry;
  },

  /**
   * Parse and validate CSV content according to Section 3 of the PDF:
   * - Columns: meter_number, current_balance, previous_balance, due_date (optional, defaults to period's due date)
   * - Validates:
   *   1. Required fields are filled
   *   2. Numeric and date formats are valid
   *   3. Meter belongs to a verified (Active) customer
   *   4. No record exists yet for that customer in that period
   */
  parseAndValidateCsv(
    csvText: string,
    openPeriod: BillingPeriod,
    customers: RegisteredDirectoryCustomer[],
    existingRecords: CustomerBalanceRecord[]
  ): {
    validRows: CsvPreviewValidRow[];
    invalidRows: CsvPreviewInvalidRow[];
  } {
    const lines = csvText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) {
      return {
        validRows: [],
        invalidRows: [{ row_number: 1, raw_meter_number: '—', reason: 'CSV file is empty.' }],
      };
    }

    const rawHeader = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/^["']|["']$/g, ''));

    // Support standard headers from PDF: meter_number, current_balance, previous_balance, due_date
    const meterIdx = rawHeader.findIndex((h) => h === 'meter_number' || h === 'meter' || h === 'meter_no');
    const currIdx = rawHeader.findIndex(
      (h) => h === 'current_balance' || h === 'current' || h === 'amount_due' || h === 'amount_paid'
    );
    const prevIdx = rawHeader.findIndex((h) => h === 'previous_balance' || h === 'previous');
    const dueIdx = rawHeader.findIndex((h) => h === 'due_date' || h === 'duedate');

    if (meterIdx === -1 || currIdx === -1 || prevIdx === -1) {
      return {
        validRows: [],
        invalidRows: [
          {
            row_number: 1,
            raw_meter_number: 'Header Error',
            reason:
              'Missing required CSV headers. Expected: meter_number, current_balance, previous_balance, due_date (optional).',
          },
        ],
      };
    }

    const validRows: CsvPreviewValidRow[] = [];
    const invalidRows: CsvPreviewInvalidRow[] = [];
    const seenCustomerIdsInBatch = new Set<number>();

    for (let i = 1; i < lines.length; i++) {
      const rowNum = i + 1;
      const cols = lines[i].split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));

      const meterNo = cols[meterIdx] || '';
      const currStr = cols[currIdx] ?? '';
      const prevStr = cols[prevIdx] ?? '';
      const dueStr = dueIdx !== -1 && cols[dueIdx] ? cols[dueIdx] : openPeriod.due_date;

      // 1. Check required fields
      if (!meterNo || currStr === '' || prevStr === '') {
        invalidRows.push({
          row_number: rowNum,
          raw_meter_number: meterNo || '(Missing Meter #)',
          reason: 'Required field missing (meter_number, current_balance, and previous_balance are required).',
        });
        continue;
      }

      // 2. Check numeric formats
      const currVal = Number(currStr);
      const prevVal = Number(prevStr);
      if (isNaN(currVal) || currVal < 0 || isNaN(prevVal) || prevVal < 0) {
        invalidRows.push({
          row_number: rowNum,
          raw_meter_number: meterNo,
          reason: `Invalid balance format (current_balance="${currStr}", previous_balance="${prevStr}"). Must be non-negative numbers.`,
        });
        continue;
      }

      // Check date format if provided
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dueStr) && isNaN(Date.parse(dueStr))) {
        invalidRows.push({
          row_number: rowNum,
          raw_meter_number: meterNo,
          reason: `Invalid due_date format "${dueStr}". Expected YYYY-MM-DD.`,
        });
        continue;
      }

      // 3. Check meter belongs to a verified (Active) customer
      const matchedCustomer = customers.find(
        (c) => c.meter_number.toLowerCase() === meterNo.toLowerCase()
      );

      if (!matchedCustomer) {
        invalidRows.push({
          row_number: rowNum,
          raw_meter_number: meterNo,
          reason: `Meter "${meterNo}" is not registered to any customer in the Sinacaban directory.`,
        });
        continue;
      }

      if (!matchedCustomer.is_active) {
        invalidRows.push({
          row_number: rowNum,
          raw_meter_number: meterNo,
          reason: `Meter "${meterNo}" belongs to ${matchedCustomer.name}, whose account is not yet Verified (Active).`,
        });
        continue;
      }

      // 4. Check no record exists yet for that customer in that period (or duplicate in CSV)
      const alreadyExistsInPeriod = existingRecords.some(
        (r) =>
          r.period_id === openPeriod.id &&
          (r.customer_id === matchedCustomer.id ||
            r.meter_number.toLowerCase() === meterNo.toLowerCase())
      );

      if (alreadyExistsInPeriod) {
        invalidRows.push({
          row_number: rowNum,
          raw_meter_number: meterNo,
          reason: `Customer ${matchedCustomer.name} (${matchedCustomer.account_number}) already has a balance record in ${openPeriod.label}.`,
        });
        continue;
      }

      if (seenCustomerIdsInBatch.has(matchedCustomer.id)) {
        invalidRows.push({
          row_number: rowNum,
          raw_meter_number: meterNo,
          reason: `Duplicate row for meter "${meterNo}" (${matchedCustomer.name}) within the same CSV file.`,
        });
        continue;
      }

      seenCustomerIdsInBatch.add(matchedCustomer.id);

      const cleanCurr = Number(currVal.toFixed(2));
      const cleanPrev = Number(prevVal.toFixed(2));
      const totalBal = Number((cleanCurr + cleanPrev).toFixed(2));

      validRows.push({
        row_number: rowNum,
        meter_number: matchedCustomer.meter_number,
        customer_id: matchedCustomer.id,
        customer_name: matchedCustomer.name,
        account_number: matchedCustomer.account_number,
        barangay: matchedCustomer.barangay,
        address: matchedCustomer.address,
        mobile_number: matchedCustomer.mobile_number,
        current_balance: cleanCurr,
        previous_balance: cleanPrev,
        total_balance: totalBal,
        due_date: dueStr,
      });
    }

    return { validRows, invalidRows };
  },
};

