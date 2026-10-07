import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CustomerLayout } from '../../components/templates/CustomerLayout';
import { Card } from '../../components/atoms/Card';
import { Badge } from '../../components/atoms/Badge';
import { Button } from '../../components/atoms/Button';
import { requestsApi, billingApi, authApi, interruptionsApi } from '../../api';
import type { ServiceRequest, Billing, User, WaterInterruption } from '../../types';
import { IconChevronRight } from '@tabler/icons-react';

export function CustomerHomeView() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [activeRequest, setActiveRequest] = useState<ServiceRequest | null>(null);
  const [currentBill, setCurrentBill] = useState<Billing | null>(null);
  const [latestAdvisory, setLatestAdvisory] = useState<WaterInterruption | null>(null);
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
      <div className="space-y-4">
        {/* Header */}
        <div className="pb-1">
          <h1 className="text-[14px] font-bold text-black uppercase tracking-wider">
            Home
          </h1>
        </div>

        {/* Card 1: Account */}
        <Card className="p-4 border border-black/15 bg-white space-y-1">
          <div className="text-[14px] uppercase tracking-wider text-black/50 font-bold">
            Account
          </div>
          <div className="text-[14px] font-bold text-black">
            {accountNumber} · {meterNumber}
          </div>
          <div className="text-[14px] text-black/70 font-normal">
            {barangayName}
          </div>
        </Card>

        {/* Card 2: Current bill */}
        <Card className="p-4 border border-black/15 bg-white space-y-3">
          <div className="text-[14px] uppercase tracking-wider text-black/50 font-bold">
            Current bill
          </div>
          <div className="text-[14px] font-bold text-black">
            ₱{Number(currentBill?.amount_paid || (currentBill ? 350.0 : 0)).toFixed(2)}
          </div>
          <div className="text-[14px] text-black/60 font-normal">
            {currentBill?.due_date
              ? `Due ${new Date(currentBill.due_date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}`
              : 'Due Oct 25, 2026'}
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-black/10">
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

        {/* Card 3: Active request */}
        <Card
          className="p-4 border border-black/15 bg-white space-y-3 cursor-pointer hover:border-[#1E6FD9] transition-colors"
          onClick={() => navigate('/customer/requests')}
        >
          <div className="flex items-center justify-between">
            <div className="text-[14px] uppercase tracking-wider text-black/50 font-bold">
              Active request
            </div>
            <IconChevronRight size={16} className="text-black/40" />
          </div>

          {activeRequest ? (
            <>
              <div className="text-[14px] font-bold text-black">
                {activeRequest.reference_no || activeRequest.reference || 'AT-2026-0012'} ·{' '}
                {activeRequest.issue_type?.name || 'Service Issue'}
              </div>

              {/* 4-step progress bar */}
              <div className="space-y-1.5 pt-1">
                <div className="grid grid-cols-4 gap-1.5">
                  {[0, 1, 2, 3].map((step) => {
                    const isPassed = step <= currentStepIdx;
                    return (
                      <div
                        key={step}
                        className={`h-2 rounded-full ${
                          isPassed ? 'bg-[#1E6FD9]' : 'bg-black/15'
                        }`}
                      />
                    );
                  })}
                </div>
                <div className="grid grid-cols-4 text-center text-[14px] font-bold text-black/70">
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
            <div className="py-2 text-center text-black/60 flex items-center justify-between text-[14px] font-normal">
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

        {/* Card 4: Latest advisory */}
        <Card
          className="p-4 border border-black/15 bg-white space-y-2 cursor-pointer hover:border-[#1E6FD9] transition-colors"
          onClick={() => navigate('/customer/advisories')}
        >
          <div className="flex items-center justify-between">
            <div className="text-[14px] uppercase tracking-wider text-black/50 font-bold">
              Latest advisory
            </div>
            <IconChevronRight size={16} className="text-black/40" />
          </div>
          <div className="text-[14px] font-bold text-black">
            {latestAdvisory?.barangays?.[0]?.name || barangayName} ·{' '}
            {latestAdvisory?.starts_at
              ? new Date(latestAdvisory.starts_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'Oct 12, 2026'}
          </div>
          <p className="text-[14px] text-black/70 line-clamp-2 font-normal">
            {latestAdvisory?.message ||
              'Scheduled maintenance and pipeline pressure checks across municipal distribution zones.'}
          </p>
        </Card>

        {/* Report Issue Modal */}
        {showReportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md bg-white rounded-lg border border-black p-5 space-y-4 shadow-xl text-[14px]">
              <div className="flex items-center justify-between border-b border-black/15 pb-2">
                <span className="font-bold text-[14px] text-black uppercase tracking-wider">
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
                  <label className="block text-[14px] font-bold text-black uppercase mb-1">
                    Description of the issue
                  </label>
                  <textarea
                    placeholder="Describe the problem..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-2.5 text-[14px] font-normal bg-white text-black border border-black rounded outline-none focus:border-[#1E6FD9] h-24"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[14px] font-bold text-black uppercase mb-1">
                    Urgency for your household
                  </label>
                  <select
                    className="w-full p-2 text-[14px] font-normal text-black bg-white border border-black rounded outline-none focus:border-[#1E6FD9]"
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
