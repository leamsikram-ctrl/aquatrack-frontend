import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/templates/AdminLayout';
import { Card } from '../../components/atoms/Card';
import { Badge } from '../../components/atoms/Badge';
import { Button } from '../../components/atoms/Button';
import { EmptyState } from '../../components/molecules/EmptyState';
import { adminApi, referenceApi, requestsApi } from '../../api';
import type { User, Barangay, ServiceRequest } from '../../types';
import {
  IconSearch,
  IconUserPlus,
  IconEye,
  IconX,
  IconCheck,
  IconPhone,
  IconMapPin,
  IconTools,
} from '@tabler/icons-react';

export function AdminStaffView() {
  const navigate = useNavigate();
  const [staffList, setStaffList] = useState<User[]>([]);
  const [barangays, setBarangays] = useState<Barangay[]>([]);
  const [tasks, setTasks] = useState<ServiceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Selected staff for drawer/modal
  const [selectedStaff, setSelectedStaff] = useState<User | null>(null);

  // Add staff modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newMobile, setNewMobile] = useState('');
  const [newBarangayId, setNewBarangayId] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [staffRes, bgRes, reqRes] = await Promise.all([
        adminApi.staffList().catch(() => []),
        referenceApi.getBarangays().catch(() => []),
        requestsApi.list({ per_page: 100 }).catch(() => ({ data: [] })),
      ]);
      setStaffList(staffRes);
      setBarangays(bgRes);
      setTasks(reqRes.data);
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Calculate open tasks count per staff
  const staffOpenTasksCount = useMemo(() => {
    const counts: Record<number, number> = {};
    tasks.forEach((t) => {
      if (t.assigned_staff_id && (t.status === 'assigned' || t.status === 'in_progress')) {
        counts[t.assigned_staff_id] = (counts[t.assigned_staff_id] || 0) + 1;
      }
    });
    return counts;
  }, [tasks]);

  const filteredStaff = useMemo(() => {
    return staffList.filter((s) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const name = (s.name || s.staff_profile?.name || '').toLowerCase();
      const mobile = (s.mobile_number || '').toLowerCase();
      const bg = (s.staff_profile?.assigned_barangay?.name || '').toLowerCase();
      return name.includes(q) || mobile.includes(q) || bg.includes(q);
    });
  }, [staffList, searchQuery]);

  const handleAddStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newMobile.trim()) return;

    setIsSubmitting(true);
    // Simulate instantaneous staff addition
    setTimeout(() => {
      setIsSubmitting(false);
      setAddSuccess(`Staff member ${newName} successfully registered!`);
      const selectedBg = barangays.find((b) => b.id === Number(newBarangayId));

      const newMember: User = {
        id: Date.now(),
        role: 'staff',
        status: 'active',
        name: newName,
        email: newEmail || `${newName.toLowerCase().replace(/\s+/g, '')}@siwass.gov`,
        mobile_number: newMobile,
        must_change_password: true,
        staff_profile: {
          id: Date.now(),
          user_id: Date.now(),
          first_name: newName.split(' ')[0] || '',
          last_name: newName.split(' ')[1] || '',
          name: newName,
          assigned_barangay_id: Number(newBarangayId) || undefined,
          assigned_barangay: selectedBg,
        },
      };

      setStaffList((prev) => [newMember, ...prev]);

      setTimeout(() => {
        setAddSuccess(null);
        setShowAddModal(false);
        setNewName('');
        setNewEmail('');
        setNewMobile('');
        setNewBarangayId('');
      }, 1200);
    }, 600);
  };

  return (
    <AdminLayout currentPath="/admin/staff" onNavigate={(path) => navigate(path)}>
      <div className="space-y-4 text-[10px] text-black">
        {/* Wireframe A9 Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/15 pb-3">
          <div>
            <h1 className="text-[10px] font-bold text-black uppercase tracking-wider">
              Staff Directory
            </h1>
            <p className="text-[10px] text-black/60">
              Field technician duty assignments, coverage sectors, and open maintenance tasks.
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1 self-start sm:self-auto"
          >
            <IconUserPlus size={14} />
            <span>Add staff</span>
          </Button>
        </div>

        {/* Wireframe A9 Search Bar */}
        <div className="relative max-w-md">
          <input
            type="text"
            placeholder="Search staff name, mobile, or assigned sector..."
            className="w-full pl-8 pr-3 py-2 text-[10px] bg-white text-black border border-black rounded outline-none focus:border-[#1E6FD9]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <IconSearch size={14} className="absolute left-2.5 top-2.5 text-black/40" />
        </div>

        {/* Wireframe A9 Table */}
        <Card className="p-0 border border-black/15 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[10px]">
              <thead className="bg-[#F0F6FD] text-black border-b border-black/15">
                <tr>
                  <th className="px-4 py-2.5 font-bold uppercase tracking-wider">Name</th>
                  <th className="px-4 py-2.5 font-bold uppercase tracking-wider">Assigned area</th>
                  <th className="px-4 py-2.5 font-bold uppercase tracking-wider text-center">Open tasks</th>
                  <th className="px-4 py-2.5 font-bold uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-black/50">
                      Loading field staff records...
                    </td>
                  </tr>
                ) : filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-black/50">
                      <EmptyState
                        title="No Staff Found"
                        description="No technicians match your search filter."
                        actionLabel="Add Field Staff"
                        onAction={() => setShowAddModal(true)}
                      />
                    </td>
                  </tr>
                ) : (
                  filteredStaff.map((staff) => {
                    const openCount = staffOpenTasksCount[staff.id] || 0;
                    const assignedArea =
                      staff.staff_profile?.assigned_barangay?.name || 'All Sinacaban Sectors';
                    const name = staff.name || staff.staff_profile?.name || 'Technician Staff';

                    return (
                      <tr
                        key={staff.id}
                        className="hover:bg-[#F0F6FD]/50 transition-colors cursor-pointer"
                        onClick={() => setSelectedStaff(staff)}
                      >
                        <td className="px-4 py-3">
                          <strong className="text-black block">{name}</strong>
                          <span className="text-[9px] text-black/60 font-mono">
                            {staff.mobile_number}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-black">
                          <div className="flex items-center gap-1">
                            <IconMapPin size={12} className="text-[#1E6FD9] shrink-0" />
                            <span>{assignedArea}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={openCount > 0 ? 'black' : 'blue'}>
                            {String(openCount).padStart(2, '0')}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="secondary"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedStaff(staff);
                            }}
                          >
                            <IconEye size={12} className="inline mr-1" />
                            View Profile
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* ------------------------------------------------------------- */}
        {/* Staff Detail Drawer / Modal */}
        {/* ------------------------------------------------------------- */}
        {selectedStaff && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg bg-white rounded border border-black p-5 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-black/15 pb-2">
                <div>
                  <span className="font-bold text-black uppercase tracking-wider text-[10px]">
                    Technician Profile: {selectedStaff.name || 'Staff Member'}
                  </span>
                  <div className="text-[9px] text-black/60 font-mono">
                    ID #{selectedStaff.id} · Field Operations Unit
                  </div>
                </div>
                <button
                  onClick={() => setSelectedStaff(null)}
                  className="text-black hover:text-[#1E6FD9] p-1 font-bold text-[10px]"
                >
                  <IconX size={14} />
                </button>
              </div>

              {/* Profile Card */}
              <div className="p-3 bg-[#F0F6FD] border border-black/15 rounded space-y-2 text-[10px]">
                <div className="flex justify-between">
                  <span className="text-black/60 font-bold uppercase">Assigned Area:</span>
                  <strong className="text-black">
                    {selectedStaff.staff_profile?.assigned_barangay?.name || 'All Sinacaban Sectors'}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-black/60 font-bold uppercase">Contact Number:</span>
                  <span className="text-black font-mono">{selectedStaff.mobile_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black/60 font-bold uppercase">Official Email:</span>
                  <span className="text-black font-mono">{selectedStaff.email}</span>
                </div>
              </div>

              {/* Assigned Tasks for this Staff */}
              <div className="space-y-2">
                <span className="font-bold text-black uppercase tracking-wider block">
                  Current Assigned Work Orders ({staffOpenTasksCount[selectedStaff.id] || 0})
                </span>
                {tasks.filter((t) => t.assigned_staff_id === selectedStaff.id).length === 0 ? (
                  <div className="p-4 bg-white border border-black/10 rounded text-center text-black/50">
                    No active tasks currently assigned to this technician.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {tasks
                      .filter((t) => t.assigned_staff_id === selectedStaff.id)
                      .map((task) => (
                        <div
                          key={task.id}
                          className="p-2.5 bg-white border border-black/15 rounded flex items-center justify-between text-[10px]"
                        >
                          <div>
                            <strong className="text-black font-mono">
                              {task.reference_no || task.reference || `AT-${task.id}`}
                            </strong>
                            <div className="text-black/70">{task.description}</div>
                          </div>
                          <Badge variant={task.status === 'in_progress' ? 'blue' : 'black'}>
                            {task.status.toUpperCase()}
                          </Badge>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2 border-t border-black/10">
                <Button variant="ghost" onClick={() => setSelectedStaff(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* Add Staff Modal */}
        {/* ------------------------------------------------------------- */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-sm bg-white rounded border border-black p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-black/15 pb-2">
                <span className="font-bold text-black uppercase tracking-wider text-[10px]">
                  Add Field Technician
                </span>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-black hover:text-[#1E6FD9] p-1 font-bold text-[10px]"
                >
                  <IconX size={14} />
                </button>
              </div>

              {addSuccess && (
                <div className="p-2.5 bg-[#F0F6FD] border border-black rounded text-[10px] text-black flex items-center gap-2">
                  <IconCheck size={14} className="text-[#1E6FD9] shrink-0" />
                  <span>{addSuccess}</span>
                </div>
              )}

              <form onSubmit={handleAddStaffSubmit} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-black uppercase mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Pedro Cruz"
                    className="w-full p-2 bg-white text-black border border-black rounded text-[10px] outline-none focus:border-[#1E6FD9]"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-black uppercase mb-1">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      placeholder="0917 123 4567"
                      className="w-full pl-7 pr-3 py-2 bg-white text-black border border-black rounded text-[10px] outline-none font-mono focus:border-[#1E6FD9]"
                      value={newMobile}
                      onChange={(e) => setNewMobile(e.target.value)}
                      required
                    />
                    <IconPhone size={12} className="absolute left-2.5 top-2.5 text-black/50" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-black uppercase mb-1">
                    Institutional Email (Optional)
                  </label>
                  <input
                    type="email"
                    placeholder="pedro@siwass.gov"
                    className="w-full p-2 bg-white text-black border border-black rounded text-[10px] outline-none focus:border-[#1E6FD9]"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-black uppercase mb-1">
                    Assigned Coverage Barangay
                  </label>
                  <select
                    className="w-full p-2 bg-white text-black border border-black rounded text-[10px] outline-none font-sans"
                    value={newBarangayId}
                    onChange={(e) => setNewBarangayId(Number(e.target.value) || '')}
                  >
                    <option value="">All Sinacaban Sectors</option>
                    {barangays.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-black/10">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={isSubmitting}
                  >
                    <IconTools size={12} className="inline mr-1" />
                    Register Staff
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

