import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/templates/AdminLayout';
import { Card } from '../../components/atoms/Card';
import { Button } from '../../components/atoms/Button';
import { Badge } from '../../components/atoms/Badge';
import { EmptyState } from '../../components/molecules/EmptyState';
import { adminApi } from '../../api';
import type { User, Meter } from '../../types';
import { IconCheck, IconX, IconQrcode, IconMapPin } from '@tabler/icons-react';

export function AdminVerificationView() {
  const navigate = useNavigate();
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Meter Picker Modal State
  const [selectedUserForVerify, setSelectedUserForVerify] = useState<User | null>(null);
  const [availableMeters, setAvailableMeters] = useState<Meter[]>([]);
  const [selectedMeterId, setSelectedMeterId] = useState<number | null>(null);
  const [isLoadingMeters, setIsLoadingMeters] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Decline Modal State
  const [selectedUserForDecline, setSelectedUserForDecline] = useState<User | null>(null);
  const [declineRemarks, setDeclineRemarks] = useState('');
  const [isDeclining, setIsDeclining] = useState(false);

  const fetchPending = async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.pendingRegistrations();
      setPendingUsers(res.data);
    } catch {
      // Empty fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleOpenVerifyModal = async (user: User) => {
    setSelectedUserForVerify(user);
    setSelectedMeterId(null);
    setIsLoadingMeters(true);

    try {
      const barangayId = user.customer_profile?.barangay_id;
      const meters = await adminApi.availableMeters(barangayId ? { barangay_id: barangayId } : undefined);
      setAvailableMeters(meters);
      if (meters.length > 0) {
        setSelectedMeterId(meters[0].id);
      }
    } catch {
      setAvailableMeters([]);
    } finally {
      setIsLoadingMeters(false);
    }
  };

  const handleConfirmVerify = async () => {
    if (!selectedUserForVerify || !selectedMeterId) return;

    setIsVerifying(true);
    try {
      await adminApi.verifyRegistration(selectedUserForVerify.id, selectedMeterId);
      setSelectedUserForVerify(null);
      fetchPending();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      alert(errorObj?.response?.data?.message || 'Verification failed.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleConfirmDecline = async () => {
    if (!selectedUserForDecline || !declineRemarks.trim()) {
      alert('A decline reason is mandatory.');
      return;
    }

    setIsDeclining(true);
    try {
      await adminApi.declineRegistration(selectedUserForDecline.id, declineRemarks);
      setSelectedUserForDecline(null);
      setDeclineRemarks('');
      fetchPending();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      alert(errorObj?.response?.data?.message || 'Failed to decline application.');
    } finally {
      setIsDeclining(false);
    }
  };

  return (
    <AdminLayout
      title="Customer Verification"
      subtitle="Pending Registrations"
      currentPath="/admin/verification"
      onNavigate={(path) => navigate(path)}
    >
      <div className="space-y-6">
      {/* View Header */}
      <div className="flex items-center justify-between border-b border-black/10 pb-4">
        <div>
          <h1 className="text-[14px] font-bold uppercase tracking-wider text-black">
            Customer Account Verification Queue
          </h1>
          <p className="text-[14px] text-black/60">
            Review self-registered applicants, link physical water meters, and authorize municipal service
          </p>
        </div>
        <Badge variant={pendingUsers.length > 0 ? 'blue' : 'outline'}>
          {pendingUsers.length} PENDING APPLICATIONS
        </Badge>
      </div>

      {isLoading ? (
        <Card className="p-8 text-center text-black/60 border border-black/10">
          Loading pending customer registrations...
        </Card>
      ) : pendingUsers.length === 0 ? (
        <EmptyState
          title="All Applications Processed"
          description="There are currently no self-registered customer accounts awaiting administrative meter assignment or verification."
        />
      ) : (
        <div className="space-y-4">
          {pendingUsers.map((user) => {
            const profile = user.customer_profile;
            return (
              <Card key={user.id} className="p-5 border border-black/20 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black/10 pb-3">
                  <div>
                    <span className="font-bold text-black uppercase tracking-wide">
                      {profile ? `${profile.first_name} ${profile.last_name}` : 'Unknown Applicant'}
                    </span>
                    <span className="text-black/50 ml-2">ID #{user.id}</span>
                  </div>
                  <Badge variant="outline">PENDING REVIEW</Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[14px]">
                  <div>
                    <span className="font-bold text-black block">Contact Info:</span>
                    <span className="text-black/80">{user.mobile_number}</span>
                    {user.email && <span className="text-black/60 block">{user.email}</span>}
                  </div>

                  <div>
                    <span className="font-bold text-black block">Barangay & Address:</span>
                    <span className="text-black font-bold">
                      {profile?.barangay?.name ?? 'Sinacaban Barangay'}
                    </span>
                    <span className="text-black/60 block font-normal">{profile?.address}</span>
                  </div>

                  <div>
                    <span className="font-bold text-black block">Location Pin:</span>
                    {profile?.latitude && profile?.longitude ? (
                      <span className="text-black/80 flex items-center gap-1">
                        <IconMapPin size={12} className="text-[#1E6FD9]" />
                        {profile.latitude.toFixed(4)}, {profile.longitude.toFixed(4)}
                      </span>
                    ) : (
                      <span className="text-black/40 italic">Coordinates unpinned</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/10">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setSelectedUserForDecline(user);
                      setDeclineRemarks('');
                    }}
                  >
                    <IconX size={14} className="mr-1" />
                    Decline
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => handleOpenVerifyModal(user)}
                  >
                    <IconCheck size={14} className="mr-1" />
                    Link Meter & Verify
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Meter Picker Modal */}
      {selectedUserForVerify && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-black rounded-xl max-w-lg w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-black/10 pb-3">
              <div>
                <h3 className="font-bold text-black uppercase tracking-wider">
                  Link Unassigned Meter & Verify Account
                </h3>
                <p className="text-[14px] text-black/60">
                  Applicant:{' '}
                  <strong>
                    {selectedUserForVerify.customer_profile?.first_name}{' '}
                    {selectedUserForVerify.customer_profile?.last_name}
                  </strong>{' '}
                  ({selectedUserForVerify.customer_profile?.barangay?.name ?? 'Sinacaban'})
                </p>
              </div>
              <button
                onClick={() => setSelectedUserForVerify(null)}
                className="text-black hover:opacity-70 p-1"
              >
                <IconX size={18} />
              </button>
            </div>

            {isLoadingMeters ? (
              <div className="p-8 text-center text-black/60">
                Checking available unassigned meters in inventory...
              </div>
            ) : availableMeters.length === 0 ? (
              <div className="p-4 bg-white border border-black/20 rounded-lg space-y-2">
                <span className="font-bold text-black block">No Unassigned Meters Found</span>
                <p className="text-[14px] text-black/70">
                  There are currently no meters in inventory with status <code>unassigned</code> for this barangay. Please add a new meter in the inventory before verifying this customer.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <label className="block font-bold text-black uppercase tracking-wider text-[14px]">
                  Select Pre-Loaded Sinacaban Water Meter:
                </label>
                <div className="max-h-60 overflow-y-auto space-y-2 border border-black/10 rounded-lg p-2">
                  {availableMeters.map((m) => {
                    const isSelected = selectedMeterId === m.id;
                    return (
                      <div
                        key={m.id}
                        onClick={() => setSelectedMeterId(m.id)}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors flex items-center justify-between ${
                          isSelected
                            ? 'bg-[#1E6FD9] text-white border-black font-bold'
                            : 'bg-white text-black border-black/10 hover:bg-[#F0F6FD]'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span>Meter #{m.meter_number}</span>
                            <Badge variant={isSelected ? 'outline' : 'blue'}>
                              {m.status.toUpperCase()}
                            </Badge>
                          </div>
                          <div className={`text-[14px] ${isSelected ? 'text-white/80' : 'text-black/60'}`}>
                            Token: {m.qr_token.substring(0, 16)}...
                          </div>
                        </div>
                        <IconQrcode size={18} />
                      </div>
                    );
                  })}
                </div>

                <div className="p-3 bg-[#F0F6FD] border border-black/10 rounded-lg text-[14px] text-black/80 space-y-1">
                  <span className="font-bold text-black block">Automated Verification Actions:</span>
                  <ul className="list-disc pl-4 space-y-0.5">
                    <li>Generates permanent <strong>ACC-YYYY-####</strong> account number</li>
                    <li>Sets account status to <strong>ACTIVE</strong></li>
                    <li>Marks meter status as <strong>ACTIVE</strong></li>
                    <li>Prepares secure QR token for physical tag printing</li>
                  </ul>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-black/10">
              <Button
                variant="ghost"
                onClick={() => setSelectedUserForVerify(null)}
                disabled={isVerifying}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmVerify}
                disabled={!selectedMeterId || isVerifying || availableMeters.length === 0}
              >
                {isVerifying ? 'Verifying & Linking...' : 'Confirm Verification'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Decline Remarks Modal */}
      {selectedUserForDecline && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-black rounded-xl max-w-md w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-black/10 pb-3">
              <h3 className="font-bold text-black uppercase tracking-wider">
                Decline Customer Application
              </h3>
              <button
                onClick={() => setSelectedUserForDecline(null)}
                className="text-black hover:opacity-70 p-1"
              >
                <IconX size={18} />
              </button>
            </div>

            <div className="space-y-2">
              <label className="block font-bold text-black text-[14px]">
                Reason for Rejection (Required):
              </label>
              <textarea
                className="w-full p-2.5 text-[14px] text-black bg-white border border-black/20 rounded-lg outline-none focus:border-black"
                rows={3}
                placeholder="e.g. Incomplete address verification or duplicate registration..."
                value={declineRemarks}
                onChange={(e) => setDeclineRemarks(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-black/10">
              <Button
                variant="ghost"
                onClick={() => setSelectedUserForDecline(null)}
                disabled={isDeclining}
              >
                Cancel
              </Button>
              <Button
                variant="secondary"
                onClick={handleConfirmDecline}
                disabled={isDeclining || !declineRemarks.trim()}
              >
                {isDeclining ? 'Declining...' : 'Confirm Decline'}
              </Button>
            </div>
          </div>
        </div>
      )}
      </div>
    </AdminLayout>
  );
}
