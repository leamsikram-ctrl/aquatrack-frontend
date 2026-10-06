import React, { useState } from 'react';
import { ModernSidebar } from '../organisms/ModernSidebar';
import { CleanTopbar } from '../organisms/CleanTopbar';

export interface CleanAdminLayoutProps {
  children: React.ReactNode;
  currentPath?: string;
  onNavigate?: (path: string) => void;
  pageTitle?: string;
  pageSubtitle?: string;
}

export const CleanAdminLayout: React.FC<CleanAdminLayoutProps> = ({
  children,
  currentPath = '/admin/dashboard',
  onNavigate,
  pageTitle = 'Dashboard',
  pageSubtitle = 'Water Utility Operational Overview',
}) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex text-slate-800">
      {/* Permanent Clean Sidebar on Desktop (>= 1024px) */}
      <div className="hidden lg:flex shrink-0">
        <ModernSidebar currentPath={currentPath} onNavigate={onNavigate} />
      </div>

      {/* Mobile Drawer */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xs transition-opacity"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <div className="relative z-50 flex w-64 max-w-full flex-col shadow-xl">
            <ModernSidebar
              currentPath={currentPath}
              onNavigate={(path) => {
                onNavigate?.(path);
                setIsMobileSidebarOpen(false);
              }}
              className="w-full h-full"
            />
          </div>
        </div>
      )}

      {/* Main App Canvas */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <CleanTopbar
          title={pageTitle}
          subtitle={pageSubtitle}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          isMobileSidebarOpen={isMobileSidebarOpen}
        />

        <main className="flex-1 p-5 sm:p-7 space-y-6 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
