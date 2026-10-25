import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NotificationCenter } from '../components/organisms/NotificationCenter';

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

describe('NotificationCenter Component', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders notifications drawer when open', () => {
    render(<NotificationCenter isOpen={true} onClose={vi.fn()} role="customer" />);
    expect(screen.getByText(/Notifications/i)).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(<NotificationCenter isOpen={false} onClose={vi.fn()} role="customer" />);
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

    render(<NotificationCenter isOpen={true} onClose={vi.fn()} role="customer" />);

    // Should only have 1 copy of MTR-SIN-2004
    const matches = screen.getAllByText(/Your AquaTrack account \(MTR-SIN-2004\) has been verified/i);
    expect(matches).toHaveLength(1);

    // Should NOT have MTR-SIN-0001 because it belongs to another customer
    expect(screen.queryByText(/Your AquaTrack account \(MTR-SIN-0001\)/i)).not.toBeInTheDocument();
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

    render(<NotificationCenter isOpen={true} onClose={vi.fn()} role="customer" />);

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

    render(<NotificationCenter isOpen={true} onClose={vi.fn()} role="customer" />);

    const markAllReadBtn = screen.getByRole('button', { name: /mark all read/i });
    fireEvent.click(markAllReadBtn);

    // Unread count badge "1 new" should no longer be shown
    expect(screen.queryByText(/1 new/i)).not.toBeInTheDocument();
  });
});

