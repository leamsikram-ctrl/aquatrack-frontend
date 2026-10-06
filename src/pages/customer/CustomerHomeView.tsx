import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CustomerLayout } from '../../components/templates/CustomerLayout';
import { Card } from '../../components/atoms/Card';
import { Badge } from '../../components/atoms/Badge';
import { Button } from '../../components/atoms/Button';
import { requestsApi, billingApi, authApi, interruptionsApi } from '../../api';
import type { ServiceRequest, Billing, User, WaterInterruption } from '../../types';
import { IconBell, IconChevronRight } from '@tabler/icons-react';
import { NotificationCenter } from '../../components/organisms/NotificationCenter';

export function CustomerHomeView() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [activeRequest, setActiveRequest] = useState<ServiceRequest | null>(null);
  const [currentBill, setCurrentBill] = useState<Billing | null>(null);
  const [latestAdvisory, setLatestAdvisory] = useState<WaterInterruption | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [description, setDescription] = useState('');
  const [customerUrgency, setCustomerUrgency] = useState('can_wait');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchConsumerData = async () => {
    try {
      const [userData, reqData, billData, intData] = await Promise.all([
        authApi.me().catch(() => null),
        requestsApi.list({ per_page: 5 }).catch(() => ({ data: [] })),
        billingApi.list({ payment_status: 'unpaid' }).catch(() => ({ data: [] })),
        interruptionsApi.list().catch(() => ({ data: [] })),
      ]);

      if (userData) setUser(userData);
      
      // Look for active (unresolved/uncancelled) request first, or latest
      if (reqData.data && reqData.data.length > 0) {
        const active = reqData.data.find(
          (r) => ['submitted', 'assigned', 'in_progress'].includes(r.status)
        );
        setActiveRequest(active || reqData.data[0]);
      }
      
      if (billData.data && billData.data.length > 0) {
        setCurrentBill(billData.data[0]);
      }
      
      if (intData.data && intData.data.length > 0) {
        setLatestAdvisory(intData.data[0]);
      }
    } catch {
      // Offline fallback
    }
  };

  useEffect(() => {
    fetchConsumerData();
  }, []);

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsSubmitting(true);
    try {
      const newReq = await requestsApi.create({
        issue_type_id: 1,
        customer_urgency: customerUrgency,
        description,
      });
      setActiveRequest(newReq);
      setShowReportModal(false);
      setDescription('');
    } catch {
      alert('Could not submit request. Please check connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const profile = user?.customer_profile;
  const accountNumber = profile?.account_number || 'ACC-2026-0001';
  const meterNumber = profile?.meter?.meter_number || 'MTR-SIN-0001';
  const barangayName = profile?.barangay?.name || 'Barangay Poblacion';

  // Request 4-step progress index: Submitted (0), Assigned (1), In progress (2), Resolved (3)
  const getProgressStepIndex = (status?: string) => {
    switch (status) {
      case 'submitted':
        return 0;
      case 'assigned':
        return 1;
      case 'in_progress':
        return 2;
      case 'resolved':
        return 3;
      default:
        return 0;
    }
  };

  const currentStepIdx = activeRequest ? getProgressStepIndex(activeRequest.status) : 0;

  return (
    <CustomerLayout
      currentPath="/customer/home"
      onNavigate={(path) => navigate(path)}
      userName={user?.name || 'Consumer'}
      accountNumber={accountNumber}
    >
      <div className="max-w-xl mx-auto space-y-4 text-[10px] text-black">
        {/* Wireframe C7 Top Header */}
        <div className="flex items-center justify-between border-b border-black/15 pb-2">
          <h1 className="text-[12px] font-bold text-black uppercase tracking-wider">
            Home
          </h1>
          <button
            onClick={() => setShowNotifications(true)}
            className="p-1.5 rounded border border-black text-black hover:bg-[#F0F6FD] hover:text-[#1E6FD9] transition-colors relative"
            title="Notifications (Wireframe C15)"
          >
            <IconBell size={14} />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#1E6FD9] rounded-full" />
          </button>
        </div>

        {/* Card 1: Account (Wireframe C7) */}
        <Card className="p-3.5 border border-black/15 bg-white space-y-1">
          <div className="text-[9px] uppercase tracking-wider text-black/60 font-bold">
            Account
          </div>
          <div className="text-[10px] font-bold text-black">
            {accountNumber} · {meterNumber}
          </div>
          <div className="text-[10px] text-black/70">
            {barangayName}
          </div>
        </Card>

        {/* Card 2: Current bill (Wireframe C7) */}
        <Card className="p-3.5 border border-black/15 bg-white space-y-2">
          <div className="text-[9px] uppercase tracking-wider text-black/60 font-bold">
            Current bill
          </div>
          <div className="text-base font-bold text-black">
            ₱{Number(currentBill?.amount_paid || (currentBill ? 350.0 : 0)).toFixed(2)}
          </div>
          <div className="text-[10px] text-black/70">
            {currentBill?.due_date
              ? `Due ${new Date(currentBill.due_date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}`
              : 'Due Oct 25, 2026'}
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-black/10">
            <Badge variant={currentBill?.payment_status === 'paid' ? 'blue' : 'black'}>
              {currentBill?.payment_status === 'paid' ? 'PAID' : 'UNPAID'}
            </Badge>
            <Button
              variant="secondary"
              onClick={() => navigate('/customer/bills')}
            >
              View bill
            </Button>
          </div>
        </Card>

        {/* Card 3: Active request (Wireframe C7) */}
        <Card
          className="p-3.5 border border-black/15 bg-white space-y-2.5 cursor-pointer hover:border-[#1E6FD9] transition-colors"
          onClick={() => navigate('/customer/requests')}
        >
          <div className="flex items-center justify-between">
            <div className="text-[9px] uppercase tracking-wider text-black/60 font-bold">
              Active request
            </div>
            <IconChevronRight size={12} className="text-black/40" />
          </div>

          {activeRequest ? (
            <>
              <div className="text-[10px] font-bold text-black">
                {activeRequest.reference_no || activeRequest.reference || 'AT-2026-0012'} ·{' '}
                {activeRequest.issue_type?.name || 'Service Issue'}
              </div>

              {/* Wireframe C7 4-step progress bar */}
              <div className="space-y-1 pt-1">
                <div className="grid grid-cols-4 gap-1">
                  {[0, 1, 2, 3].map((step) => {
                    const isPassed = step <= currentStepIdx;
                    return (
                      <div
                        key={step}
                        className={`h-1.5 rounded-full ${
                          isPassed ? 'bg-[#1E6FD9]' : 'bg-black/15'
                        }`}
                      />
                    );
                  })}
                </div>
                <div className="grid grid-cols-4 text-center text-[8px] font-bold text-black/70">
                  <span className={currentStepIdx >= 0 ? 'text-[#1E6FD9]' : ''}>
                    Submitted
                  </span>
                  <span className={currentStepIdx >= 1 ? 'text-[#1E6FD9]' : ''}>
                    Assigned
                  </span>
                  <span className={currentStepIdx >= 2 ? 'text-[#1E6FD9]' : ''}>
                    In progress
                  </span>
                  <span className={currentStepIdx >= 3 ? 'text-[#1E6FD9]' : ''}>
                    Resolved
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="py-2 text-center text-black/60 flex items-center justify-between">
              <span>No active service request logged.</span>
              <Button
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowReportModal(true);
                }}
              >
                Report an issue
              </Button>
            </div>
          )}
        </Card>

        {/* Card 4: Latest advisory (Wireframe C7) */}
        <Card
          className="p-3.5 border border-black/15 bg-white space-y-1.5 cursor-pointer hover:border-[#1E6FD9] transition-colors"
          onClick={() => navigate('/customer/advisories')}
        >
          <div className="flex items-center justify-between">
            <div className="text-[9px] uppercase tracking-wider text-black/60 font-bold">
              Latest advisory
            </div>
            <IconChevronRight size={12} className="text-black/40" />
          </div>
          <div className="text-[10px] font-bold text-black">
            {latestAdvisory?.barangays?.[0]?.name || barangayName} ·{' '}
            {latestAdvisory?.starts_at
              ? new Date(latestAdvisory.starts_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'Oct 12, 2026'}
          </div>
          <p className="text-[10px] text-black/70 line-clamp-2">
            {latestAdvisory?.message ||
              'Scheduled maintenance and pipeline pressure checks across municipal distribution zones.'}
          </p>
        </Card>

        {/* Wireframe C7 Footnote */}
        <div className="pt-2 text-center text-[9px] text-black/50 italic border-t border-black/10">
          Order: account, bill, active request, advisory. Bell opens Notifications.
        </div>

        {/* Notification Modal (C15) */}
        <NotificationCenter
          isOpen={showNotifications}
          onClose={() => setShowNotifications(false)}
          role="customer"
        />

        {/* Modal for reporting an issue (Wireframe C10 quick trigger) */}
        {showReportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md bg-white rounded-lg border border-black p-5 space-y-4 shadow-xl text-[10px]">
              <div className="flex items-center justify-between border-b border-black/15 pb-2">
                <span className="font-bold text-[10px] text-black uppercase tracking-wider">
                  Report a Water Service Issue
                </span>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="text-black font-bold p-1 hover:text-[#1E6FD9]"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleReportSubmit} className="space-y-3 text-left">
                <div>
                  <label className="block text-[10px] font-bold text-black uppercase mb-1">
                    Description of the issue
                  </label>
                  <textarea
                    placeholder="e.g. Pipe leak near main connection meter, sudden low water pressure..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-2.5 text-[10px] bg-white text-black border border-black rounded outline-none focus:border-[#1E6FD9] h-24"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-black uppercase mb-1">
                    How urgent is it for your household?
                  </label>
                  <select
                    className="w-full p-2 text-[10px] text-black bg-white border border-black rounded outline-none focus:border-[#1E6FD9]"
                    value={customerUrgency}
                    onChange={(e) => setCustomerUrgency(e.target.value)}
                  >
                    <option value="can_wait">Can wait (Low)</option>
                    <option value="needs_attention_soon">Needs attention soon (Medium)</option>
                    <option value="urgent">Urgent, affecting household now (High)</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-black/15">
                  <Button variant="secondary" type="button" onClick={() => setShowReportModal(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" type="submit" isLoading={isSubmitting}>
                    Submit Request
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </CustomerLayout>
  );
}
