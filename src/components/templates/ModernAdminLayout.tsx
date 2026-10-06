import React from 'react';
import { FloatingNav } from '../organisms/FloatingNav';

export interface ModernAdminLayoutProps {
  children: React.ReactNode;
  currentPath?: string;
  onNavigate?: (path: string) => void;
  breadcrumbs?: string[];
  actionSlot?: React.ReactNode;
}

export const ModernAdminLayout: React.FC<ModernAdminLayoutProps> = ({
  children,
  currentPath = '/admin/dashboard',
  onNavigate,
  breadcrumbs = ['Operations', 'Dashboard'],
  actionSlot,
}) => {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col text-[#090A0F]">
      {/* Floating Modern Top Navigation */}
      <FloatingNav currentPath={currentPath} onNavigate={onNavigate} />

      {/* Contextual Sub-bar (Breadcrumbs & Actions) */}
      <section className="border-b border-slate-200/80 bg-white/70 backdrop-blur-xs py-2.5 px-4 sm:px-6">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Breadcrumb Trail */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={crumb}>
                {idx > 0 && <span className="text-slate-300">/</span>}
                <span
                  className={
                    idx === breadcrumbs.length - 1
                      ? 'font-semibold text-[#090A0F]'
                      : 'hover:text-slate-800 cursor-pointer'
                  }
                >
                  {crumb}
                </span>
              </React.Fragment>
            ))}
          </div>

          {/* Action Slot */}
          {actionSlot && <div className="flex items-center gap-2">{actionSlot}</div>}
        </div>
      </section>

      {/* Main Canvas */}
      <main className="mx-auto max-w-7xl w-full flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
        {children}
      </main>
    </div>
  );
};
