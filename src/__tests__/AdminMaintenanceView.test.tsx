import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AdminMaintenanceView } from '../pages/admin/AdminMaintenanceView';
import { AdminUIProvider } from '../contexts/AdminUIContext';
import { requestsApi } from '../api';

// Mock AuthContext
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { name: 'Admin User', email: 'admin@sinacaban.gov.ph', role: 'admin' },
    logout: vi.fn(),
  }),
}));

const mockRequests = [
  {
    id: 101,
    reference: 'REQ-2026-101',
    reference_no: 'REQ-2026-101',
    description: 'Burst main pipe near elementary school',
    urgency: 'high',
    status: 'submitted',
    created_at: '2026-10-09T08:00:00Z',
    customer: { full_name: 'Maria Santos', barangay: 'Poblacion', phone: '09171234567' },
    assigned_staff: null,
    assigned_staff_id: null,
    latitude: 8.2985,
    longitude: 123.8340,
  },
  {
    id: 102,
    reference: 'REQ-2026-102',
    reference_no: 'REQ-2026-102',
    description: 'Low water pressure at household meter',
    urgency: 'low',
    status: 'in_progress',
    created_at: '2026-10-08T09:30:00Z',
    customer: { full_name: 'Pedro Reyes', barangay: 'San Isidro', phone: '09189876543' },
    assigned_staff: { id: 5, name: 'Engr. Dalisay' },
    assigned_staff_id: 5,
    assigned_at: '2026-10-08T10:00:00Z',
    latitude: 8.2950,
    longitude: 123.8310,
  },
  {
    id: 104,
    reference: 'REQ-2026-104',
    reference_no: 'REQ-2026-104',
    description: 'Leaking meter valve assembly',
    urgency: 'medium',
    status: 'assigned',
    created_at: '2026-10-06T11:00:00Z',
    assigned_at: '2026-10-09T09:00:00Z',
    customer: { full_name: 'Juan Dela Cruz', barangay: 'Poblacion', phone: '09170001122' },
    assigned_staff: { id: 6, name: 'Technician Ramos' },
    assigned_staff_id: 6,
    latitude: 8.2970,
    longitude: 123.8330,
  },
  {
    id: 103,
    reference: 'REQ-2026-103',
    reference_no: 'REQ-2026-103',
    description: 'Replaced rusted valve connector',
    urgency: 'medium',
    status: 'resolved',
    created_at: '2026-10-07T14:15:00Z',
    customer: { full_name: 'Elena Cruz', barangay: 'Cagay-anon', phone: '09191112233' },
    assigned_staff: { id: 5, name: 'Engr. Dalisay' },
    assigned_staff_id: 5,
    latitude: 8.3000,
    longitude: 123.8360,
  },
];

const mockStaff = [
  { id: 5, name: 'Engr. Dalisay', email: 'dalisay@sinacaban.gov.ph', role: 'staff' },
  { id: 6, name: 'Technician Ramos', email: 'ramos@sinacaban.gov.ph', role: 'staff' },
];

const mockBarangays = [
  { id: 1, name: 'Poblacion' },
  { id: 2, name: 'San Isidro' },
  { id: 3, name: 'Cagay-anon' },
];

vi.mock('../api', () => ({
  requestsApi: {
    list: vi.fn().mockImplementation(() => Promise.resolve({ data: mockRequests })),
    assign: vi.fn().mockResolvedValue({ success: true }),
    unassign: vi.fn().mockResolvedValue({ success: true }),
  },
  adminApi: {
    staffList: vi.fn().mockImplementation(() => Promise.resolve(mockStaff)),
  },
  referenceApi: {
    getBarangays: vi.fn().mockImplementation(() => Promise.resolve(mockBarangays)),
  },
}));

const renderMaintenanceView = () => {
  return render(
    <AdminUIProvider>
      <BrowserRouter>
        <AdminMaintenanceView />
      </BrowserRouter>
    </AdminUIProvider>
  );
};

