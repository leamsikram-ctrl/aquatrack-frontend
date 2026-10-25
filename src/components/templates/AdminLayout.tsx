import React from 'react';
import { AdminSidebar } from '../organisms/AdminSidebar';
import { AdminTopbar } from '../organisms/AdminTopbar';
import { useAdminUI } from '../../contexts/AdminUIContext';

export interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  currentPath?: string;
  onNavigate?: (path: string) => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  title = 'Operations',
  subtitle = 'System Overview',
  currentPath = '/admin/dashboard',
  onNavigate,
}) => {
  const {
    isSidebarCollapsed,
    toggleSidebar,
    isMobileMenuOpen,
    setMobileMenuOpen,
  } = useAdminUI();

  return (
    <div className="min-h-screen bg-[#E0E8F5] flex text-black text-[14px]">
      {/* Desktop Sidebar (Permanent, Left Column >= md) */}
      <div className="hidden md:flex shrink-0">
        <AdminSidebar
          currentPath={currentPath}
          onNavigate={onNavigate}
          isCollapsed={isSidebarCollapsed}
          className="sticky top-0 h-screen bg-white"
        />
      </div>

      {/* Mobile Slide-over Drawer (< md) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-50 flex w-64 max-w-full flex-col bg-white shadow-[6px_0_0_0_rgba(0,0,0,0.15)] h-full animate-hero-entrance">
            <AdminSidebar
              currentPath={currentPath}
              onNavigate={(path) => {
                onNavigate?.(path);
                setMobileMenuOpen(false);
              }}
              isCollapsed={false}
              className="w-full h-full border-r-0"
            />
          </div>
        </div>
      )}

      {/* Right Column: Topnav (White) + Page Content (Gray) */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen bg-[#E0E8F5]">
        <AdminTopbar
          title={title}
          subtitle={subtitle}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={toggleSidebar}
          onNavigate={onNavigate}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-8 lg:px-14 py-4 sm:py-6 max-w-[1440px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
