import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/templates/AdminLayout';
import { Card } from '../../components/atoms/Card';
import { Badge } from '../../components/atoms/Badge';
import { IconSearch } from '@tabler/icons-react';

interface LogEntry {
  id: number;
  time: string;
  user: string;
  role: string;
  action: string;
  badge: 'blue' | 'black';
}

export function AdminActivityLogView() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all');

  const [logs] = useState<LogEntry[]>([
    {
      id: 1,
      time: 'Oct 7, 2026 06:14 AM',
      user: 'Administrator',
      role: 'System Admin',
      action: 'Assigned AT-0001 to Technician Cruz with urgent dispatch notes',
      badge: 'blue',
    },
    {
      id: 2,
      time: 'Oct 7, 2026 05:50 AM',
      user: 'Administrator',
      role: 'System Admin',
      action: 'Adjusted urgency on AT-0001 from medium to high (school zone pipeline)',
      badge: 'blue',
    },
    {
      id: 3,
      time: 'Oct 7, 2026 04:30 AM',
      user: 'Technician Cruz',
      role: 'Field Staff',
      action: 'Marked service request AT-0000 as Resolved with evidence photo attached',
      badge: 'black',
    },
    {
      id: 4,
      time: 'Oct 6, 2026 09:15 PM',
      user: 'Administrator',
      role: 'System Admin',
      action: 'Published Water Advisory #1 for Barangay Poblacion emergency repairs',
      badge: 'blue',
    },
    {
      id: 5,
      time: 'Oct 6, 2026 08:00 PM',
      user: 'Administrator',
      role: 'System Admin',
      action: 'Verified customer Maria Santos and linked physical meter MTR-SIN-0001',
      badge: 'blue',
    },
    {
      id: 6,
      time: 'Oct 6, 2026 06:20 PM',
      user: 'Administrator',
      role: 'System Admin',
      action: 'Imported billing batch (42 consumer statements created, 0 rejected)',
      badge: 'black',
    },
  ]);

  const filteredLogs = logs.filter((log) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return log.user.toLowerCase().includes(q) || log.action.toLowerCase().includes(q);
  });

  return (
    <AdminLayout
      title="Activity Log"
      subtitle="Municipal Audit Trail"
      currentPath="/admin/activity-log"
      onNavigate={(path) => navigate(path)}
    >
      <div className="space-y-4">
        {/* Header - Matches Wireframe A12 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/15 pb-3">
          <div>
            <h1 className="text-[10px] font-bold text-black uppercase tracking-wider">
              System Activity Log & Immutable Audit Trail
            </h1>
            <p className="text-[10px] text-black/60">
              Read-only log of administrator dispatches, urgency overrides, and meter verifications.
            </p>
          </div>
          <Badge variant="blue">{logs.length} Recorded Events</Badge>
        </div>

        {/* Search and Date Range Filter - Matches Wireframe A12 */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 sm:max-w-xs">
            <input
              type="text"
              placeholder="Search user, action, or ticket..."
              className="w-full pl-7 pr-3 py-1.5 text-[10px] bg-white text-black border border-black rounded outline-none focus:border-[#1E6FD9]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <IconSearch size={12} className="absolute left-2.5 top-2.5 text-black/50" />
          </div>

          <div className="flex items-center gap-1.5 text-[10px]">
            <span className="font-bold text-black uppercase">Range:</span>
            {['all', 'today', 'this-week'].map((d) => (
              <button
                key={d}
                onClick={() => setDateFilter(d)}
                className={`px-2.5 py-1 rounded capitalize font-bold border border-black ${
                  dateFilter === d ? 'bg-[#1E6FD9] text-white' : 'bg-white text-black'
                }`}
              >
                {d.replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Audit Log Table - Matches Wireframe A12 */}
        <Card className="p-0 overflow-hidden border border-black/15">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[10px]">
              <thead className="bg-[#F0F6FD] text-black border-b border-black/15">
                <tr>
                  <th className="px-4 py-2 font-bold uppercase">Time</th>
                  <th className="px-4 py-2 font-bold uppercase">User</th>
                  <th className="px-4 py-2 font-bold uppercase">Role</th>
                  <th className="px-4 py-2 font-bold uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#F0F6FD]/50">
                    <td className="px-4 py-2.5 text-black/70 font-mono text-[9px] whitespace-nowrap">
                      {log.time}
                    </td>
                    <td className="px-4 py-2.5 font-bold text-black">{log.user}</td>
                    <td className="px-4 py-2.5">
                      <Badge variant={log.badge}>{log.role}</Badge>
                    </td>
                    <td className="px-4 py-2.5 text-black leading-relaxed">{log.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
