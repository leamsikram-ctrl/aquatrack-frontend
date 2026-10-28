import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { NotificationCenter } from '../components/organisms/NotificationCenter';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock AuthContext
const mockUser = {
  id: 101,
  name: 'Maria Santos',
  email: 'maria@example.com',
  role: 'customer' as const,
  customer_profile: {
    meter: { meter_number: 'MTR-SIN-2004' },
    meter_number: 'MTR-SIN-2004',
  },
};

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    logout: vi.fn(),
  }),
}));

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
};

describe('NotificationCenter Component', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders notifications drawer when open', () => {
    renderWithRouter(<NotificationCenter isOpen={true} onClose={vi.fn()} role="customer" />);
    expect(screen.getByText(/Notifications/i)).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    const { container } = renderWithRouter(<NotificationCenter isOpen={false} onClose={vi.fn()} role="customer" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('automatically deduplicates multiple identical notifications and filters out foreign meter approvals', () => {
    const duplicateList = [
      {
        id: 'notif-1',
        type: 'system',
        message: 'Your AquaTrack account (MTR-SIN-2004) has been verified and approved! You can now log in.',
        time: 'Just now',
        read: false,
      },
      {
        id: 'notif-2',
        type: 'system',
        message: 'Your AquaTrack account (MTR-SIN-2004) has been verified and approved! You can now log in.',
        time: 'Just now',
        read: false,
      },
      {
        id: 'notif-3',
        type: 'system',
        message: 'Your AquaTrack account (MTR-SIN-2004) has been verified and approved! You can now log in.',
        time: 'Just now',
        read: false,
      },
      {
        id: 'notif-4',
        type: 'system',
        message: 'Your AquaTrack account (MTR-SIN-0001) has been verified and approved! You can now log in.',
        time: 'Just now',
        read: false,
      },
    ];

    localStorage.setItem('aquatrack_notifications_customer', JSON.stringify(duplicateList));

    renderWithRouter(<NotificationCenter isOpen={true} onClose={vi.fn()} role="customer" />);

    // Should only have 1 copy of MTR-SIN-2004
    const matches = screen.getAllByText(/Your AquaTrack account \(MTR-SIN-2004\) has been verified/i);
    expect(matches).toHaveLength(1);

    // Should NOT have MTR-SIN-0001 because it belongs to another customer
    expect(screen.queryByText(/Your AquaTrack account \(MTR-SIN-0001\)/i)).not.toBeInTheDocument();
  });

  it('groups notifications by day with sticky section headers', () => {
    const sampleList = [
      {
        id: 'notif-today',
        type: 'request' as const,
        message: 'Your service request is assigned.',
        time: '10 mins ago',
        read: false,
      },
      {
        id: 'notif-yesterday',
        type: 'advisory' as const,
        message: 'Water service interruption scheduled.',
        time: 'Yesterday',
        read: true,
      },
    ];

    localStorage.setItem('aquatrack_notifications_customer', JSON.stringify(sampleList));

    renderWithRouter(<NotificationCenter isOpen={true} onClose={vi.fn()} role="customer" />);

    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getAllByText('Yesterday').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Your service request is assigned.')).toBeInTheDocument();
    expect(screen.getByText('Water service interruption scheduled.')).toBeInTheDocument();
  });

  it('renders unread indicator dot for unread notifications and hides it for read ones', () => {
    const sampleList = [
      {
        id: 'notif-unread',
        type: 'bill' as const,
        message: 'New billing statement available.',
        time: 'Just now',
        read: false,
      },
      {
        id: 'notif-read',
        type: 'system' as const,
        message: 'Password reset link sent.',
        time: 'Yesterday',
        read: true,
      },
    ];

    localStorage.setItem('aquatrack_notifications_customer', JSON.stringify(sampleList));

    renderWithRouter(<NotificationCenter isOpen={true} onClose={vi.fn()} role="customer" />);

    const unreadDots = screen.getAllByTestId('unread-dot');
    expect(unreadDots).toHaveLength(1);
  });

  it('opens related item, marks notification as read, and closes drawer when clicked', () => {
    const onClose = vi.fn();
    const sampleList = [
      {
        id: 'notif-click',
        type: 'request' as const,
        message: 'Work order assigned to technician.',
        time: '5 mins ago',
        read: false,
        link: '/customer/requests',
      },
    ];

    localStorage.setItem('aquatrack_notifications_customer', JSON.stringify(sampleList));

    renderWithRouter(<NotificationCenter isOpen={true} onClose={onClose} role="customer" />);

    const item = screen.getByText('Work order assigned to technician.');
    fireEvent.click(item);

    // 1. Should close drawer
    expect(onClose).toHaveBeenCalled();

    // 2. Should navigate to destination link
    expect(mockNavigate).toHaveBeenCalledWith('/customer/requests');

    // 3. Notification marked read in local storage
    const saved = JSON.parse(localStorage.getItem('aquatrack_notifications_customer') || '[]');
    expect(saved[0].read).toBe(true);
  });

  it('allows user to delete a notification', () => {
    const sampleList = [
      {
        id: 'notif-delete-1',
        type: 'system' as const,
        message: 'System maintenance scheduled tonight.',
        time: '1 hour ago',
        read: false,
      },
    ];

    localStorage.setItem('aquatrack_notifications_customer', JSON.stringify(sampleList));

    renderWithRouter(<NotificationCenter isOpen={true} onClose={vi.fn()} role="customer" />);

    expect(screen.getByText('System maintenance scheduled tonight.')).toBeInTheDocument();

    const deleteBtn = screen.getByTitle(/delete notification/i);
    fireEvent.click(deleteBtn);

    expect(screen.queryByText('System maintenance scheduled tonight.')).not.toBeInTheDocument();
  });

  it('allows marking all notifications as read', () => {
    const sampleList = [
      {
        id: 'notif-unread-1',
        type: 'system' as const,
        message: 'Your bill is ready.',
        time: 'Just now',
        read: false,
      },
    ];

    localStorage.setItem('aquatrack_notifications_customer', JSON.stringify(sampleList));

    renderWithRouter(<NotificationCenter isOpen={true} onClose={vi.fn()} role="customer" />);

    const markAllReadBtn = screen.getByRole('button', { name: /mark all read/i });
    fireEvent.click(markAllReadBtn);

    // Unread count badge "1 new" should no longer be shown
    expect(screen.queryByText(/1 new/i)).not.toBeInTheDocument();
  });
});
