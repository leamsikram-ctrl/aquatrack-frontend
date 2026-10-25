import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AdminUsersView } from '../pages/admin/AdminUsersView';
import { AdminUIProvider } from '../contexts/AdminUIContext';

// Mock AuthContext
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { name: 'Admin User', email: 'admin@sinacaban.gov.ph', role: 'admin' },
    logout: vi.fn(),
  }),
}));

const mockCustomers = [
  {
    id: 1,
    name: 'Juan Dela Cruz',
    full_name: 'Juan Dela Cruz',
    email: 'juan@example.com',
    role: 'consumer',
    status: 'active',
    is_verified: true,
    verification_status: 'verified',
    mobile_number: '09171234567',
    customer_profile: {
      account_number: 'ACC-1001',
      barangay: { name: 'Poblacion' },
      meter: { meter_number: 'MTR-8821' },
      address: 'Purok 1, Poblacion',
    },
  },
  {
    id: 2,
    name: 'Maria Clara',
    full_name: 'Maria Clara',
    email: 'clara@example.com',
    role: 'consumer',
    status: 'pending',
    is_verified: false,
    verification_status: 'pending',
    mobile_number: '09187654321',
    customer_profile: {
      account_number: 'ACC-1002',
      barangay: { name: 'San Isidro' },
      meter: null,
      address: 'Purok 2, San Isidro',
    },
  },
];

const mockStaff = [
  {
    id: 10,
    name: 'Technician Cardo Dalisay',
    full_name: 'Cardo Dalisay',
    email: 'cardo@sinacaban.gov.ph',
    role: 'staff',
    mobile_number: '09191234567',
    staff_profile: {
      assigned_barangay: { name: 'General Utility' },
    },
  },
];

const mockTasks = [
  {
    id: 201,
    assigned_staff_id: 10,
    status: 'in_progress',
  },
];

const mockBarangays = [
  { id: 1, name: 'Poblacion' },
  { id: 2, name: 'San Isidro' },
];

vi.mock('../api', () => ({
  adminApi: {
    customersList: vi.fn().mockImplementation(() => Promise.resolve({ data: mockCustomers })),
    staffList: vi.fn().mockImplementation(() => Promise.resolve(mockStaff)),
    registerStaff: vi.fn().mockResolvedValue({ user: { id: 11, name: 'New Staff' } }),
    availableMeters: vi.fn().mockResolvedValue([{ id: 101, meter_number: 'MTR-101', status: 'unassigned' }]),
    verifyRegistration: vi.fn().mockResolvedValue({
      message: 'Verified',
      user: { id: 2, name: 'Maria Clara', status: 'active', is_verified: true },
    }),
  },
  requestsApi: {
    list: vi.fn().mockImplementation(() => Promise.resolve({ data: mockTasks })),
  },
  referenceApi: {
    getBarangays: vi.fn().mockImplementation(() => Promise.resolve(mockBarangays)),
  },
}));

const renderUsersView = () => {
  return render(
    <AdminUIProvider>
      <BrowserRouter>
        <AdminUsersView />
      </BrowserRouter>
    </AdminUIProvider>
  );
};

