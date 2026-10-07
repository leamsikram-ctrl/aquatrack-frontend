import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/templates/AdminLayout';
import { Card } from '../../components/atoms/Card';
import { Button } from '../../components/atoms/Button';
import { EmptyState } from '../../components/molecules/EmptyState';
import { IconSearch, IconCalendar } from '@tabler/icons-react';

interface AuditLogEntry {
  id: string;
  time: string;
  user: string;
  role: string;
  action: string;
  category: 'assignment' | 'urgency_override' | 'resolution' | 'verification' | 'billing';
}

export function AdminActivityLogView() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showDateRangeModal, setShowDateRangeModal] = useState(false);
  const [startDate, setStartDate] = useState('2026-10-01');
  const [endDate, setEndDate] = useState('2026-10-31');

  // Municipal Activity Audit Log records (matching Wireframe A12)
  const logs: AuditLogEntry[] = [
    {
      id: 'log-1',
      time: '2026-10-07 09:30 AM',
      user: 'Administrator (Admin User)',
      role: 'Admin',
      action: 'Assigned AT-0001 to Technician Pedro Cruz',
      category: 'assignment',
    },
    {
      id: 'log-2',
      time: '2026-10-07 09:15 AM',
      user: 'Administrator (Admin User)',
      role: 'Admin',
      action: 'Adjusted urgency, AT-0001: Raised to HIGH (Hospital main feeder pipe)',
      category: 'urgency_override',
    },
    {
      id: 'log-3',
      time: '2026-10-07 08:45 AM',
      user: 'Pedro Cruz (Field Technician)',
      role: 'Staff',
      action: 'Resolved AT-0002: Replaced defective gate valve at Poblacion Purok 2',
      category: 'resolution',
    },
    {
      id: 'log-4',
      time: '2026-10-06 04:20 PM',
      user: 'Administrator (Admin User)',
      role: 'Admin',
      action: 'Verified registration and linked meter MTR-SIN-0003 for consumer Maria Santos',
      category: 'verification',
    },
    {
      id: 'log-5',
      time: '2026-10-06 02:10 PM',
      user: 'Administrator (Admin User)',
      role: 'Admin',
      action: 'Published billing batch for October 2026 (48 consumer accounts)',
      category: 'billing',
    },
    {
      id: 'log-6',
      time: '2026-10-06 11:00 AM',
      user: 'Juan Technician (Staff)',
      role: 'Staff',
      action: 'Resolved AT-0003: Cleared line sediment obstruction at San Isidro',
      category: 'resolution',
    },
    {
      id: 'log-7',
      time: '2026-10-05 03:40 PM',
      user: 'Administrator (Admin User)',
      role: 'Admin',
      action: 'Broadcasted Water Interruption Advisory #104 for Poblacion & San Isidro',
      category: 'assignment',
    },
  ];

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (selectedCategory !== 'all' && log.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const text = `${log.time} ${log.user} ${log.action}`.toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    });
  }, [logs, selectedCategory, searchQuery]);

  return (
    <AdminLayout currentPath="/admin/activity-log" onNavigate={(path) => navigate(path)}>
      <div className="space-y-4 text-[10px] text-black">
        {/* Wireframe A12 Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/15 pb-3">
          <div>
            <h1 className="text-[10px] font-bold text-black uppercase tracking-wider">
              Activity Log
            </h1>
            <p className="text-[10px] text-black/60">
              Immutable institutional audit trail of dispatch orders, urgency overrides, and staff resolutions.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-black/60 bg-[#F0F6FD] px-2 py-1 border border-black/15 rounded">
              {filteredLogs.length} Logged Events
            </span>
          </div>
        </div>

        {/* Wireframe A12 Filter Bar: Search & Date Range */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full sm:max-w-md">
            <input
              type="text"
              placeholder="Search user, action, or request reference..."
              className="w-full pl-8 pr-3 py-2 text-[10px] bg-white text-black border border-black rounded outline-none focus:border-[#1E6FD9]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <IconSearch size={14} className="absolute left-2.5 top-2.5 text-black/40" />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="p-2 bg-white border border-black rounded text-[10px] outline-none font-sans"
            >
              <option value="all">Category ∨ (All)</option>
              <option value="assignment">Assignments</option>
              <option value="urgency_override">Urgency Overrides</option>
              <option value="resolution">Staff Resolutions</option>
              <option value="verification">Verifications</option>
              <option value="billing">Billing Imports</option>
            </select>

            <Button
              variant="secondary"
              onClick={() => setShowDateRangeModal(true)}
              className="flex items-center gap-1.5"
            >
              <IconCalendar size={13} />
              <span>Date range</span>
            </Button>
          </div>
        </div>

        {/* Wireframe A12 Table: Time, User, Action */}
        <Card className="p-0 border border-black/15 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[10px]">
              <thead className="bg-[#F0F6FD] text-black border-b border-black/15">
                <tr>
                  <th className="px-4 py-2.5 font-bold uppercase tracking-wider w-40">Time</th>
                  <th className="px-4 py-2.5 font-bold uppercase tracking-wider w-52">User</th>
                  <th className="px-4 py-2.5 font-bold uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-black/50">
                      <EmptyState
                        title="No Activity Logs Found"
                        description="No audit records match the current criteria."
                      />
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#F0F6FD]/40 transition-colors">
                      <td className="px-4 py-3 font-normal text-black/70">
                        {log.time}
                      </td>
                      <td className="px-4 py-3">
                        <strong className="text-black block font-bold">{log.user}</strong>
                        <span className="text-[9px] text-[#1E6FD9] font-bold uppercase">
                          {log.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-black font-normal leading-relaxed">
                        {log.action}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Date Range Modal */}
        {showDateRangeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-sm bg-white rounded border border-black p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-black/15 pb-2">
                <span className="font-bold text-black uppercase tracking-wider text-[10px]">
                  Filter Activity Date Range
                </span>
                <button
                  onClick={() => setShowDateRangeModal(false)}
                  className="text-black hover:text-[#1E6FD9] p-1 font-bold text-[10px]"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-black uppercase mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-2 bg-white text-black border border-black rounded text-[10px] outline-none font-normal"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-black uppercase mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full p-2 bg-white text-black border border-black rounded text-[10px] outline-none font-normal"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-black/10">
                <Button variant="ghost" onClick={() => setShowDateRangeModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={() => setShowDateRangeModal(false)}>
                  Apply Date Range
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
