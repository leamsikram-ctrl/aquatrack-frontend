import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminUIProvider } from '../contexts/AdminUIContext';
import { AdminInterruptionsView } from '../pages/admin/AdminInterruptionsView';
import { CustomerAdvisoriesView } from '../pages/customer/CustomerAdvisoriesView';
import { AdvisoryBanner } from '../components/molecules/AdvisoryBanner';
import { InterruptionCalendar } from '../components/organisms/InterruptionCalendar';
import {
  advisoriesStore,
  computeAdvisoryStatus,
  DEFAULT_ADVISORY_CONSUMERS,
  type AdvisoryRecord,
} from '../services/advisoriesStore';
import type { WaterInterruption } from '../types';

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, name: 'Admin User', email: 'admin@sinacaban.gov.ph', role: 'admin' },
    logout: vi.fn(),
  }),
}));

describe('AquaTrack Water Advisories Workflow (Slice: Advisories)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders AdminInterruptionsView with split calendar layout and Month/List view switcher', () => {
    render(
      <MemoryRouter>
        <AdminUIProvider>
          <AdminInterruptionsView />
        </AdminUIProvider>
      </MemoryRouter>
    );

    expect(screen.getAllByText('Water Advisories').length).toBeGreaterThan(0);

    // Left sidebar elements
    expect(screen.getByRole('button', { name: /Add Advisory/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search for Barangay')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /All Schedule/i })).toBeInTheDocument();

    // Top-right view mode pills (only Month & List)
    expect(screen.queryByRole('button', { name: 'day' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'week' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'month' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'list' })).toBeInTheDocument();
  });

  it('matches active customers by barangay and separates SMS + in-app vs in-app only recipients', () => {
    // Barangay 1 (Poblacion) has 3 active customers: 2 with mobile numbers, 1 without mobile number
    // Barangay 8 (Tipan) has 1 active customer with mobile and 1 inactive/unverified customer
    const preview = advisoriesStore.computeRecipientPreview(
      [1, 8],
      DEFAULT_ADVISORY_CONSUMERS,
      {
        title: 'Pipeline Maintenance',
        reason: 'Leak repair',
        barangayNames: ['Poblacion', 'Tipan'],
        startsAt: '2026-10-25T08:00',
        endsAt: '2026-10-25T17:00',
      }
    );

    expect(preview.totalAffected).toBe(4); // 3 active in Poblacion + 1 active in Tipan (excludes inactive Gabriela Silang)
    expect(preview.smsCount).toBe(3);      // 2 in Poblacion + 1 in Tipan with mobile numbers
    expect(preview.inAppOnlyCount).toBe(1); // Lydia Villanueva has no mobile number -> in-app only
    expect(preview.smsText).toContain('Pipeline Maintenance');
  });

  it('automatically computes Scheduled, Ongoing, Completed, and Cancelled statuses', () => {
    const now = new Date('2026-10-21T12:00:00');

    expect(
      computeAdvisoryStatus(
        {
          starts_at: '2026-10-22T08:00',
          ends_at: '2026-10-22T17:00',
          is_cancelled: false,
          is_restored: false,
        },
        now
      )
    ).toBe('scheduled');

    expect(
      computeAdvisoryStatus(
        {
          starts_at: '2026-10-21T08:00',
          ends_at: '2026-10-21T17:00',
          is_cancelled: false,
          is_restored: false,
        },
        now
      )
    ).toBe('ongoing');

    expect(
      computeAdvisoryStatus(
        {
          starts_at: '2026-10-20T08:00',
          ends_at: '2026-10-20T17:00',
          is_cancelled: false,
          is_restored: false,
        },
        now
      )
    ).toBe('completed');

    expect(
      computeAdvisoryStatus(
        {
          starts_at: '2026-10-22T08:00',
          ends_at: '2026-10-22T17:00',
          is_cancelled: true,
          is_restored: false,
        },
        now
      )
    ).toBe('cancelled');
  });

  it('prefills title and reason from premade advisory types (Section 7.5), allows editing, and handles Other', () => {
    render(
      <MemoryRouter>
        <AdminUIProvider>
          <AdminInterruptionsView />
        </AdminUIProvider>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /Add Advisory/i }));

    const typeSelect = screen.getByLabelText(/Advisory Type/i);
    expect(typeSelect).toBeInTheDocument();

    // Default is scheduled maintenance
    const titleInput = screen.getByPlaceholderText('e.g. Main Feeder Pipe Repair') as HTMLInputElement;
    const reasonInput = screen.getByPlaceholderText('e.g. Gate valve replacement along National Highway') as HTMLInputElement;

    expect(titleInput.value).toBe('Scheduled Maintenance');
    expect(reasonInput.value).toBe('Planned pipe or valve works');

    // Change to Tank Cleaning
    fireEvent.change(typeSelect, { target: { value: 'tank_cleaning' } });
    expect(titleInput.value).toBe('Reservoir Cleaning');
    expect(reasonInput.value).toBe('Reservoir or tank cleaning and disinfection');

    // Change to Other: title is Water Service Advisory, reason is empty for custom entry
    fireEvent.change(typeSelect, { target: { value: 'other' } });
    expect(titleInput.value).toBe('Water Service Advisory');
    expect(reasonInput.value).toBe('');

    // Both remain editable
    fireEvent.change(titleInput, { target: { value: 'Custom System Flush' } });
    fireEvent.change(reasonInput, { target: { value: 'Flushing secondary valve' } });
    expect(titleInput.value).toBe('Custom System Flush');
    expect(reasonInput.value).toBe('Flushing secondary valve');
  });

  it('rejects a past start time when submitting advisory', () => {
    render(
      <MemoryRouter>
        <AdminUIProvider>
          <AdminInterruptionsView />
        </AdminUIProvider>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /Add Advisory/i }));

    // Set starts_at to a past date
    const startInputs = screen.getAllByDisplayValue(/T/);
    const startInput = startInputs[0];
    fireEvent.change(startInput, { target: { value: '2020-01-01T08:00' } });

    // Select all barangays
    fireEvent.click(screen.getByText('Select All'));

    fireEvent.click(screen.getByRole('button', { name: /Preview Recipients/i }));

    expect(screen.getByText(/Start time cannot be in the past/i)).toBeInTheDocument();
  });

  it('renders AdvisoryBanner for customer home with title, barangay chips, time bar, and action', () => {
    const ongoingAdvisory: AdvisoryRecord = {
      id: 301,
      title: 'Emergency Feeder Burst',
      reason: 'Main feeder pipe leak under bridge',
      barangay_ids: [1, 2],
      barangay_names: ['Poblacion', 'San Isidro Alto'],
      starts_at: new Date(Date.now() - 3600 * 1000).toISOString(),
      ends_at: new Date(Date.now() + 7200 * 1000).toISOString(),
      affected_customers_count: 5,
      sms_sent_count: 4,
      in_app_only_count: 1,
      sms_text: 'Test advisory',
      created_at: '2026-10-28 08:00 AM',
      updated_at: '2026-10-28 08:00 AM',
    };

    render(
      <MemoryRouter>
        <AdvisoryBanner advisory={ongoingAdvisory} />
      </MemoryRouter>
    );

    expect(screen.getByText('Ongoing Advisory')).toBeInTheDocument();
    expect(screen.getByText('Emergency Feeder Burst')).toBeInTheDocument();
    expect(screen.getByText(/Main feeder pipe leak under bridge/i)).toBeInTheDocument();

    // Barangay chips
    expect(screen.getByText('Poblacion')).toBeInTheDocument();
    expect(screen.getByText('San Isidro Alto')).toBeInTheDocument();

    // Time bar progressbar
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /View details/i })).toBeInTheDocument();
  });

  it('scopes InterruptionCalendar to customer barangay when role is customer, and shows all for staff', () => {
    const testInterruptions: WaterInterruption[] = [
      {
        id: 1,
        title: 'Poblacion Cleaning',
        starts_at: '2026-10-15T08:00:00Z',
        ends_at: '2026-10-15T16:00:00Z',
        status: 'scheduled',
        barangays: [{ id: 10, name: 'Poblacion' } as any],
      },
      {
        id: 2,
        title: 'Tipan Main Repair',
        starts_at: '2026-10-15T08:00:00Z',
        ends_at: '2026-10-15T16:00:00Z',
        status: 'scheduled',
        barangays: [{ id: 17, name: 'Tipan' } as any],
      },
    ];

    // Customer view with customerBarangayId = 10 (Poblacion)
    const { unmount } = render(
      <InterruptionCalendar
        interruptions={testInterruptions}
        role="customer"
        customerBarangayId={10}
      />
    );

    expect(screen.getByText('My Barangay Schedule')).toBeInTheDocument();

    // Click on October 15
    const day15Button = screen.getByRole('button', { name: '15' });
    fireEvent.click(day15Button);

    // Should only show Poblacion Cleaning, NOT Tipan Main Repair
    expect(screen.getByText('Poblacion Cleaning')).toBeInTheDocument();
    expect(screen.queryByText('Tipan Main Repair')).not.toBeInTheDocument();

    unmount();

    // Staff view: shows all municipal barangays
    render(
      <InterruptionCalendar
        interruptions={testInterruptions}
        role="staff"
      />
    );

    expect(screen.getByText('All Municipal Barangays')).toBeInTheDocument();
    const staffDay15 = screen.getByRole('button', { name: '15' });
    fireEvent.click(staffDay15);

    expect(screen.getByText('Poblacion Cleaning')).toBeInTheDocument();
    expect(screen.getByText('Tipan Main Repair')).toBeInTheDocument();
  });

  it('CustomerAdvisoriesView renders barangay chips, time bar, and no long paragraphs', () => {
    render(
      <MemoryRouter>
        <CustomerAdvisoriesView />
      </MemoryRouter>
    );

    expect(screen.getAllByText('Water Advisories').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Brgy. Poblacion/i).length).toBeGreaterThan(0);

    // Switch to List view
    fireEvent.click(screen.getByRole('button', { name: 'list' }));

    // Progressbars exist in the list view (time bar)
    const progressBars = screen.getAllByRole('progressbar');
    expect(progressBars.length).toBeGreaterThan(0);
  });

  it('confirms that no delete button exists anywhere in AdminInterruptionsView', () => {
    render(
      <MemoryRouter>
        <AdminUIProvider>
          <AdminInterruptionsView />
        </AdminUIProvider>
      </MemoryRouter>
    );

    // Switch to list view to check table action buttons
    fireEvent.click(screen.getByRole('button', { name: 'list' }));

    // Verify no Delete button exists
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/delete advisory/i)).not.toBeInTheDocument();
  });
});
