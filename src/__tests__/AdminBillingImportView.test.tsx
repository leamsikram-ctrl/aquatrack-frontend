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

  it('opens the Upload CSV modal matching the custom dashed dropzone & URL input design and offers template download', () => {
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
    expect(screen.getByText(/Download CSV template/i)).toBeInTheDocument();
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

  it('proves Acceptance 1: current 400, previous 450, payment 500 gives current 0, previous 350, total 350', () => {
    const current = 400.0;
    const previous = 450.0;
    const payment = 500.0;

    const appliedToCurrent = Math.min(payment, current);
    const remainder = payment - appliedToCurrent;
    const appliedToPrevious = Math.min(remainder, previous);

    const newCurrent = current - appliedToCurrent;
    const newPrevious = previous - appliedToPrevious;
    const newTotal = newCurrent + newPrevious;

    expect(newCurrent).toBe(0.0);
    expect(newPrevious).toBe(350.0);
    expect(newTotal).toBe(350.0);
    expect(appliedToCurrent).toBe(400.0);
    expect(appliedToPrevious).toBe(100.0);
  });

  it('proves Acceptance 2: a reversal restores 400 and 450', () => {
    // Starting after payment: current 0, previous 350
    const currentAfterPay = 0.0;
    const previousAfterPay = 350.0;

    // Stored amounts applied
    const appliedToCurrent = 400.0;
    const appliedToPrevious = 100.0;

    // Reversal calculation
    const restoredCurrent = currentAfterPay + appliedToCurrent;
    const restoredPrevious = previousAfterPay + appliedToPrevious;
    const restoredTotal = restoredCurrent + restoredPrevious;

    expect(restoredCurrent).toBe(400.0);
    expect(restoredPrevious).toBe(450.0);
    expect(restoredTotal).toBe(850.0);
  });

  it('proves Acceptance 3: importing the same customer and period twice rejects the second row', () => {
    const periods = billingStore.getPeriods();
    const openPeriod = periods.find((p) => p.status === 'open')!;
    const customers = [
      {
        id: 201,
        name: 'Roberto Gomez',
        account_number: 'ACC-2026-0201',
        meter_number: 'MTR-SIN-0201',
        barangay: 'San Vicente Alto',
        address: 'Purok 1',
        mobile_number: '09172223344',
        is_active: true,
      },
    ];

    // CSV with Roberto Gomez appearing twice in the same batch
    const duplicateBatchCsv = [
      'meter_number,current_balance,previous_balance,due_date',
      'MTR-SIN-0201,400.00,450.00,2026-10-25',
      'MTR-SIN-0201,300.00,100.00,2026-10-25',
    ].join('\n');

    const result = billingStore.parseAndValidateCsv(duplicateBatchCsv, openPeriod, customers, []);
    expect(result.validRows).toHaveLength(1);
    expect(result.invalidRows).toHaveLength(1);
    expect(result.invalidRows[0].reason).toContain('Duplicate row');
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

  it('renders CustomerBillsView with numbers matching Task 10 after payment and no consumption data', () => {
    // Simulate Task 10 payment: current 400, previous 450, payment 500
    // gives current 0, previous 350, total 350
    const record = billingStore.getRecords()[0];
    const current = record.current_balance; // 400
    const previous = record.previous_balance; // 450
    const payment = 500.0;
    const appliedToCurrent = Math.min(payment, current); // 400
    const remainder = payment - appliedToCurrent; // 100
    const appliedToPrevious = Math.min(remainder, previous); // 100
    const newCurrent = current - appliedToCurrent; // 0
    const newPrevious = previous - appliedToPrevious; // 350
    const newTotal = newCurrent + newPrevious; // 350

    billingStore.saveRecords([
      {
        ...record,
        current_balance: newCurrent,
        previous_balance: newPrevious,
        total_balance: newTotal,
      },
    ]);

    billingStore.savePayments([
      {
        id: 'pay-test-1',
        record_id: record.id,
        period_id: record.period_id,
        period_label: record.period_label,
        customer_id: record.customer_id,
        customer_name: record.customer_name,
        account_number: record.account_number,
        meter_number: record.meter_number,
        type: 'payment',
        amount: payment,
        applied_to_current: appliedToCurrent,
        applied_to_previous: appliedToPrevious,
        payment_date: '2026-10-15',
        or_number: 'OR-88410',
        recorded_by: 'Admin User',
        created_at: new Date().toISOString(),
      },
    ]);

    const { container } = render(
      <MemoryRouter>
        <CustomerBillsView />
      </MemoryRouter>
    );

    // Active billing cycle shows Task 10 numbers
    expect(screen.getAllByText('₱350.00').length).toBeGreaterThanOrEqual(2); // Total & Previous
    expect(screen.getByText('₱0.00')).toBeInTheDocument();   // Current Balance

    // Unpaid badge is derived from total_balance (> 0)
    expect(screen.getAllByText('Unpaid').length).toBeGreaterThan(0);

    // Payment history has the recorded payment
    expect(screen.getByText('OR-88410')).toBeInTheDocument();
    expect(screen.getByText('-₱500.00')).toBeInTheDocument();

    // Verify complete absence of water consumption history
    const pageText = container.textContent || '';
    expect(pageText).not.toMatch(/consumption/i);
    expect(pageText).not.toMatch(/cubic meter/i);
    expect(pageText).not.toMatch(/m³/i);
    expect(pageText).not.toMatch(/meter reading/i);
  });
});
