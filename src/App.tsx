import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AdminUIProvider } from './contexts/AdminUIContext';

// Public Pages
import { LandingView } from './pages/public/LandingView';
import { LoginView } from './pages/auth/LoginView';
import { NotFoundView } from './pages/public/NotFoundView';
import { ErrorBoundary } from './components/organisms/ErrorBoundary';

// Admin Pages
import { AdminDashboardView } from './pages/admin/AdminDashboardView';
import { AdminVerificationView } from './pages/admin/AdminVerificationView';
import { AdminMaintenanceView } from './pages/admin/AdminMaintenanceView';
import { AdminUsersView } from './pages/admin/AdminUsersView';
import { AdminBillingImportView } from './pages/admin/AdminBillingImportView';
import { AdminInterruptionsView } from './pages/admin/AdminInterruptionsView';
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


export function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AdminUIProvider>
          <BrowserRouter>
            <Routes>
              {/* Public & Authentication Routes */}
              <Route path="/" element={<LandingView />} />
              <Route path="/landing" element={<LandingView />} />
              <Route path="/login" element={<LoginView />} />
              <Route path="/register" element={<CustomerRegistrationView />} />

              {/* Dedicated Admin Portal Routes */}
              <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="/admin/dashboard" element={<AdminDashboardView />} />
              <Route path="/admin/verification" element={<AdminVerificationView />} />
              <Route path="/admin/maintenance" element={<AdminMaintenanceView />} />
              <Route path="/admin/requests" element={<Navigate to="/admin/maintenance" replace />} />
              <Route path="/admin/map" element={<Navigate to="/admin/maintenance?view=map" replace />} />
              <Route path="/admin/users" element={<AdminUsersView />} />
              <Route path="/admin/customers" element={<Navigate to="/admin/users?role=consumer" replace />} />
              <Route path="/admin/staff" element={<Navigate to="/admin/users?role=staff" replace />} />
              <Route path="/admin/billing" element={<AdminBillingImportView />} />
              <Route path="/admin/interruptions" element={<AdminInterruptionsView />} />
              <Route path="/admin/reports" element={<AdminReportsView />} />
              <Route path="/admin/activity-log" element={<AdminActivityLogView />} />
              <Route path="/admin/settings" element={<AdminSettingsView />} />

              {/* Dedicated Customer Portal Routes */}
              <Route path="/customer" element={<Navigate to="/customer/home" replace />} />
              <Route path="/customer/home" element={<CustomerHomeView />} />
              <Route path="/customer/bills" element={<CustomerBillsView />} />
              <Route path="/customer/requests" element={<CustomerRequestsView />} />
              <Route path="/advisories" element={<Navigate to="/customer/advisories" replace />} />
              <Route path="/customer/advisories" element={<CustomerAdvisoriesView />} />
              <Route path="/customer/profile" element={<CustomerProfileView />} />
              <Route path="/customer/settings" element={<Navigate to="/customer/profile" replace />} />

              {/* Customer Portal Backward Compatibility / Direct shortcuts */}
              <Route path="/home" element={<Navigate to="/customer/home" replace />} />
              <Route path="/bills" element={<Navigate to="/customer/bills" replace />} />
              <Route path="/requests" element={<Navigate to="/customer/requests" replace />} />
              <Route path="/profile" element={<Navigate to="/customer/profile" replace />} />
              <Route path="/settings" element={<Navigate to="/customer/profile" replace />} />

              {/* Dedicated Staff Portal Routes */}
              <Route path="/staff" element={<Navigate to="/staff/tasks" replace />} />
              <Route path="/staff/tasks" element={<StaffTasksView />} />
              <Route path="/staff/scan" element={<StaffScannerView />} />
              <Route path="/staff/history" element={<StaffHistoryView />} />
              <Route path="/staff/profile" element={<StaffProfileView />} />
              <Route path="/staff/settings" element={<Navigate to="/staff/profile" replace />} />

              {/* Fallback Catch-all Route */}
              <Route path="*" element={<NotFoundView />} />
            </Routes>
          </BrowserRouter>
        </AdminUIProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
