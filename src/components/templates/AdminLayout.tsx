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
    <div className="min-h-screen bg-white flex flex-col text-black text-[14px]">
      <Topbar
        title={title}
        subtitle={subtitle}
        isMobileMenuOpen={isMobileMenuOpen}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />

      <div className="flex flex-1 relative overflow-hidden">
        {/* Desktop Sidebar (Permanent >= 1024px / md) */}
        <div className="hidden md:flex">
          <AdminSidebar currentPath={currentPath} onNavigate={onNavigate} />
        </div>

        {/* Mobile Slide-over Drawer */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-40 md:hidden flex">
            <div
              className="fixed inset-0 bg-black/40"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div className="relative z-50 flex w-64 max-w-full flex-col bg-white border-r border-black shadow-lg">
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

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto px-6 sm:px-10 lg:px-14 py-6 max-w-[1440px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
