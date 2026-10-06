import React, { useState } from 'react';
import { FastoSidebar } from '../organisms/FastoSidebar';
import { FastoTopbar } from '../organisms/FastoTopbar';

export interface FastoAdminLayoutProps {
  children: React.ReactNode;
  currentPath?: string;
  onNavigate?: (path: string) => void;
  pageTitle?: string;
}

export const FastoAdminLayout: React.FC<FastoAdminLayoutProps> = ({
  children,
  currentPath = '/admin/dashboard',
  onNavigate,
  pageTitle = 'Dashboard',
}) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8F9FD] flex text-slate-800">
      {/* Permanent Fasto Indigo Sidebar on Desktop (>= 1024px) */}
      <div className="hidden lg:flex shrink-0">
        <FastoSidebar currentPath={currentPath} onNavigate={onNavigate} />
      </div>

      {/* Mobile Drawer Sidebar */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <div className="relative z-50 flex w-68 max-w-full flex-col shadow-2xl">
            <FastoSidebar
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

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <FastoTopbar
          title={pageTitle}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          isMobileSidebarOpen={isMobileSidebarOpen}
        />

        <main className="flex-1 px-6 sm:px-8 pb-12 space-y-6 max-w-[1600px] w-full">
          {children}
        </main>
      </div>
    </div>
  );
};
