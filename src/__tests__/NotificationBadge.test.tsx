import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Topbar } from '../components/organisms/Topbar';
import { AdminTopbar } from '../components/organisms/AdminTopbar';
import { pushRoleNotification } from '../services/accountsStore';

const mockCustomer = {
  id: 101,
  name: 'Maria Santos',
  email: 'maria@example.com',
  role: 'customer' as const,
  customer_profile: {
    meter: { meter_number: 'MTR-SIN-2004' },
    meter_number: 'MTR-SIN-2004',
  },
};

const mockAdmin = {
  id: 1,
  name: 'SIWASS Administrator',
  email: 'admin@sinacaban.gov.ph',
  role: 'admin' as const,
};

let currentUser: any = mockCustomer;

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: currentUser,
    logout: vi.fn(),
  }),
}));

describe('Notification Badge Live Sync', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    currentUser = mockCustomer;
  });

  describe('Customer Topbar Notification Badge', () => {
    it('shows notification badge when unread notifications exist', () => {
      const unreadList = [
        {
          id: 'notif-1',
          type: 'bill',
          message: 'Your bill is ready.',
          time: 'Just now',
          read: false,
        },
      ];
      localStorage.setItem('aquatrack_notifications_customer', JSON.stringify(unreadList));

      render(
        <MemoryRouter>
          <Topbar />
        </MemoryRouter>
      );

      const badge = screen.getByTestId('notification-badge');
      expect(badge).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /notifications \(1 unread\)/i })).toBeInTheDocument();
    });

    it('hides notification badge completely when all notifications are marked as read (0 unread)', () => {
      const readList = [
        {
          id: 'notif-1',
          type: 'bill',
          message: 'Your bill is ready.',
          time: 'Just now',
          read: true,
        },
      ];
      localStorage.setItem('aquatrack_notifications_customer', JSON.stringify(readList));

      render(
        <MemoryRouter>
          <Topbar />
        </MemoryRouter>
      );

      expect(screen.queryByTestId('notification-badge')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Notifications' })).toBeInTheDocument();
    });

    it('dynamically displays badge when pushRoleNotification is triggered', () => {
      // Start with all read
      const readList = [
        {
          id: 'notif-1',
          type: 'bill',
          message: 'Your bill is ready.',
          time: 'Just now',
          read: true,
        },
      ];
      localStorage.setItem('aquatrack_notifications_customer', JSON.stringify(readList));

      render(
        <MemoryRouter>
          <Topbar />
        </MemoryRouter>
      );

      expect(screen.queryByTestId('notification-badge')).not.toBeInTheDocument();

      // Trigger new notification via pushRoleNotification
      act(() => {
        pushRoleNotification('customer', 'New water advisory published.', 'advisory');
      });

      // Badge must appear reactively
      expect(screen.getByTestId('notification-badge')).toBeInTheDocument();
    });

    it('clears badge when user opens NotificationCenter and clicks "Mark all read"', () => {
      const unreadList = [
        {
          id: 'notif-1',
          type: 'bill',
          message: 'Your bill is ready.',
          time: 'Just now',
          read: false,
        },
      ];
      localStorage.setItem('aquatrack_notifications_customer', JSON.stringify(unreadList));

      render(
        <MemoryRouter>
          <Topbar />
        </MemoryRouter>
      );

      expect(screen.getByTestId('notification-badge')).toBeInTheDocument();

      // Open notifications modal
      const bellBtn = screen.getByRole('button', { name: /notifications \(1 unread\)/i });
      fireEvent.click(bellBtn);

      // Click mark all read
      const markAllBtn = screen.getByRole('button', { name: /mark all read/i });
      fireEvent.click(markAllBtn);

      // Badge should immediately vanish
      expect(screen.queryByTestId('notification-badge')).not.toBeInTheDocument();
    });
  });

  describe('Admin Topbar Notification Badge', () => {
    beforeEach(() => {
      currentUser = mockAdmin;
    });

    it('renders admin badge when unread admin notifications exist', () => {
      const unreadList = [
        {
          id: 'a-notif-1',
          type: 'request',
          message: 'New service request AT-2026-0015 submitted.',
          time: '5 mins ago',
          read: false,
        },
      ];
      localStorage.setItem('aquatrack_notifications_admin', JSON.stringify(unreadList));

      render(
        <MemoryRouter>
          <AdminTopbar />
        </MemoryRouter>
      );

      expect(screen.getByTestId('notification-badge')).toBeInTheDocument();
    });

    it('hides admin badge when all notifications are read', () => {
      const readList = [
        {
          id: 'a-notif-1',
          type: 'request',
          message: 'New service request AT-2026-0015 submitted.',
          time: '5 mins ago',
          read: true,
        },
      ];
      localStorage.setItem('aquatrack_notifications_admin', JSON.stringify(readList));

      render(
        <MemoryRouter>
          <AdminTopbar />
        </MemoryRouter>
      );

      expect(screen.queryByTestId('notification-badge')).not.toBeInTheDocument();
    });

    it('clears admin badge when "Mark all read" is clicked in admin dropdown', () => {
      const unreadList = [
        {
          id: 'a-notif-1',
          type: 'request',
          message: 'New service request AT-2026-0015 submitted.',
          time: '5 mins ago',
          read: false,
        },
      ];
      localStorage.setItem('aquatrack_notifications_admin', JSON.stringify(unreadList));

      render(
        <MemoryRouter>
          <AdminTopbar />
        </MemoryRouter>
      );

      expect(screen.getByTestId('notification-badge')).toBeInTheDocument();

      // Open notification dropdown
      const bellBtn = screen.getByRole('button', { name: /notifications/i });
      fireEvent.click(bellBtn);

      // Click Mark all read
      const markAllBtn = screen.getByRole('button', { name: /mark all read/i });
      fireEvent.click(markAllBtn);

      expect(screen.queryByTestId('notification-badge')).not.toBeInTheDocument();
    });
  });
});
