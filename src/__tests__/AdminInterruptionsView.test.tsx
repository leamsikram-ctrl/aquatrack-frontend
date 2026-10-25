import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminUIProvider } from '../contexts/AdminUIContext';
import { AdminInterruptionsView } from '../pages/admin/AdminInterruptionsView';
import { CustomerAdvisoriesView } from '../pages/customer/CustomerAdvisoriesView';
import {
  advisoriesStore,
  computeAdvisoryStatus,
  DEFAULT_ADVISORY_CONSUMERS,
} from '../services/advisoriesStore';

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, name: 'Admin User', email: 'admin@sinacaban.gov.ph', role: 'admin' },
    logout: vi.fn(),
  }),
}));

describe('AquaTrack Water Advisories Workflow', () => {
  beforeEach(() => {
    localStorage.clear();
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

    // Left sidebar elements matching the calendar reference image
    expect(screen.getByRole('button', { name: /Add Advisory/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search for Barangay')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /All Schedule/i })).toBeInTheDocument();

    // Top-right view mode pills (only Month & List; Day and Week removed)
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

  it('opens Add Advisory modal and renders CustomerAdvisoriesView with calendar and history', () => {
    render(
      <MemoryRouter>
        <AdminUIProvider>
          <AdminInterruptionsView />
        </AdminUIProvider>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /Add Advisory/i }));
    expect(screen.getByPlaceholderText('e.g. Main Feeder Pipe Repair')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Preview Recipients/i })).toBeInTheDocument();

    render(
      <MemoryRouter>
        <CustomerAdvisoriesView />
      </MemoryRouter>
    );

    expect(screen.getByText(/Advisory History/i)).toBeInTheDocument();
  });
});

