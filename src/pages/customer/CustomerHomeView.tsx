import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CustomerLayout } from '../../components/templates/CustomerLayout';
import { Card } from '../../components/atoms/Card';
import { Badge } from '../../components/atoms/Badge';
import { Button } from '../../components/atoms/Button';
import { StatusTimeline } from '../../components/organisms/StatusTimeline';
import { UrgencyDerivation } from '../../components/molecules/UrgencyDerivation';
import { EmptyState } from '../../components/molecules/EmptyState';
import { requestsApi, billingApi } from '../../api';
import type { ServiceRequest, Billing } from '../../types';

export function CustomerHomeView() {
  const navigate = useNavigate();
  const [activeRequest, setActiveRequest] = useState<ServiceRequest | null>(null);
  const [currentBill, setCurrentBill] = useState<Billing | null>(null);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [description, setDescription] = useState<string>('');
  const [customerUrgency, setCustomerUrgency] = useState<string>('can_wait');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchConsumerData = async () => {
    try {
      const [reqData, billData] = await Promise.all([
        requestsApi.list({ per_page: 1 }),
        billingApi.list({ payment_status: 'unpaid' }),
      ]);

      if (reqData.data.length > 0) {
        setActiveRequest(reqData.data[0]);
      }
      if (billData.data.length > 0) {
        setCurrentBill(billData.data[0]);
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

  return (
    <CustomerLayout currentPath="/customer/home" onNavigate={(path) => navigate(path)}>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/15 pb-3">
          <div>
            <h1 className="text-[10px] font-bold text-black uppercase tracking-wider">
              Consumer Account Overview
            </h1>
            <p className="text-[10px] text-black/60">
              Barangay Poblacion, Sinacaban Municipal Water District (SIWASS)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => navigate('/customer/advisories')}>
              View Advisories
            </Button>
            <Button variant="primary" onClick={() => setShowReportModal(true)}>
              Report Water Issue
            </Button>
          </div>
        </div>

        {/* Current Billing Card */}
        <Card className="border-l-4 border-l-[#1E6FD9] border border-black/15 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] text-black/60 uppercase font-bold">
                Current Statement {currentBill ? `(${currentBill.billing_period})` : ''}
              </div>
              <div className="text-[10px] font-bold text-black mt-1">
                {currentBill ? `₱${Number(currentBill.amount_paid || 0).toFixed(2)}` : '₱0.00'}
              </div>
              <div className="text-[10px] text-black/50 mt-0.5">
                {currentBill ? 'Payable at Sinacaban Municipal Treasurer' : 'No outstanding balance for this account'}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={currentBill?.payment_status === 'paid' ? 'blue' : 'black'}>
                {currentBill ? currentBill.payment_status.toUpperCase() : 'SETTLED'}
              </Badge>
              <Button variant="secondary" onClick={() => navigate('/customer/bills')}>
                Bills History
              </Button>
            </div>
          </div>
        </Card>

        {/* Active Request Progress */}
        {activeRequest ? (
          <div className="space-y-4">
            <Card className="p-4 border border-black/15 space-y-3">
              <div className="flex items-center justify-between border-b border-black/10 pb-2">
                <div>
                  <div className="text-[10px] font-bold text-black uppercase tracking-wider">
                    Active Request: {activeRequest.reference_no || activeRequest.reference}
                  </div>
                  <div className="text-[10px] text-black/70 mt-0.5">
                    {activeRequest.description}
                  </div>
                </div>
                <Badge variant={activeRequest.status === 'resolved' ? 'blue' : 'black'}>
                  {activeRequest.status.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>

              <StatusTimeline
                status={activeRequest.status}
                submittedAt={
                  activeRequest.created_at
                    ? new Date(activeRequest.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : undefined
                }
                startedAt={
                  activeRequest.started_at
                    ? new Date(activeRequest.started_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : undefined
                }
                resolvedAt={
                  activeRequest.resolved_at
                    ? new Date(activeRequest.resolved_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : undefined
                }
              />
            </Card>

            <UrgencyDerivation
              defaultUrgency="medium"
              customerUrgency={activeRequest.customer_urgency ?? 'can_wait'}
              finalUrgency={activeRequest.urgency ?? 'medium'}
              adjustedByAdmin={false}
            />
          </div>
        ) : (
          <EmptyState
            title="No Active Service Requests"
            description="You do not have any open water issues or pipeline repair tickets logged for your household."
            actionLabel="Report an Issue"
            onAction={() => setShowReportModal(true)}
          />
        )}

        {/* Modal for reporting an issue */}
        {showReportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md bg-white rounded-lg border border-black p-5 space-y-4 shadow-xl">
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
