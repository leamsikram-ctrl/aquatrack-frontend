import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/templates/AdminLayout';
import { Card } from '../../components/atoms/Card';
import { Button } from '../../components/atoms/Button';
import { Badge } from '../../components/atoms/Badge';
import { EmptyState } from '../../components/molecules/EmptyState';
import { adminApi, referenceApi } from '../../api';
import type { User, Barangay } from '../../types';
import { IconSearch, IconPlus, IconX } from '@tabler/icons-react';

export function AdminStaffView() {
  const navigate = useNavigate();
  const [staffMembers, setStaffMembers] = useState<User[]>([]);
  const [barangays, setBarangays] = useState<Barangay[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Add staff modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffMobile, setNewStaffMobile] = useState('');
  const [selectedBarangayId, setSelectedBarangayId] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Selected staff inspection modal
  const [inspectingStaff, setInspectingStaff] = useState<User | null>(null);

  const fetchStaff = async () => {
    setIsLoading(true);
    try {
      const [staffData, barangayData] = await Promise.all([
        adminApi.staffList(),
        referenceApi.getBarangays().catch(() => []),
      ]);
      setStaffMembers(staffData);
      setBarangays(barangayData);
      if (barangayData.length > 0) {
        setSelectedBarangayId(barangayData[0].id);
      }
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const filteredStaff = staffMembers.filter((staff) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const nameMatch = staff.name?.toLowerCase().includes(q) ?? false;
    const emailMatch = staff.email?.toLowerCase().includes(q) ?? false;
    const phoneMatch = staff.mobile_number?.toLowerCase().includes(q) ?? false;
    return nameMatch || emailMatch || phoneMatch;
  });

  const handleAddStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate adding staff member to local state and municipal records
    setTimeout(() => {
      const newStaff: User = {
        id: Date.now(),
        role: 'staff',
        status: 'active',
        name: newStaffName,
        email: newStaffEmail,
        mobile_number: newStaffMobile,
        must_change_password: false,
        staff_profile: {
          id: Date.now(),
          user_id: Date.now(),
          first_name: newStaffName.split(' ')[0],
          last_name: newStaffName.split(' ').slice(1).join(' ') || 'Staff',
          name: newStaffName,
          assigned_barangay_id: Number(selectedBarangayId),
          assigned_barangay: barangays.find((b) => b.id === Number(selectedBarangayId)),
        },
      };

      setStaffMembers([newStaff, ...staffMembers]);
      setShowAddModal(false);
      setNewStaffName('');
      setNewStaffEmail('');
      setNewStaffMobile('');
      setIsSubmitting(false);
      alert(`Staff member ${newStaffName} registered successfully!`);
    }, 500);
  };

  return (
    <AdminLayout
      title="Staff Management"
      subtitle="Field Technicians & Meter Readers"
      currentPath="/admin/staff"
      onNavigate={(path) => navigate(path)}
    >
      <div className="space-y-4">
        {/* Header - Matches Wireframe A9 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/15 pb-3">
          <div>
            <h1 className="text-[10px] font-bold text-black uppercase tracking-wider">
              Staff Directory & Operations
            </h1>
            <p className="text-[10px] text-black/60">
              Manage Sinacaban municipal field technicians, zone assignments, and open task queues.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="primary" onClick={() => setShowAddModal(true)}>
              <IconPlus size={12} className="inline mr-1" />
              Add staff
            </Button>
          </div>
        </div>

        {/* Search bar */}
        <div className="flex items-center justify-between gap-3">
          <div className="relative flex-1 sm:max-w-xs">
            <input
              type="text"
              placeholder="Search staff name or mobile..."
              className="w-full pl-7 pr-3 py-1.5 text-[10px] bg-white text-black border border-black rounded outline-none focus:border-[#1E6FD9]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <IconSearch size={12} className="absolute left-2.5 top-2.5 text-black/50" />
          </div>
          <Badge variant="blue">{staffMembers.length} Active Technicians</Badge>
        </div>

        {/* Staff Table - Matches Wireframe A9 Columns */}
        <Card className="p-0 overflow-hidden border border-black/15">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[10px]">
              <thead className="bg-[#F0F6FD] text-black border-b border-black/15">
                <tr>
                  <th className="px-4 py-2 font-bold uppercase">Name</th>
                  <th className="px-4 py-2 font-bold uppercase">Assigned area</th>
                  <th className="px-4 py-2 font-bold uppercase">Contact info</th>
                  <th className="px-4 py-2 font-bold uppercase">Open tasks</th>
                  <th className="px-4 py-2 font-bold uppercase text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-black/50">
                      Loading staff records...
                    </td>
                  </tr>
                ) : filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-black/50">
                      <EmptyState
                        title="No Staff Found"
                        description="No registered staff members match your search criteria."
                      />
                    </td>
                  </tr>
                ) : (
                  filteredStaff.map((staff) => (
                    <tr
                      key={staff.id}
                      className="hover:bg-[#F0F6FD]/50 transition-colors cursor-pointer"
                      onClick={() => setInspectingStaff(staff)}
                    >
                      <td className="px-4 py-2.5 font-bold text-black">
                        {staff.name || 'Technician'}
                      </td>
                      <td className="px-4 py-2.5 text-black">
                        {staff.staff_profile?.assigned_barangay?.name || 'Poblacion'}
                      </td>
                      <td className="px-4 py-2.5 text-black/70">
                        <div>{staff.email}</div>
                        <div className="text-black/50">{staff.mobile_number}</div>
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge variant="blue">01</Badge>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <Button
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            setInspectingStaff(staff);
                          }}
                        >
                          View Profile
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Add Staff Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md bg-white rounded-lg border border-black p-5 space-y-3 shadow-xl">
              <div className="flex items-center justify-between border-b border-black/15 pb-2">
                <span className="font-bold text-black uppercase tracking-wider text-[10px]">
                  Register Municipal Field Staff
                </span>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-black hover:text-[#1E6FD9] p-1 font-bold"
                >
                  <IconX size={14} />
                </button>
              </div>

              <form onSubmit={handleAddStaffSubmit} className="space-y-3 text-[10px]">
                <div>
                  <label className="block font-bold text-black uppercase mb-1">
                    Staff Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Juan Technician"
                    className="w-full p-2 bg-white text-black border border-black rounded outline-none focus:border-[#1E6FD9]"
                    value={newStaffName}
                    onChange={(e) => setNewStaffName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block font-bold text-black uppercase mb-1">
                    Official Email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. technician@siwass.gov"
                    className="w-full p-2 bg-white text-black border border-black rounded outline-none focus:border-[#1E6FD9]"
                    value={newStaffEmail}
                    onChange={(e) => setNewStaffEmail(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block font-bold text-black uppercase mb-1">
                    Mobile Contact Number
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="0917-000-0000"
                    className="w-full p-2 bg-white text-black border border-black rounded outline-none focus:border-[#1E6FD9]"
                    value={newStaffMobile}
                    onChange={(e) => setNewStaffMobile(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block font-bold text-black uppercase mb-1">
                    Assigned Barangay Zone
                  </label>
                  <select
                    className="w-full p-2 bg-white text-black border border-black rounded outline-none focus:border-[#1E6FD9]"
                    value={selectedBarangayId}
                    onChange={(e) => setSelectedBarangayId(Number(e.target.value))}
                  >
                    {barangays.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-black/15">
                  <Button
                    variant="secondary"
                    type="button"
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    type="submit"
                    isLoading={isSubmitting}
                  >
                    Register Staff
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Inspect Staff Modal */}
        {inspectingStaff && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md bg-white rounded-lg border border-black p-5 space-y-3 shadow-xl text-[10px]">
              <div className="flex items-center justify-between border-b border-black/15 pb-2">
                <span className="font-bold text-black uppercase tracking-wider">
                  Technician Profile ({inspectingStaff.name})
                </span>
                <button
                  onClick={() => setInspectingStaff(null)}
                  className="text-black hover:text-[#1E6FD9] p-1 font-bold"
                >
                  <IconX size={14} />
                </button>
              </div>

              <div className="space-y-2 bg-[#F0F6FD] p-3 rounded border border-black/10">
                <div className="flex justify-between">
                  <span className="text-black/60 font-bold uppercase">Role:</span>
                  <Badge variant="blue">Field Technician</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-black/60 font-bold uppercase">Assigned Area:</span>
                  <strong className="text-black">
                    {inspectingStaff.staff_profile?.assigned_barangay?.name || 'Poblacion Zone 1'}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-black/60 font-bold uppercase">Email:</span>
                  <span className="text-black">{inspectingStaff.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black/60 font-bold uppercase">Mobile:</span>
                  <span className="text-black">{inspectingStaff.mobile_number}</span>
                </div>
              </div>

              <div className="border border-black/15 p-3 rounded space-y-1.5">
                <span className="font-bold text-black uppercase block">Active Assignments</span>
                <p className="text-black/70">
                  Currently dispatched on <strong>1 active emergency service ticket</strong>.
                </p>
              </div>

              <div className="flex justify-end pt-2 border-t border-black/15">
                <Button
                  variant="primary"
                  onClick={() => setInspectingStaff(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
