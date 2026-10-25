import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AdminLayout } from '../components/templates/AdminLayout';
import { AdminUIProvider } from '../contexts/AdminUIContext';

// Mock AuthContext
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { name: 'Admin User', email: 'admin@sinacaban.gov.ph', role: 'admin' },
    logout: vi.fn(),
  }),
}));

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <AdminUIProvider>
      <BrowserRouter>{ui}</BrowserRouter>
    </AdminUIProvider>
  );
};

describe('AdminLayout & Persistent Sidebar State', () => {
  beforeEach(() => {
    localStorage.clear();
    // Set desktop window innerWidth
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1200 });
  });

  it('renders expanded sidebar by default and shows full brand text', () => {
    renderWithProviders(
      <AdminLayout currentPath="/admin/dashboard">
        <div>Dashboard Content</div>
      </AdminLayout>
    );

    expect(screen.getByText('Dashboard Content')).toBeInTheDocument();
    expect(screen.getAllByText('Sinacaban Water').length).toBeGreaterThan(0);
    const sidebar = screen.getByRole('complementary');
    expect(sidebar).toHaveClass('w-56');
  });

  it('toggles sidebar to collapsed mode and persists state in localStorage', () => {
    renderWithProviders(
      <AdminLayout currentPath="/admin/dashboard">
        <div>Dashboard Content</div>
      </AdminLayout>
    );

    const toggleBtn = screen.getByRole('button', { name: /collapse sidebar/i });
    fireEvent.click(toggleBtn);

    const sidebar = screen.getByRole('complementary');
    expect(sidebar).toHaveClass('w-16');
    expect(localStorage.getItem('aquatrack_admin_sidebar_collapsed')).toBe('true');
  });

  it('initializes with collapsed sidebar when localStorage has true', () => {
    localStorage.setItem('aquatrack_admin_sidebar_collapsed', 'true');

    renderWithProviders(
      <AdminLayout currentPath="/admin/users">
        <div>Customers Content</div>
      </AdminLayout>
    );

    const sidebar = screen.getByRole('complementary');
    expect(sidebar).toHaveClass('w-16');
    expect(screen.getByRole('button', { name: /expand sidebar/i })).toBeInTheDocument();
  });

  it('maintains collapsed state consistently across different page renders in the same session', () => {
    const { unmount } = renderWithProviders(
      <AdminLayout currentPath="/admin/dashboard">
        <div>Page 1</div>
      </AdminLayout>
    );

    // Collapse on Dashboard
    const toggleBtn = screen.getByRole('button', { name: /collapse sidebar/i });
    fireEvent.click(toggleBtn);
    expect(screen.getByRole('complementary')).toHaveClass('w-16');

    unmount();

    // Navigate to /admin/maintenance (simulates routing to another page)
    renderWithProviders(
      <AdminLayout currentPath="/admin/maintenance">
        <div>Page 2</div>
      </AdminLayout>
    );

    // Must still be collapsed!
    expect(screen.getByRole('complementary')).toHaveClass('w-16');
    expect(screen.getByText('Page 2')).toBeInTheDocument();
  });

  it('renders gray background on page content container while preserving white sidebar and topnav', () => {
    const { container } = renderWithProviders(
      <AdminLayout currentPath="/admin/dashboard">
        <div>Content</div>
      </AdminLayout>
    );

    const mainContainer = container.querySelector('main');
    expect(mainContainer).toBeInTheDocument();
    const rightCol = mainContainer?.parentElement;
    expect(rightCol).toHaveClass('bg-admin-bg');

    const sidebar = screen.getByRole('complementary');
    expect(sidebar).toHaveClass('bg-white');

    const header = screen.getByRole('banner');
    expect(header).toHaveClass('bg-white');
  });

  it('opens notification dropdown with hero entrance animation and mutual exclusivity', () => {
    renderWithProviders(
      <AdminLayout currentPath="/admin/dashboard">
        <div>Content</div>
      </AdminLayout>
    );

    // Initial state: notification dropdown is closed
    expect(screen.queryByText('Mark all read')).not.toBeInTheDocument();

    // Click Notification bell button
    const notifBtn = screen.getByRole('button', { name: /notifications/i });
    fireEvent.click(notifBtn);

    // Dropdown should be open and have animate-hero-entrance
    const dropdownHeader = screen.getByText('Notifications');
    expect(dropdownHeader).toBeInTheDocument();
    const dropdownPanel = dropdownHeader.closest('.animate-hero-entrance');
    expect(dropdownPanel).toBeInTheDocument();
    expect(dropdownPanel).toHaveClass('border-black/10');
    expect(screen.getByText('View Activity Log →')).toBeInTheDocument();

    // Clicking Communications button closes Notifications (mutual exclusivity)
    const messagesBtn = screen.getByTitle('Messages & Communication');
    fireEvent.click(messagesBtn);
    expect(screen.queryByText('View Activity Log →')).not.toBeInTheDocument();
    expect(screen.getByText('Communications')).toBeInTheDocument();
  });
});