describe('AdminUsersView (Consolidated Customers + Staff)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Consumers directory tab with account details by default', async () => {
    renderUsersView();

    await waitFor(() => {
      expect(screen.getByText('Juan Dela Cruz')).toBeInTheDocument();
    });

    expect(screen.getByText(/ACC-1001/i)).toBeInTheDocument();
    expect(screen.getByText('Maria Clara')).toBeInTheDocument();
    expect(screen.getByText(/ACC-1002/i)).toBeInTheDocument();
  });

  it('switches to Staff directory tab and displays field staff with task counts', async () => {
    renderUsersView();

    await waitFor(() => {
      expect(screen.getByText('Juan Dela Cruz')).toBeInTheDocument();
    });

    const staffTab = screen.getByRole('button', { name: /field staff/i });
    fireEvent.click(staffTab);

    expect(screen.getByText('Technician Cardo Dalisay')).toBeInTheDocument();
    expect(screen.getByText(/1 Active Task/i)).toBeInTheDocument();
    expect(screen.queryByText(/ACC-1001/i)).not.toBeInTheDocument();
  }, 15000);

  it('filters customers by verification status', async () => {
    renderUsersView();

    await waitFor(() => {
      expect(screen.getByText('Juan Dela Cruz')).toBeInTheDocument();
    });

    const pendingFilterBtn = screen.getByRole('button', { name: /^pending/i });
    fireEvent.click(pendingFilterBtn);

    expect(screen.getByText('Maria Clara')).toBeInTheDocument();
    expect(screen.queryByText('Juan Dela Cruz')).not.toBeInTheDocument();
  });

  it('opens register staff modal when in staff tab', async () => {
    renderUsersView();

    await waitFor(() => {
      expect(screen.getByText('Juan Dela Cruz')).toBeInTheDocument();
    });

    const staffTab = screen.getByRole('button', { name: /field staff/i });
    fireEvent.click(staffTab);

    const addStaffBtn = screen.getByRole('button', { name: /register staff/i });
    fireEvent.click(addStaffBtn);

    expect(screen.getByText('Register Field Technician')).toBeInTheDocument();
  });

  it('switches to All users tab and displays both consumers and staff', async () => {
    renderUsersView();

    await waitFor(() => {
      expect(screen.getByText('Juan Dela Cruz')).toBeInTheDocument();
    });

    const allUsersTab = screen.getByRole('button', { name: /all users/i });
    fireEvent.click(allUsersTab);

    expect(screen.getByText('Juan Dela Cruz')).toBeInTheDocument();
    expect(screen.getByText('Technician Cardo Dalisay')).toBeInTheDocument();
  });

  it('filters users using search bar input', async () => {
    renderUsersView();

    await waitFor(() => {
      expect(screen.getByText('Juan Dela Cruz')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: 'Maria' } });

    expect(screen.getByText('Maria Clara')).toBeInTheDocument();
    expect(screen.queryByText('Juan Dela Cruz')).not.toBeInTheDocument();
  });

  it('renders pagination controls and action dropdown', async () => {
    renderUsersView();

    await waitFor(() => {
      expect(screen.getByText('Juan Dela Cruz')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
  });

  it('renders clean User management header without breadcrumb text', async () => {
    renderUsersView();

    expect(screen.getByRole('heading', { level: 1, name: 'User management' })).toBeInTheDocument();
    expect(screen.queryByText(/Sinacaban Water Works System ›/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Manage municipal staff/i)).not.toBeInTheDocument();
  });

  it('opens user details drawer when clicking on a user row in the list', async () => {
    renderUsersView();

    await waitFor(() => {
      expect(screen.getByText('Juan Dela Cruz')).toBeInTheDocument();
    });

    const userRowName = screen.getByText('Juan Dela Cruz');
    fireEvent.click(userRowName);

    // Details drawer opens
    expect(screen.getByText(/Utility Connection/i)).toBeInTheDocument();
    expect(screen.getAllByText(/MTR-8821/i).length).toBeGreaterThanOrEqual(1);
  });

  it('renders real user name instead of Account User fallback', async () => {
    renderUsersView();

    await waitFor(() => {
      expect(screen.getByText('Juan Dela Cruz')).toBeInTheDocument();
    });

    expect(screen.getByText('Maria Clara')).toBeInTheDocument();
    expect(screen.queryByText('Account User')).not.toBeInTheDocument();
  });

  it('opens Update User modal when clicking Update button', async () => {
    renderUsersView();

    await waitFor(() => {
      expect(screen.getByText('Juan Dela Cruz')).toBeInTheDocument();
    });

    const updateBtns = screen.getAllByRole('button', { name: /update/i });
    fireEvent.click(updateBtns[0]);

    expect(screen.getByText('Update User Information')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
  });

  it('opens Delete User modal when clicking Delete button', async () => {
    renderUsersView();

    await waitFor(() => {
      expect(screen.getByText('Juan Dela Cruz')).toBeInTheDocument();
    });

    const deleteBtns = screen.getAllByRole('button', { name: /delete/i });
    fireEvent.click(deleteBtns[0]);

    expect(screen.getByText('Delete User Account')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /confirm delete/i })).toBeInTheDocument();
  });

  it('displays bulk action bar with Bulk Delete button when selecting users', async () => {
    renderUsersView();

    await waitFor(() => {
      expect(screen.getByText('Juan Dela Cruz')).toBeInTheDocument();
    });

    const checkboxes = screen.getAllByRole('checkbox');
    // Check first user checkbox (index 1 after header checkbox)
    fireEvent.click(checkboxes[1]);

    expect(screen.getByText(/1 user account selected/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /bulk delete \(1\)/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /verify selected/i })).toBeInTheDocument();
  });

  it('renders Approve button for pending accounts and Update for verified accounts', async () => {
    renderUsersView();

    await waitFor(() => {
      expect(screen.getByText('Juan Dela Cruz')).toBeInTheDocument();
    });

    // Juan Dela Cruz is verified -> has Update button
    const updateButtons = screen.getAllByRole('button', { name: /update/i });
    expect(updateButtons.length).toBeGreaterThanOrEqual(1);

    // Maria Clara is pending -> has Approve button
    const approveButtons = screen.getAllByRole('button', { name: /approve/i });
    expect(approveButtons.length).toBeGreaterThanOrEqual(1);
  });

  it('approves a pending account when clicking Approve button on table row', async () => {
    renderUsersView();

    await waitFor(() => {
      expect(screen.getByText('Maria Clara')).toBeInTheDocument();
    });

    const approveButton = screen.getByRole('button', { name: /approve/i });
    fireEvent.click(approveButton);

    // Toast appears indicating success
    await waitFor(() => {
      expect(screen.getByText(/approved & verified successfully/i)).toBeInTheDocument();
    });
  });

  it('opens centered User Info modal and allows approving pending account inside modal', async () => {
    renderUsersView();

    await waitFor(() => {
      expect(screen.getByText('Maria Clara')).toBeInTheDocument();
    });

    // Click on Maria Clara's name to open centered modal
    fireEvent.click(screen.getByText('Maria Clara'));

    // Modal title & content appear
    expect(screen.getByRole('heading', { name: 'User Information' })).toBeInTheDocument();
    expect(screen.getByText(/Official Directory/i)).toBeInTheDocument();
    expect(screen.getAllByText(/ACC-1002/i).length).toBeGreaterThanOrEqual(1);

    // Inside modal, Approve Account button is present
    const approveAccountBtn = screen.getByRole('button', { name: /approve account|approve & verify/i });
    expect(approveAccountBtn).toBeInTheDocument();

    // Click Approve Account inside modal
    fireEvent.click(approveAccountBtn);

    await waitFor(() => {
      expect(screen.getByText(/approved & verified successfully/i)).toBeInTheDocument();
    });
  });

  it('opens delete confirmation modal and removes user upon confirmation', async () => {
    renderUsersView();

    await waitFor(() => {
      expect(screen.getByText('Juan Dela Cruz')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    expect(deleteButtons.length).toBeGreaterThanOrEqual(1);

    // Click delete on first row
    fireEvent.click(deleteButtons[0]);

    // Modal appears
    await waitFor(() => {
      expect(screen.getByText(/delete user account/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /confirm delete/i })).toBeInTheDocument();
    });

    // Click confirm delete
    fireEvent.click(screen.getByRole('button', { name: /confirm delete/i }));

    // Toast appears
    await waitFor(() => {
      expect(screen.getByText(/was removed from user directory/i)).toBeInTheDocument();
    });
  });

  it('allows admin to set and view temporary password when creating a staff account', async () => {
    renderUsersView();

    await waitFor(() => {
      expect(screen.getByText('Juan Dela Cruz')).toBeInTheDocument();
    });

    const staffTab = screen.getByRole('button', { name: /field staff/i });
    fireEvent.click(staffTab);

    const addStaffBtn = screen.getByRole('button', { name: /register staff/i });
    fireEvent.click(addStaffBtn);

    expect(screen.getByText('Register Field Technician')).toBeInTheDocument();
    expect(screen.getByText('Temporary Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /regenerate/i })).toBeInTheDocument();

    // Fill form
    fireEvent.change(screen.getByPlaceholderText(/e\.g\. Pedro Penduko/i), { target: { value: 'Mateo Rizal' } });
    fireEvent.change(screen.getByPlaceholderText('09123456789'), { target: { value: '09171239999' } });
    fireEvent.change(screen.getByPlaceholderText(/e\.g\. Staff2026!/i), { target: { value: 'CustomTempPass123!' } });

    // Submit form
    const registerButtons = screen.getAllByRole('button', { name: /register staff/i });
    const submitBtn = registerButtons[registerButtons.length - 1];
    fireEvent.click(submitBtn);

    // Verify confirmation view with temporary password and copy credentials button
    await waitFor(() => {
      expect(screen.getByText(/Staff Account Provisioned Successfully!/i)).toBeInTheDocument();
      expect(screen.getByText('CustomTempPass123!')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Copy Credentials/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Done' })).toBeInTheDocument();
    });
  });

  it('renders both Add Customer and Register Staff buttons in header and allows adding a customer', async () => {
    renderUsersView();

    await waitFor(() => {
      expect(screen.getByText('Juan Dela Cruz')).toBeInTheDocument();
    });

    // Check both buttons exist in the header
    const addCustBtn = screen.getByRole('button', { name: /add customer/i });
    const regStaffBtn = screen.getByRole('button', { name: /register staff/i });
    expect(addCustBtn).toBeInTheDocument();
    expect(regStaffBtn).toBeInTheDocument();

    // Click Add Customer
    fireEvent.click(addCustBtn);

    // Verify modal appeared
    expect(screen.getByText('Add Consumer Account')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e\.g\. Maria Santos/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e\.g\. MTR-SIN-0004/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('09171234567')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e\.g\. Purok 2, Near Chapel/i)).toBeInTheDocument();

    // Fill form
    fireEvent.change(screen.getByPlaceholderText(/e\.g\. Maria Santos/i), { target: { value: 'Corazon Aquino' } });
    fireEvent.change(screen.getByPlaceholderText(/e\.g\. MTR-SIN-0004/i), { target: { value: 'MTR-SIN-8888' } });
    fireEvent.change(screen.getByPlaceholderText('09171234567'), { target: { value: '09178888888' } });
    fireEvent.change(screen.getByPlaceholderText(/e\.g\. Purok 2, Near Chapel/i), { target: { value: 'Purok 1, Poblacion' } });
    fireEvent.change(screen.getByPlaceholderText(/e\.g\. Aqua2026!/i), { target: { value: 'CustomerSecret123!' } });

    // Submit form
    const registerCustBtn = screen.getByRole('button', { name: /register customer/i });
    fireEvent.click(registerCustBtn);

    // Verify confirmation view
    await waitFor(() => {
      expect(screen.getByText(/Consumer Account Registered Successfully!/i)).toBeInTheDocument();
      expect(screen.getByText('CustomerSecret123!')).toBeInTheDocument();
      expect(screen.getAllByText('MTR-SIN-8888').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByRole('button', { name: /Copy Credentials/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Done' })).toBeInTheDocument();
    });
  });
});


