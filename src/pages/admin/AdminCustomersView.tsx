import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/templates/AdminLayout';
import { Card } from '../../components/atoms/Card';
import { Button } from '../../components/atoms/Button';
import { Badge } from '../../components/atoms/Badge';
import { EmptyState } from '../../components/molecules/EmptyState';
import { adminApi } from '../../api';
import type { User } from '../../types';
import { IconUsers, IconSearch, IconEye, IconX, IconMail, IconPhone, IconMapPin, IconQrcode } from '@tabler/icons-react';
import { MeterTagModal } from '../../components/organisms/MeterTagModal';

export function AdminCustomersView() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<User[]>([]);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [statusFilter, setStatusFilter] = useState<'all' | 'verified' | 'unverified'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<User | null>(null);
  const [selectedCustomerForTag, setSelectedCustomerForTag] = useState<User | null>(null);

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.customersList({
        status: statusFilter === 'all' ? undefined : (statusFilter === 'verified' ? 'active' : 'pending'),
        per_page: 50,
      });
      setCustomers(res.data);
      setTotalCustomers(res.pagination.total);
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [statusFilter]);

  const filteredCustomers = customers.filter((cust) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const nameMatch = cust.name?.toLowerCase().includes(q) ?? false;
    const emailMatch = cust.email?.toLowerCase().includes(q) ?? false;
    const accMatch = cust.customer_profile?.account_number?.toLowerCase().includes(q) ?? false;
    const meterMatch = cust.customer_profile?.meter?.meter_number?.toLowerCase().includes(q) ?? false;
    return nameMatch || emailMatch || accMatch || meterMatch;
  });

  return (
    <AdminLayout
      title="Customers Directory"
      subtitle="Registered Accounts"
      currentPath="/admin/customers"
      onNavigate={(path) => navigate(path)}
    >
      <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-black/10 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-black tracking-tight">
          Consumer Directory
        </h1>
      </div>

      {/* Directory Filter & Search Card */}
      <Card className="p-4 bg-white shadow-[0_10px_25px_-5px_rgba(0,0,0,0.14),0_6px_10px_-4px_rgba(0,0,0,0.08)] rounded-md border border-black/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-black/60">Status:</span>
          {(['all', 'verified', 'unverified'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1 rounded text-xs capitalize transition-colors border border-black ${
                statusFilter === filter
                  ? 'bg-[#1E6FD9] text-white font-medium'
                  : 'bg-white text-black hover:bg-black/5 font-normal'
              }`}
            >
              {filter}
            </button>
          ))}
          <Badge variant="blue" className="ml-1">{totalCustomers} Consumers</Badge>
        </div>

        <div className="relative flex-1 sm:max-w-xs">
          <input
            type="text"
            className="w-full pl-7 pr-3 py-1.5 text-[14px] bg-white text-black border border-black rounded outline-none focus:border-[#1E6FD9]"
            placeholder="Search name, account, meter, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <IconSearch size={12} className="absolute left-2 top-2.5 text-black/50" />
        </div>
      </Card>

      {/* Customers Table */}
      <Card className="p-0 overflow-hidden border border-black/10 rounded-md shadow-[0_10px_25px_-5px_rgba(0,0,0,0.14),0_6px_10px_-4px_rgba(0,0,0,0.08)] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[14px]">
            <thead className="bg-white text-black border-b border-black/15">
              <tr>
                <th className="px-4 py-2 text-xs font-semibold text-black/60">Account No.</th>
                <th className="px-4 py-2 text-xs font-semibold text-black/60">Consumer Name</th>
                <th className="px-4 py-2 text-xs font-semibold text-black/60">Email & Mobile</th>
                <th className="px-4 py-2 text-xs font-semibold text-black/60">Assigned Meter</th>
                <th className="px-4 py-2 text-xs font-semibold text-black/60">Barangay</th>
                <th className="px-4 py-2 text-xs font-semibold text-black/60">Verification</th>
                <th className="px-4 py-2 text-xs font-semibold text-black/60 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-black/50">
                    Loading consumer directory...
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-black/50">
                    <EmptyState
                      title="No Consumers Found"
                      description="No registered customer accounts match your search or filter criteria."
                    />
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => {
                  const profile = cust.customer_profile;
                  const isVerified = cust.is_verified ?? (cust.status === 'active');

                  return (
                    <tr key={cust.id} className="hover:bg-black/5 transition-colors">
                      <td className="px-4 py-3 font-medium text-[#1E6FD9]">
                        {profile?.account_number || 'AWAITING-METER'}
                      </td>
                      <td className="px-4 py-3 text-black font-normal">
                        {cust.name || (profile ? `${profile.first_name} ${profile.last_name}` : 'Unknown')}
                      </td>
                      <td className="px-4 py-3 text-black/80">
                        <div>{cust.email || '—'}</div>
                        <div className="text-black/50">{cust.mobile_number || profile?.mobile_number || '—'}</div>
                      </td>
                      <td className="px-4 py-3">
                        {profile?.meter ? (
                          <span className="text-black font-normal">
                            {profile.meter.meter_number}
                          </span>
                        ) : (
                          <span className="text-black/40 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-black">
                        {profile?.barangay?.name || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={isVerified ? 'blue' : 'black'}>
                          {isVerified ? 'Verified Active' : 'Pending Verification'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {profile?.meter && (
                            <Button
                              variant="primary"
                              onClick={() => setSelectedCustomerForTag(cust)}
                              className="text-[12px] py-1 px-2.5"
                            >
                              <IconQrcode size={13} className="inline mr-1" />
                              QR Tag
                            </Button>
                          )}
                          <Button
                            variant="secondary"
                            onClick={() => setSelectedCustomer(cust)}
                            className="text-[12px] py-1 px-2.5"
                          >
                            <IconEye size={13} className="inline mr-1" />
                            View
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Inspect Customer Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg bg-white rounded-lg border border-black p-5 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-black/15 pb-2">
              <div className="flex items-center gap-2">
                <IconUsers size={14} className="text-[#1E6FD9]" />
                <h2 className="text-sm font-bold text-black">
                  Consumer Account Details
                </h2>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-black hover:text-[#1E6FD9] p-1 font-normal"
              >
                <IconX size={14} />
              </button>
            </div>

            <div className="space-y-3 bg-white p-3 rounded border border-black/15">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-xs text-black/60 font-medium block">
                    Full Name
                  </span>
                  <span className="text-sm font-normal text-black">
                    {selectedCustomer.name ||
                      (selectedCustomer.customer_profile
                        ? `${selectedCustomer.customer_profile.first_name} ${selectedCustomer.customer_profile.last_name}`
                        : 'Customer')}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-black/60 font-medium block">
                    Account Reference
                  </span>
                  <span className="text-sm font-medium text-[#1E6FD9]">
                    {selectedCustomer.customer_profile?.account_number || 'AWAITING-VERIFICATION'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 border-t border-black/10 pt-2">
                <div>
                  <span className="text-xs text-black/60 font-medium block">
                    Email Address
                  </span>
                  <span className="text-sm text-black flex items-center gap-1 font-normal">
                    <IconMail size={10} className="text-black/50" />
                    {selectedCustomer.email || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-black/60 font-medium block">
                    Mobile Phone
                  </span>
                  <span className="text-sm text-black flex items-center gap-1 font-normal">
                    <IconPhone size={10} className="text-black/50" />
                    {selectedCustomer.mobile_number || selectedCustomer.customer_profile?.mobile_number || 'N/A'}
                  </span>
                </div>
              </div>

              <div className="border-t border-black/10 pt-2">
                <span className="text-xs text-black/60 font-medium block">
                  Installation Address
                </span>
                <span className="text-sm text-black flex items-center gap-1 font-normal">
                  <IconMapPin size={10} className="text-black/50 shrink-0" />
                  {selectedCustomer.customer_profile?.address || 'N/A'},{' '}
                  {selectedCustomer.customer_profile?.barangay?.name || 'Sinacaban'}
                </span>
              </div>
            </div>

            {/* Meter Connection Info */}
            <div className="border border-black/15 p-3 rounded space-y-2 bg-white">
              <h3 className="text-xs font-bold text-black block">
                Physical Meter Connection
              </h3>
              {selectedCustomer.customer_profile?.meter ? (
                <div className="grid grid-cols-2 gap-2 text-[14px]">
                  <div>
                    <span className="text-black/60 block">Meter Number:</span>
                    <strong className="text-black">
                      {selectedCustomer.customer_profile.meter.meter_number}
                    </strong>
                  </div>
                  <div>
                    <span className="text-black/60 block">Meter Status:</span>
                    <Badge variant="blue">
                      {selectedCustomer.customer_profile.meter.status}
                    </Badge>
                  </div>
                  <div className="col-span-2">
                    <span className="text-black/60 block">Digital QR Token:</span>
                    <span className="text-black bg-white px-1.5 py-0.5 border border-black/20 rounded font-normal text-[14px]">
                      {selectedCustomer.customer_profile.meter.qr_token}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-[14px] text-black/60 italic p-2 bg-white border border-black/10 rounded">
                  No meter assigned.
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-black/15">
              {selectedCustomer.customer_profile?.meter ? (
                <Button
                  variant="primary"
                  onClick={() => {
                    const target = selectedCustomer;
                    setSelectedCustomer(null);
                    setSelectedCustomerForTag(target);
                  }}
                >
                  <IconQrcode size={14} className="inline mr-1" />
                  Generate Meter Tag QR
                </Button>
              ) : <div />}
              <Button
                variant="secondary"
                onClick={() => setSelectedCustomer(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Meter Tag & QR Generator Modal */}
      {selectedCustomerForTag && (
        <MeterTagModal
          customer={selectedCustomerForTag}
          onClose={() => setSelectedCustomerForTag(null)}
        />
      )}
      </div>
    </AdminLayout>
  );
}
