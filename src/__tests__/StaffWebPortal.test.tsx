import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { StaffTasksView } from '../pages/staff/StaffTasksView';
import { StaffScannerView } from '../pages/staff/StaffScannerView';
import { StaffProfileView } from '../pages/staff/StaffProfileView';
import { StaffLayout } from '../components/templates/StaffLayout';
import { BottomNav } from '../components/organisms/BottomNav';
import { DownloadMobileAppCard } from '../components/molecules/DownloadMobileAppCard';
import { requestsApi } from '../api';
import type { ServiceRequest } from '../types';

// Mock AuthContext
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 2,
      role: 'staff',
      name: 'Field Technician',
      email: 'staff@siwass.gov',
      status: 'active',
      mobile_number: '09175550101',
    },
    setUser: vi.fn(),
    logout: vi.fn(),
  }),
}));

// Mock APIs
vi.mock('../api', () => ({
  requestsApi: {
    list: vi.fn(),
    start: vi.fn(),
    resolve: vi.fn(),
  },
  interruptionsApi: {
    list: vi.fn().mockResolvedValue([]),
  },
  metersApi: {
    lookupByNumber: vi.fn(),
    lookupByQr: vi.fn(),
    offlineSync: vi.fn(),
  },
  authApi: {
    me: vi.fn().mockResolvedValue({
      id: 2,
      role: 'staff',
      name: 'Field Technician',
      email: 'staff@siwass.gov',
      status: 'active',
      mobile_number: '09175550101',
    }),
    changePassword: vi.fn(),
  },
  profileApi: {},
}));

const mockAssignedTask: ServiceRequest = {
  id: 101,
  reference: 'AT-0101',
  reference_no: 'AT-0101',
  description: 'Major leak in front of town hall',
  issue_type_id: 2,
  issue_type: { id: 2, name: 'Pipe leak or burst', default_urgency: 'high' },
  status: 'assigned',
  urgency: 'high',
  customer_urgency: 'high',
  customer_profile_id: 10,
  customer: {
    id: 10,
    full_name: 'Maria Santos',
    account_number: 'ACC-SIN-0010',
    barangay: 'Poblacion',
    address: 'Poblacion Central',
  },
  assigned_staff_id: 2,
  created_at: '2026-10-20T08:00:00Z',
  updated_at: '2026-10-20T08:30:00Z',
  assigned_at: '2026-10-20T08:30:00Z',
};

const mockInProgressTask: ServiceRequest = {
  ...mockAssignedTask,
  id: 102,
  reference_no: 'AT-0102',
  status: 'in_progress',
  started_at: '2026-10-20T09:00:00Z',
};