describe('AdminMaintenanceView (Simplified Tracking & Dispatch)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders active maintenance requests and fully visible tracking map without clutter', async () => {
    renderMaintenanceView();

    await waitFor(() => {
      expect(screen.getAllByText('REQ-2026-101').length).toBeGreaterThan(0);
    });

    // Active requests are present
    expect(screen.getAllByText('REQ-2026-102').length).toBeGreaterThan(0);

    // Resolved request is excluded from live active tracking queue
    expect(screen.queryByText('REQ-2026-103')).not.toBeInTheDocument();

    // No bold clutter or heavy queue metric counters
    expect(screen.queryByText(/Unassigned: 1/i)).not.toBeInTheDocument();
  }, 15000);

  it('opens full details drawer when clicking View button', async () => {
    renderMaintenanceView();

    await waitFor(() => {
      expect(screen.getAllByText('REQ-2026-101').length).toBeGreaterThan(0);
    });

    const viewButtons = screen.getAllByRole('button', { name: /^view$/i });
    expect(viewButtons.length).toBeGreaterThan(0);

    // Click the first View button
    fireEvent.click(viewButtons[0]);

    // Drawer should show full description and resident info
    expect(screen.getByText('Maintenance Request Details')).toBeInTheDocument();
    expect(screen.getByText('Burst main pipe near elementary school')).toBeInTheDocument();
    expect(screen.getAllByText('Maria Santos').length).toBeGreaterThan(0);
  }, 15000);

  it('renders Assign button for unassigned request and opens assignment modal', async () => {
    renderMaintenanceView();

    await waitFor(() => {
      expect(screen.getAllByText('REQ-2026-101').length).toBeGreaterThan(0);
    });

    const assignBtns = screen.getAllByRole('button', { name: /^assign$/i });
    expect(assignBtns.length).toBeGreaterThan(0);

    fireEvent.click(assignBtns[0]);

    expect(screen.getByText('Assign Staff Technician')).toBeInTheDocument();
    expect(screen.getAllByText(/Engr\. Dalisay/i).length).toBeGreaterThan(0);
  });

  it('renders Unassign button for assigned request and unassigns technician', async () => {
    renderMaintenanceView();

    await waitFor(() => {
      expect(screen.getAllByText('REQ-2026-102').length).toBeGreaterThan(0);
    });

    const unassignBtns = screen.getAllByRole('button', { name: /^unassign$/i });
    expect(unassignBtns.length).toBeGreaterThan(0);

    fireEvent.click(unassignBtns[0]);

    expect(requestsApi.unassign).toHaveBeenCalled();
  });

  it('keeps clicked request in the list with active indicator instead of removing it', async () => {
    renderMaintenanceView();

    await waitFor(() => {
      expect(screen.getAllByText('REQ-2026-101').length).toBeGreaterThan(0);
    });

    // Both requests are present in the list
    expect(screen.getAllByText('REQ-2026-101').length).toBeGreaterThan(0);
    expect(screen.getAllByText('REQ-2026-102').length).toBeGreaterThan(0);

    // Find all REQ-2026-102 elements and click the card
    const req102Elements = screen.getAllByText('REQ-2026-102');
    const req102Card = req102Elements[0].closest('div');
    if (req102Card) {
      fireEvent.click(req102Card);
    }

    // Both REQ-2026-101 and REQ-2026-102 MUST remain in document (not filtered out)
    expect(screen.getAllByText('REQ-2026-101').length).toBeGreaterThan(0);
    expect(screen.getAllByText('REQ-2026-102').length).toBeGreaterThan(0);

    // Active indicator is rendered for the selected item
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('separates unassigned tasks at top and assigned tasks at bottom, with assigned sorted latest to oldest assigned', async () => {
    renderMaintenanceView();

    await waitFor(() => {
      expect(screen.getAllByText('REQ-2026-101').length).toBeGreaterThan(0);
    });

    // Check separate section headers exist (anchored regex)
    expect(screen.getByText(/^Unassigned Requests/i)).toBeInTheDocument();
    expect(screen.getByText(/^Assigned Requests/i)).toBeInTheDocument();

    // Check section notes
    expect(screen.getByText('Newest first')).toBeInTheDocument();
    expect(screen.getByText('Latest assigned first')).toBeInTheDocument();

    // Both assigned tasks (REQ-2026-104 and REQ-2026-102) are rendered
    expect(screen.getAllByText('REQ-2026-104').length).toBeGreaterThan(0);
    expect(screen.getAllByText('REQ-2026-102').length).toBeGreaterThan(0);

    // REQ-2026-104 was assigned at 2026-10-09 (more recent than REQ-2026-102 assigned at 2026-10-08)
    // In the DOM, REQ-2026-104 should appear before REQ-2026-102 in the assigned list
    const assignedRefs = screen.getAllByText(/REQ-2026-10[24]/).map((el) => el.textContent);
    const idx104 = assignedRefs.findIndex((t) => t?.includes('REQ-2026-104'));
    const idx102 = assignedRefs.findIndex((t) => t?.includes('REQ-2026-102'));
    expect(idx104).toBeGreaterThanOrEqual(0);
    expect(idx102).toBeGreaterThanOrEqual(0);
    expect(idx104).toBeLessThan(idx102);
  });

  it('filters requests by barangay and closes up on the selected barangay', async () => {
    renderMaintenanceView();

    await waitFor(() => {
      expect(screen.getAllByText('REQ-2026-101').length).toBeGreaterThan(0);
    });

    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();

    // Filter by 'San Isidro'
    fireEvent.change(select, { target: { value: 'San Isidro' } });

    // REQ-2026-102 is in San Isidro and should remain visible
    expect(screen.getAllByText('REQ-2026-102').length).toBeGreaterThan(0);
    // REQ-2026-101 is in Poblacion and should be excluded from current filter
    expect(screen.queryByText('REQ-2026-101')).not.toBeInTheDocument();
  });

  it('renders Reset View button and resets filter to capture whole Sinacaban when clicked', async () => {
    renderMaintenanceView();

    await waitFor(() => {
      expect(screen.getAllByText('REQ-2026-101').length).toBeGreaterThan(0);
    });

    const select = screen.getByRole('combobox') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'San Isidro' } });
    expect(screen.queryByText('REQ-2026-101')).not.toBeInTheDocument();

    const resetBtn = screen.getByRole('button', { name: /reset view/i });
    expect(resetBtn).toBeInTheDocument();

    fireEvent.click(resetBtn);

    // After reset, dropdown returns to 'all' and all requests are visible again
    expect(select.value).toBe('all');
    expect(screen.getAllByText('REQ-2026-101').length).toBeGreaterThan(0);
  });

  it('renders Pins and Homes switch buttons with badge counts for the barangay filter (Section 8 Step 1)', async () => {
    renderMaintenanceView();

    await waitFor(() => {
      expect(screen.getAllByText('REQ-2026-101').length).toBeGreaterThan(0);
    });

    const pinsSwitchBtn = screen.getByTitle('Show Request Pins on map');
    const homesSwitchBtn = screen.getByTitle('Show Customer Homes on map');

    expect(pinsSwitchBtn).toHaveAttribute('aria-pressed', 'true');
    expect(homesSwitchBtn).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(homesSwitchBtn);
    expect(homesSwitchBtn).toHaveAttribute('aria-pressed', 'true');
    expect(pinsSwitchBtn).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText(/^Active Customers/i)).toBeInTheDocument();
    expect(screen.getAllByText(/MTR-88912/i).length).toBeGreaterThan(0);

    fireEvent.click(pinsSwitchBtn);
    expect(pinsSwitchBtn).toHaveAttribute('aria-pressed', 'true');
    expect(homesSwitchBtn).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText(/^Unassigned Requests/i)).toBeInTheDocument();
  });
});
