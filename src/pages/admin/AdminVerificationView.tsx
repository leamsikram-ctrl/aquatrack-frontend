import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/templates/AdminLayout';
import { Card } from '../../components/atoms/Card';
import { Button } from '../../components/atoms/Button';
import { Badge } from '../../components/atoms/Badge';
import { EmptyState } from '../../components/molecules/EmptyState';
import { adminApi } from '../../api';
import type { User, Meter } from '../../types';
import { IconCheck, IconX, IconMapPin } from '@tabler/icons-react';
import { MeterTagModal } from '../../components/organisms/MeterTagModal';
import { SystemModal } from '../../components/molecules/SystemModal';
import { MunicipalMap } from '../../components/organisms/MunicipalMap';

export function AdminVerificationView() {
  const navigate = useNavigate();
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Meter Tag Modal State
  const [verifiedUserForTag, setVerifiedUserForTag] = useState<User | null>(null);

  // Meter Picker / Correction Modal State (Section 2.2)
  const [selectedUserForVerify, setSelectedUserForVerify] = useState<User | null>(null);
  const [correctedMeterNumber, setCorrectedMeterNumber] = useState('');
  const [availableMeters, setAvailableMeters] = useState<Meter[]>([]);
  const [selectedMeterId, setSelectedMeterId] = useState<number | null>(null);
  const [isLoadingMeters, setIsLoadingMeters] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Decline Modal State (Section 2.2 Step 4)
  const [selectedUserForDecline, setSelectedUserForDecline] = useState<User | null>(null);
  const [declineRemarks, setDeclineRemarks] = useState('');
  const [isDeclining, setIsDeclining] = useState(false);

  // Map Inspection Modal State (Section 2.2 Step 1)
  const [viewingMapUser, setViewingMapUser] = useState<User | null>(null);

  // Modern System Modal State
  const [systemModal, setSystemModal] = useState<{
    isOpen: boolean;
    type: 'info' | 'success' | 'warning' | 'error' | 'confirm';
    title: string;
    message: string | React.ReactNode;
    confirmText?: string;
  }>({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
  });

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
    const mtr =
      user.customer_profile?.meter?.meter_number ||
      user.customer_profile?.meter_number ||
      '';
    setCorrectedMeterNumber(mtr);
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
    if (!selectedUserForVerify) return;

    const userToTag = selectedUserForVerify;
    setIsVerifying(true);
    try {
      await adminApi.verifyRegistration(selectedUserForVerify.id, {
        meter_number: correctedMeterNumber.trim() || undefined,
        meter_id: selectedMeterId || undefined,
      });
      setSelectedUserForVerify(null);
      fetchPending();
      setVerifiedUserForTag(userToTag);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      setSystemModal({
        isOpen: true,
        type: 'error',
        title: 'Verification Failed',
        message: errorObj?.response?.data?.message || 'Verification failed. Please ensure the meter number is valid.',
        confirmText: 'Understood',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleConfirmDecline = async () => {
    if (!selectedUserForDecline || !declineRemarks.trim()) {
      setSystemModal({
        isOpen: true,
        type: 'warning',
        title: 'Decline Reason Required',
        message: 'A formal decline reason is mandatory. The applicant will be notified with this reason.',
        confirmText: 'Understood',
      });
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
      setSystemModal({
        isOpen: true,
        type: 'error',
        title: 'Decline Failed',
        message: errorObj?.response?.data?.message || 'Failed to decline registration application.',
        confirmText: 'Close',
      });
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
        <div className="border-b border-black/10 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h1 className="text-xl sm:text-2xl font-bold text-black tracking-tight">
            Customer Verifications
          </h1>
        </div>

        {/* Queue Status Card */}
        <Card className="p-4 bg-white shadow-[0_10px_25px_-5px_rgba(0,0,0,0.14),0_6px_10px_-4px_rgba(0,0,0,0.08)] rounded-md border border-black/10 flex items-center justify-between">
          <span className="text-xs font-semibold text-black/60">
            Verification Queue
          </span>
          <Badge variant={pendingUsers.length > 0 ? 'blue' : 'outline'}>
            {pendingUsers.length} Applications Pending
          </Badge>
        </Card>

        {isLoading ? (
          <Card className="p-8 text-center text-black/60 border border-black/10 rounded-md shadow-[0_10px_25px_-5px_rgba(0,0,0,0.14),0_6px_10px_-4px_rgba(0,0,0,0.08)] bg-white">
            Loading pending customer registrations...
          </Card>
        ) : pendingUsers.length === 0 ? (
          <EmptyState
            title="All Applications Processed"
            description="There are currently no customer accounts awaiting administrative meter assignment or verification."
          />
        ) : (
          <div className="space-y-4">
            {pendingUsers.map((user) => {
              const profile = user.customer_profile;
              return (
                <Card key={user.id} className="p-5 bg-white rounded-md border border-black/10 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.14),0_6px_10px_-4px_rgba(0,0,0,0.08)] hover:shadow-[0_16px_32px_-6px_rgba(0,0,0,0.18),0_8px_14px_-4px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 transition-all duration-200 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black/10 pb-3">
                    <div>
                      <span className="text-sm font-bold text-black">
                        {profile ? `${profile.first_name} ${profile.last_name}` : 'Unknown Applicant'}
                      </span>
                      <span className="text-black/50 ml-2">ID #{user.id}</span>
                    </div>
                    <Badge variant="outline">Pending review</Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-[14px]">
                    <div>
                      <span className="text-xs font-semibold text-black/60 block">Contact Info</span>
                      <span className="text-black/80">{user.mobile_number}</span>
                      {user.email && <span className="text-black/60 block">{user.email}</span>}
                    </div>

                    <div>
                      <span className="text-xs font-semibold text-black/60 block">Barangay & Address</span>
                      <span className="text-black font-semibold">
                        {profile?.barangay?.name ?? 'Sinacaban Barangay'}
                      </span>
                      <span className="text-black/60 block font-normal">{profile?.address}</span>
                    </div>

                    <div>
                      <span className="text-xs font-semibold text-black/60 block">Submitted Meter #</span>
                      <span className="font-mono font-bold text-[#1E6FD9]">
                        {profile?.meter?.meter_number || profile?.meter_number || 'To be assigned'}
                      </span>
                    </div>

                    <div>
                      <span className="text-xs font-semibold text-black/60 block">Location Pin</span>
                      {profile?.latitude && profile?.longitude ? (
                        <button
                          type="button"
                          onClick={() => setViewingMapUser(user)}
                          className="text-black/80 flex items-center gap-1.5 font-mono text-xs hover:text-[#1E6FD9] hover:underline transition-colors mt-0.5 text-left"
                          title="Click to view home location on municipal map"
                        >
                          <IconMapPin size={13} className="text-[#1E6FD9] shrink-0" />
                          <span>
                            {Number(profile.latitude).toFixed(4)}, {Number(profile.longitude).toFixed(4)}
                          </span>
                          <span className="text-[10px] font-sans font-semibold text-[#1E6FD9] bg-[#1E6FD9]/10 px-1.5 py-0.5 rounded ml-1">
                            Map
                          </span>
                        </button>
                      ) : (
                        <span className="text-black/40 italic">Coordinates unpinned</span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-black/10">
                    <Button
                      variant="secondary"
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
                      Verify & Activate
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Section 2.2: Verify Modal with Meter Correction */}
        {selectedUserForVerify && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-black/15 rounded-md max-w-lg w-full p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-black/10 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-black">
                    Verify Customer & Link Water Meter
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

              {/* Section 2.2 Step 3: Admin review & correct meter number */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-black/80 mb-1">
                    Water Meter Number (Admin may correct if mistyped):
                  </label>
                  <input
                    type="text"
                    className="w-full p-2.5 text-xs font-mono font-bold text-black bg-white border border-black/30 rounded focus:border-[#1E6FD9] outline-none"
                    placeholder="e.g. MTR-SIN-0004"
                    value={correctedMeterNumber}
                    onChange={(e) => setCorrectedMeterNumber(e.target.value)}
                  />
                  <span className="text-[11px] text-black/50 block mt-1">
                    AquaTrack will create/link this meter record, generate the QR code, set status Active, and notify the customer by SMS/email.
                  </span>
                </div>

                {/* Or optional selection from inventory */}
                {isLoadingMeters && (
                  <p className="text-xs text-black/50 py-1">Loading available inventory...</p>
                )}
                {availableMeters.length > 0 && (
                  <div className="pt-2 border-t border-black/10 space-y-2">
                    <span className="text-xs font-semibold text-black/60 block">
                      Or select from unassigned inventory:
                    </span>
                    <div className="max-h-36 overflow-y-auto space-y-1.5 border border-black/10 rounded p-2">
                      {availableMeters.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            setSelectedMeterId(m.id);
                            setCorrectedMeterNumber(m.meter_number);
                          }}
                          className={`w-full text-left p-2 rounded text-xs flex items-center justify-between border cursor-pointer ${
                            selectedMeterId === m.id || correctedMeterNumber === m.meter_number
                              ? 'bg-[#1E6FD9] text-white border-black font-bold'
                              : 'bg-white text-black border-black/15 hover:bg-black/5'
                          }`}
                        >
                          <span>Meter #{m.meter_number}</span>
                          <span className="text-[11px] font-mono">{m.barangay?.name || 'Sinacaban'}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="p-3 bg-slate-50 border border-black/15 rounded-lg text-xs text-black/80 space-y-1">
                  <span className="font-semibold text-black block">Automated Verification Actions (Section 2.2):</span>
                  <ul className="list-disc pl-4 space-y-0.5">
                    <li>Creates/links meter record from meter number and generates QR code</li>
                    <li>Generates sequence account number <strong>ACC-YYYY-####</strong></li>
                    <li>Status becomes <strong>Active</strong>; customer notified via Email & SMS</li>
                    <li>Prepares printable QR tag for attaching to physical meter</li>
                    <li>Action recorded in <strong>Activity Log</strong></li>
                  </ul>
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-black/10">
                <Button
                  variant="secondary"
                  onClick={() => setSelectedUserForVerify(null)}
                  disabled={isVerifying}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleConfirmVerify}
                  disabled={isVerifying || (!correctedMeterNumber.trim() && !selectedMeterId)}
                >
                  {isVerifying ? 'Verifying & Linking...' : 'Confirm Verification'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Section 2.2 Step 4: Decline Remarks Modal */}
        {selectedUserForDecline && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-black/15 rounded-md max-w-md w-full p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-black/10 pb-3">
                <h3 className="text-sm font-bold text-black">
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
                <label className="block text-xs font-semibold text-black/60">
                  Reason for Rejection (Required - sent to applicant via SMS & In-app):
                </label>
                <textarea
                  className="w-full p-2.5 text-[14px] text-black bg-white border border-black/20 rounded-lg outline-none focus:border-black"
                  rows={3}
                  placeholder="e.g. Submitted meter number does not match Sinacaban Water District consumer records."
                  value={declineRemarks}
                  onChange={(e) => setDeclineRemarks(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-black/10">
                <Button
                  variant="secondary"
                  onClick={() => setSelectedUserForDecline(null)}
                  disabled={isDeclining}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleConfirmDecline}
                  disabled={isDeclining || !declineRemarks.trim()}
                >
                  {isDeclining ? 'Declining...' : 'Confirm Decline'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Auto-Open Meter Tag Modal for Verified Customer (Section 2.2 Step 5) */}
        {verifiedUserForTag && (
          <MeterTagModal
            customer={verifiedUserForTag}
            onClose={() => setVerifiedUserForTag(null)}
          />
        )}

        {/* Section 2.2 Step 1: Customer Pinned Home Location Map Modal */}
        {viewingMapUser && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-black/15 rounded-md max-w-2xl w-full p-5 space-y-4 shadow-2xl max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between border-b border-black/10 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#1E6FD9]/10 flex items-center justify-center text-[#1E6FD9]">
                    <IconMapPin size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-black">
                      Applicant Home Location Map
                    </h3>
                    <p className="text-xs text-black/60">
                      {viewingMapUser.customer_profile?.first_name} {viewingMapUser.customer_profile?.last_name} &bull; {viewingMapUser.customer_profile?.barangay?.name || 'Sinacaban'} &bull; Meter #{viewingMapUser.customer_profile?.meter?.meter_number || viewingMapUser.customer_profile?.meter_number || 'Pending'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setViewingMapUser(null)}
                  className="text-black hover:opacity-70 p-1"
                >
                  <IconX size={18} />
                </button>
              </div>

              <div className="h-[360px] rounded-lg overflow-hidden border border-black/15 relative">
                <MunicipalMap
                  center={[
                    Number(viewingMapUser.customer_profile?.latitude) || 8.2855,
                    Number(viewingMapUser.customer_profile?.longitude) || 123.8429,
                  ]}
                  zoom={15}
                  lockToSinacaban={true}
                  className="w-full h-full"
                  markers={[
                    {
                      id: `applicant-${viewingMapUser.id}`,
                      lat: Number(viewingMapUser.customer_profile?.latitude) || 8.2855,
                      lng: Number(viewingMapUser.customer_profile?.longitude) || 123.8429,
                      title: `${viewingMapUser.customer_profile?.first_name || 'Applicant'} ${viewingMapUser.customer_profile?.last_name || ''}`,
                      subtitle: viewingMapUser.customer_profile?.address,
                      markerType: 'customer',
                      customerName: `${viewingMapUser.customer_profile?.first_name || 'Applicant'} ${viewingMapUser.customer_profile?.last_name || ''}`,
                      meterNumber: viewingMapUser.customer_profile?.meter?.meter_number || viewingMapUser.customer_profile?.meter_number,
                    },
                  ]}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-black/70 pt-2 border-t border-black/10">
                <div className="font-mono text-[11px] bg-slate-100 px-2.5 py-1 rounded border border-black/10">
                  GPS: {Number(viewingMapUser.customer_profile?.latitude).toFixed(6)}° N, {Number(viewingMapUser.customer_profile?.longitude).toFixed(6)}° E
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setViewingMapUser(null)}
                >
                  Close Map
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Modern System Alert & Verification Modal */}
        <SystemModal
          isOpen={systemModal.isOpen}
          onClose={() => setSystemModal((m) => ({ ...m, isOpen: false }))}
          type={systemModal.type}
          title={systemModal.title}
          message={systemModal.message}
          confirmText={systemModal.confirmText}
        />
      </div>
    </AdminLayout>
  );
}
