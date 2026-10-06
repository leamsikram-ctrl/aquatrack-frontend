import { useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { AdminDashboardView } from './pages/admin/AdminDashboardView';
import { CustomerHomeView } from './pages/customer/CustomerHomeView';
import { StaffTasksView } from './pages/staff/StaffTasksView';

export function App() {
  const [activePortal, setActivePortal] = useState<'admin' | 'customer' | 'staff'>('admin');

  return (
    <AuthProvider>
      <div className="text-black bg-white min-h-screen text-sm">
        {/* Top Portal Switcher Bar */}
        <div className="bg-black text-white px-4 py-2 flex items-center justify-between text-sm border-b border-black">
          <div className="flex items-center gap-3">
            <span className="font-bold">AquaTrack Portal:</span>
            <div className="inline-flex gap-1">
              {(['admin', 'customer', 'staff'] as const).map((portal) => (
                <button
                  key={portal}
                  onClick={() => setActivePortal(portal)}
                  className={`px-3 py-1 rounded-md capitalize font-medium text-sm transition-colors ${
                    activePortal === portal
                      ? 'bg-[#1E6FD9] text-white font-bold'
                      : 'bg-white text-black hover:bg-[#F0F6FD]'
                  }`}
                >
                  {portal} View
                </button>
              ))}
            </div>
          </div>
          <span className="text-sm hidden sm:inline text-white/80">
            SIWASS · Connected to Live Backend API
          </span>
        </div>

        {/* Live Connected Portal Pages */}
        {activePortal === 'admin' && <AdminDashboardView />}
        {activePortal === 'customer' && <CustomerHomeView />}
        {activePortal === 'staff' && <StaffTasksView />}
      </div>
    </AuthProvider>
  );
}

export default App;
