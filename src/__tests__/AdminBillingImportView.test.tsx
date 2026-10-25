import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminUIProvider } from '../contexts/AdminUIContext';
import { AdminBillingImportView } from '../pages/admin/AdminBillingImportView';
import { CustomerBillsView } from '../pages/customer/CustomerBillsView';
import { billingStore } from '../services/billingStore';

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, name: 'Admin User', email: 'admin@sinacaban.gov.ph', role: 'admin' },
    logout: vi.fn(),
  }),
}));

describe('AquaTrack Billing Information Workflow', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders AdminBillingImportView with 4 solid metric compartment cards and 3 tabs', () => {
    render(
      <MemoryRouter>
        <AdminUIProvider>
          <AdminBillingImportView />
        </AdminUIProvider>
      </MemoryRouter>
    );

    expect(screen.getAllByText('Billing').length).toBeGreaterThan(0);
    expect(screen.getByText('Open Period')).toBeInTheDocument();
    expect(screen.getByText('Total Receivable')).toBeInTheDocument();
    expect(screen.getByText('Payments Recorded')).toBeInTheDocument();
    expect(screen.getByText('Notices Sent')).toBeInTheDocument();

    expect(screen.getByRole('button', { name: /Customer Balances/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Billing Periods/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Payment History/i })).toBeInTheDocument();
  });

  it('opens the Upload CSV modal matching the custom dashed dropzone & URL input design', () => {
    render(
      <MemoryRouter>
        <AdminUIProvider>
          <AdminBillingImportView />
        </AdminUIProvider>
      </MemoryRouter>
    );

    const uploadBtn = screen.getByRole('button', { name: /Upload CSV/i });
    fireEvent.click(uploadBtn);

    expect(screen.getByText('Select a CSV file to upload')).toBeInTheDocument();
    expect(screen.getByText('or drag and drop it here')).toBeInTheDocument();
    expect(screen.getByText('Or upload from a URL')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Add file URL')).toBeInTheDocument();
  });

  it('validates CSV rows according to Section 3 rules (active customer, required fields, no duplicate period record)', () => {
    const periods = billingStore.getPeriods();
    const openPeriod = periods.find((p) => p.status === 'open')!;
    const existingRecords = billingStore.getRecords();

    const csvText = [
      'meter_number,current_balance,previous_balance,due_date',
      'MTR-SIN-0006,385.00,120.00,2026-10-25', // Valid (Lorna Tolentino, active, not yet in Oct 2026)
      'MTR-SIN-0008,250.00,0.00,2026-10-25',   // Invalid (Gabriela Silang is unverified/inactive)
      'MTR-SIN-0001,400.00,100.00,2026-10-25', // Invalid (Maria Santos already has Oct 2026 record)
      'MTR-SIN-9999,300.00,0.00,2026-10-25',   // Invalid (Unknown meter)
    ].join('\n');

    const testCustomers = [
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
      {
        id: 102,
        name: 'Lorna Tolentino',
        account_number: 'ACC-2026-0006',
        meter_number: 'MTR-SIN-0006',
        barangay: 'San Vicente Alto',
        address: 'Purok 1, San Vicente Alto',
        mobile_number: '09181112233',
        is_active: true,
      },
      {
        id: 103,
        name: 'Gabriela Silang',
        account_number: 'ACC-2026-0008',
        meter_number: 'MTR-SIN-0008',
        barangay: 'Sinacaban Poblacion',
        address: 'Purok 4, Sinacaban',
        mobile_number: '09184445566',
        is_active: false,
      },
    ];

    const { validRows, invalidRows } = billingStore.parseAndValidateCsv(
      csvText,
      openPeriod,
      testCustomers,
      existingRecords
    );

    expect(validRows).toHaveLength(1);
    expect(validRows[0].customer_name).toBe('Lorna Tolentino');
    expect(validRows[0].total_balance).toBe(505.0);

    expect(invalidRows).toHaveLength(3);
  });

  it('renders CustomerBillsView with account details, current/previous/total balance, payment history, and earlier periods', () => {
    render(
      <MemoryRouter>
        <CustomerBillsView />
      </MemoryRouter>
    );

    expect(screen.getByText('Customer Account Details')).toBeInTheDocument();
    expect(screen.getByText('Total Balance Due')).toBeInTheDocument();
    expect(screen.getByText('Payment History')).toBeInTheDocument();
    expect(screen.getByText('Earlier Billing Periods')).toBeInTheDocument();
  });
});