describe('Staff Web Portal Slice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Download Mobile App Card', () => {
    it('renders in disabled state with "Coming soon" button', () => {
      render(<DownloadMobileAppCard />);

      // Title up to 3 words
      expect(screen.getByText('Download Mobile App')).toBeInTheDocument();

      // Exactly one helper line description
      expect(
        screen.getByText(/Identify meters and scan QR tags on-site with the Android scanner app/i)
      ).toBeInTheDocument();

      // Link button is disabled with "Coming soon"
      const comingSoonBtn = screen.getByRole('button', { name: /coming soon/i });
      expect(comingSoonBtn).toBeInTheDocument();
      expect(comingSoonBtn).toBeDisabled();
      expect(comingSoonBtn).toHaveAttribute('aria-disabled', 'true');

      // Android requirement note
      expect(screen.getByText(/Android 10 or later/i)).toBeInTheDocument();

      // Touch target is at least 44px
      expect(comingSoonBtn.className).toContain('min-h-[44px]');
    });
  });

  describe('Moving Scanner and Offline Lookup Out of Web Portal', () => {
    it('StaffScannerView only shows download card and no scanning/simulator/dial readings', () => {
      render(
        <MemoryRouter>
          <StaffScannerView />
        </MemoryRouter>
      );

      // Shows Download Mobile App card in disabled state
      expect(screen.getByText('Download Mobile App')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /coming soon/i })).toBeDisabled();

      // Scanner inputs and simulator elements do not exist
      expect(screen.queryByPlaceholderText(/MTR-TOKEN/i)).not.toBeInTheDocument();
      expect(screen.queryByPlaceholderText(/MTR-SIN/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Interactive Simulator/i)).not.toBeInTheDocument();
      expect(screen.queryByPlaceholderText(/Physical dial reading/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Save Audit Note/i)).not.toBeInTheDocument();
    });

    it('StaffProfileView has no offline lookup cache or sync button', async () => {
      render(
        <MemoryRouter>
          <StaffProfileView />
        </MemoryRouter>
      );

      // Verify "Offline Meter Data Cache" and "Sync now" are completely removed
      expect(screen.queryByText(/Offline Meter Data Cache/i)).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /sync now/i })).not.toBeInTheDocument();
    });

    it('StaffLayout navigation does not include Scan Meter', () => {
      const { container } = render(
        <MemoryRouter>
          <StaffLayout>
            <div>Content</div>
          </StaffLayout>
        </MemoryRouter>
      );

      // Check desktop sidebar items
      const aside = container.querySelector('aside');
      expect(aside).toBeInTheDocument();
      expect(aside?.textContent).not.toContain('Scan Meter');
      expect(aside?.textContent).toContain('Tasks');
      expect(aside?.textContent).toContain('History');
      expect(aside?.textContent).toContain('Profile');
    });

    it('BottomNav staff navigation does not include Scan Meter', () => {
      render(
        <MemoryRouter>
          <BottomNav variant="staff" currentPath="/staff/tasks" />
        </MemoryRouter>
      );

      expect(screen.queryByText('Scan Meter')).not.toBeInTheDocument();
      expect(screen.getByText('Tasks')).toBeInTheDocument();
      expect(screen.getByText('History')).toBeInTheDocument();
      expect(screen.getByText('Profile')).toBeInTheDocument();
    });
  });

  describe('Mobile Layout at 414px & Touch Targets', () => {
    it('StaffLayout has overflow-x-hidden and min-w-0 to prevent horizontal clipping', () => {
      const { container } = render(
        <MemoryRouter>
          <StaffLayout>
            <div>Staff Content</div>
          </StaffLayout>
        </MemoryRouter>
      );

      const root = container.firstChild as HTMLElement;
      expect(root.className).toContain('overflow-x-hidden');
      expect(root.className).toContain('max-w-full');

      const main = container.querySelector('main');
      expect(main?.className).toContain('overflow-x-hidden');
      expect(main?.className).toContain('min-w-0');
    });

    it('StaffTasksView controls and filter icons have visible text labels and >= 44px touch targets', async () => {
      vi.mocked(requestsApi.list).mockResolvedValue({
        data: [mockAssignedTask],
        total: 1,
        page: 1,
        per_page: 50,
      } as any);

      render(
        <MemoryRouter>
          <StaffTasksView />
        </MemoryRouter>
      );

      // Filter icons have text labels: Map and Calendar
      const mapBtn = screen.getByRole('button', { name: /assigned area map/i });
      expect(mapBtn).toBeInTheDocument();
      expect(mapBtn).toHaveTextContent('Map');
      expect(mapBtn.className).toContain('min-h-[44px]');

      const calBtn = screen.getByRole('button', { name: /interruptions calendar/i });
      expect(calBtn).toBeInTheDocument();
      expect(calBtn).toHaveTextContent('Calendar');
      expect(calBtn.className).toContain('min-h-[44px]');

      // Switcher tabs have min-h-[44px]
      const activeTab = screen.getByRole('button', { name: 'Active' });
      const historyTabs = screen.getAllByRole('button', { name: 'History' });
      const switcherHistoryTab = historyTabs.find((b) => b.className.includes('rounded'));
      expect(activeTab.className).toContain('min-h-[44px]');
      expect(switcherHistoryTab?.className).toContain('min-h-[44px]');

      // Select dropdowns have min-h-[44px]
      const selects = screen.getAllByRole('combobox');
      expect(selects.length).toBeGreaterThanOrEqual(2);
      selects.forEach((select) => {
        expect(select.className).toContain('min-h-[44px]');
      });
    });
  });

  describe('Task Lifecycle Actions: Start Work and Complete Repair', () => {
    it('shows "Start Work" for assigned tasks and "Complete Repair" for in-progress tasks', async () => {
      vi.mocked(requestsApi.list).mockResolvedValue({
        data: [mockAssignedTask, mockInProgressTask],
        total: 2,
        page: 1,
        per_page: 50,
      } as any);

      render(
        <MemoryRouter>
          <StaffTasksView />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('AT-0101')).toBeInTheDocument();
        expect(screen.getByText('AT-0102')).toBeInTheDocument();
      });

      // Task card for assigned task has "Start Work" button
      const startWorkBtn = screen.getByRole('button', { name: /start work/i });
      expect(startWorkBtn).toBeInTheDocument();
      expect(startWorkBtn.className).toContain('min-h-[44px]');

      // Task card for in-progress task has "Complete Repair" button
      const completeRepairBtn = screen.getByRole('button', { name: /complete repair/i });
      expect(completeRepairBtn).toBeInTheDocument();
      expect(completeRepairBtn.className).toContain('min-h-[44px]');

      // Old button texts "Get started" or "Resolve details" should not be present
      expect(screen.queryByRole('button', { name: 'Get started' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Resolve details' })).not.toBeInTheDocument();
    });

    it('clicking "Start Work" invokes requestsApi.start', async () => {
      vi.mocked(requestsApi.list).mockResolvedValue({
        data: [mockAssignedTask],
        total: 1,
        page: 1,
        per_page: 50,
      } as any);
      vi.mocked(requestsApi.start).mockResolvedValue({
        ...mockAssignedTask,
        status: 'in_progress',
      } as any);

      render(
        <MemoryRouter>
          <StaffTasksView />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('AT-0101')).toBeInTheDocument();
      });

      const startWorkBtn = screen.getByRole('button', { name: /start work/i });
      fireEvent.click(startWorkBtn);

      expect(requestsApi.start).toHaveBeenCalledWith(101);
    });

    it('opening modal for in-progress task displays Complete Repair header and requires remarks', async () => {
      vi.mocked(requestsApi.list).mockResolvedValue({
        data: [mockInProgressTask],
        total: 1,
        page: 1,
        per_page: 50,
      } as any);
      vi.mocked(requestsApi.resolve).mockResolvedValue({
        ...mockInProgressTask,
        status: 'resolved',
      } as any);

      render(
        <MemoryRouter>
          <StaffTasksView />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('AT-0102')).toBeInTheDocument();
      });

      // Open task modal
      const completeRepairCardBtn = screen.getByRole('button', { name: /complete repair/i });
      fireEvent.click(completeRepairCardBtn);

      // Verify modal header has Complete Repair
      expect(screen.getByRole('heading', { name: /complete repair/i })).toBeInTheDocument();

      // Submit without remarks shows error
      const modalCompleteBtn = screen.getAllByRole('button', { name: /complete repair/i }).pop()!;
      fireEvent.click(modalCompleteBtn);

      expect(screen.getByText(/resolution remarks are required/i)).toBeInTheDocument();
      expect(requestsApi.resolve).not.toHaveBeenCalled();

      // Enter remarks and resolve
      const textarea = screen.getByPlaceholderText(/e\.g\. Replaced 1-inch pipe fitting/i);
      fireEvent.change(textarea, { target: { value: 'Replaced burst segment and restored water flow.' } });
      fireEvent.click(modalCompleteBtn);

      expect(requestsApi.resolve).toHaveBeenCalledWith(
        102,
        'Replaced burst segment and restored water flow.',
        undefined
      );
    });

    it('uses "Customer" and never "Consumer"', async () => {
      vi.mocked(requestsApi.list).mockResolvedValue({
        data: [mockAssignedTask],
        total: 1,
        page: 1,
        per_page: 50,
      } as any);

      const { container } = render(
        <MemoryRouter>
          <StaffTasksView />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('AT-0101')).toBeInTheDocument();
      });

      expect(container.textContent).not.toContain('Consumer');
    });
  });
});
