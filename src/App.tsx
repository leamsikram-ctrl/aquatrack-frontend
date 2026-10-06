import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Auth Pages
import { LoginView } from './pages/auth/LoginView';

// Admin Pages
import { AdminDashboardView } from './pages/admin/AdminDashboardView';
import { AdminVerificationView } from './pages/admin/AdminVerificationView';
import { AdminRequestsView } from './pages/admin/AdminRequestsView';
import { AdminBillingImportView } from './pages/admin/AdminBillingImportView';
import { AdminInterruptionsView } from './pages/admin/AdminInterruptionsView';
import { AdminCustomersView } from './pages/admin/AdminCustomersView';
import { AdminMapView } from './pages/admin/AdminMapView';
import { AdminStaffView } from './pages/admin/AdminStaffView';
import { AdminReportsView } from './pages/admin/AdminReportsView';
import { AdminActivityLogView } from './pages/admin/AdminActivityLogView';
import { AdminSettingsView } from './pages/admin/AdminSettingsView';

// Customer Pages
import { CustomerHomeView } from './pages/customer/CustomerHomeView';
import { CustomerBillsView } from './pages/customer/CustomerBillsView';
import { CustomerRequestsView } from './pages/customer/CustomerRequestsView';
import { CustomerAdvisoriesView } from './pages/customer/CustomerAdvisoriesView';
import { CustomerProfileView } from './pages/customer/CustomerProfileView';
import { CustomerRegistrationView } from './pages/customer/CustomerRegistrationView';

// Staff Pages
import { StaffTasksView } from './pages/staff/StaffTasksView';
import { StaffScannerView } from './pages/staff/StaffScannerView';
import { StaffHistoryView } from './pages/staff/StaffHistoryView';
import { StaffProfileView } from './pages/staff/StaffProfileView';

function RootRedirect() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center text-[10px] font-bold text-black">
        Loading Sinacaban Municipal System...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (user.role === 'staff') {
    return <Navigate to="/staff/tasks" replace />;
  }

  return <Navigate to="/customer/home" replace />;
}

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public & Authentication Routes */}
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<LoginView />} />
          <Route path="/register" element={<CustomerRegistrationView />} />

          {/* Dedicated Admin Portal Routes */}
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/dashboard" element={<AdminDashboardView />} />
          <Route path="/admin/verification" element={<AdminVerificationView />} />
          <Route path="/admin/requests" element={<AdminRequestsView />} />
          <Route path="/admin/map" element={<AdminMapView />} />
          <Route path="/admin/billing" element={<AdminBillingImportView />} />
          <Route path="/admin/interruptions" element={<AdminInterruptionsView />} />
          <Route path="/admin/customers" element={<AdminCustomersView />} />
          <Route path="/admin/staff" element={<AdminStaffView />} />
          <Route path="/admin/reports" element={<AdminReportsView />} />
          <Route path="/admin/activity-log" element={<AdminActivityLogView />} />
          <Route path="/admin/settings" element={<AdminSettingsView />} />

          {/* Dedicated Customer Portal Routes */}
          <Route path="/customer" element={<Navigate to="/customer/home" replace />} />
          <Route path="/customer/home" element={<CustomerHomeView />} />
          <Route path="/customer/bills" element={<CustomerBillsView />} />
          <Route path="/customer/requests" element={<CustomerRequestsView />} />
          <Route path="/customer/advisories" element={<CustomerAdvisoriesView />} />
          <Route path="/customer/profile" element={<CustomerProfileView />} />

          {/* Customer Portal Backward Compatibility / Direct shortcuts */}
          <Route path="/home" element={<Navigate to="/customer/home" replace />} />
          <Route path="/bills" element={<Navigate to="/customer/bills" replace />} />
          <Route path="/requests" element={<Navigate to="/customer/requests" replace />} />
          <Route path="/advisories" element={<Navigate to="/customer/advisories" replace />} />
          <Route path="/profile" element={<Navigate to="/customer/profile" replace />} />

          {/* Dedicated Staff Portal Routes */}
          <Route path="/staff" element={<Navigate to="/staff/tasks" replace />} />
          <Route path="/staff/tasks" element={<StaffTasksView />} />
          <Route path="/staff/scan" element={<StaffScannerView />} />
          <Route path="/staff/history" element={<StaffHistoryView />} />
          <Route path="/staff/profile" element={<StaffProfileView />} />

          {/* Fallback Catch-all Route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
