import React, { useState } from 'react';
import { AdminSidebar } from '../organisms/AdminSidebar';
import { Topbar } from '../organisms/Topbar';

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col text-[#0F172A]">
      <Topbar
        title={title}
        subtitle={subtitle}
        isMobileMenuOpen={isMobileMenuOpen}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        notificationCount={3}
      />

      <div className="flex flex-1 relative overflow-hidden">
        {/* Desktop Sidebar (Permanent >= 1024px / md) */}
        <div className="hidden md:flex">
          <AdminSidebar currentPath={currentPath} onNavigate={onNavigate} />
        </div>

        {/* Mobile Slide-over Drawer (Opened via hamburger < 1024px) */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-40 md:hidden flex">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xs transition-opacity"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            {/* Drawer */}
            <div className="relative z-50 flex w-72 max-w-full flex-col bg-white shadow-xl">
              <AdminSidebar
                currentPath={currentPath}
                onNavigate={(path) => {
                  onNavigate?.(path);
                  setIsMobileMenuOpen(false);
                }}
                className="w-full h-full border-r-0"
              />
            </div>
          </div>
        )}

        {/* Main Operational Canvas */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
