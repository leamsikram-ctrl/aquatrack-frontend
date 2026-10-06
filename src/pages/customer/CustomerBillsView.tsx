import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CustomerLayout } from '../../components/templates/CustomerLayout';
import { Card } from '../../components/atoms/Card';
import { Button } from '../../components/atoms/Button';
import { Badge } from '../../components/atoms/Badge';
import { EmptyState } from '../../components/molecules/EmptyState';
import { billingApi } from '../../api';
import type { Billing } from '../../types';
import { IconReceipt, IconPrinter } from '@tabler/icons-react';

export function CustomerBillsView() {
  const navigate = useNavigate();
  const [billings, setBillings] = useState<Billing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unpaid' | 'paid'>('all');
  const [selectedBill, setSelectedBill] = useState<Billing | null>(null);

  const fetchBillings = async () => {
    setIsLoading(true);
    try {
      const res = await billingApi.list({
        payment_status: filter === 'all' ? undefined : filter,
      });
      setBillings(res.data);
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBillings();
  }, [filter]);

  const totalOutstanding = billings
    .filter((b) => b.payment_status === 'unpaid')
    .reduce((sum, b) => sum + Number(b.amount_paid || 0), 0);

  return (
    <CustomerLayout currentPath="/customer/bills" onNavigate={(path) => navigate(path)}>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/15 pb-4">
        <div>
          <h1 className="text-[10px] font-bold text-black uppercase tracking-wider">
            Water Statements & Billing History
          </h1>
          <p className="text-[10px] text-black/60">
            View monthly consumption billing records, official receipts, and payment status.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="blue">Sinacaban Water District</Badge>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border-l-4 border-l-[#1E6FD9] border border-black/15">
          <div className="text-[10px] text-black/60 uppercase font-bold">Unpaid Balance</div>
          <div className="text-[10px] font-bold text-[#1E6FD9] mt-1">
            ₱{totalOutstanding.toFixed(2)}
          </div>
          <div className="text-[10px] text-black/50 mt-0.5">Payable at Municipal Treasurer</div>
        </Card>
        <Card className="p-4 border border-black/15">
          <div className="text-[10px] text-black/60 uppercase font-bold">Total Statements</div>
          <div className="text-[10px] font-bold text-black mt-1">{billings.length}</div>
          <div className="text-[10px] text-black/50 mt-0.5">Published billing cycles</div>
        </Card>
        <Card className="p-4 border border-black/15">
          <div className="text-[10px] text-black/60 uppercase font-bold">Settled Accounts</div>
          <div className="text-[10px] font-bold text-black mt-1">
            {billings.filter((b) => b.payment_status === 'paid').length} Paid
          </div>
          <div className="text-[10px] text-black/50 mt-0.5">Verified receipts</div>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold text-black uppercase">Filter:</span>
        {(['all', 'unpaid', 'paid'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded text-[10px] font-bold capitalize transition-colors border border-black ${
              filter === f
                ? 'bg-[#1E6FD9] text-white'
                : 'bg-white text-black hover:bg-[#F0F6FD]'
            }`}
          >
            {f} Statements
          </button>
        ))}
      </div>

      {/* Billings Table */}
      <Card className="p-0 overflow-hidden border border-black/15">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[10px]">
            <thead className="bg-[#F0F6FD] text-black border-b border-black/15">
              <tr>
                <th className="px-4 py-2.5 font-bold uppercase">Billing Period</th>
                <th className="px-4 py-2.5 font-bold uppercase">Statement Reference</th>
                <th className="px-4 py-2.5 font-bold uppercase">Amount Due</th>
                <th className="px-4 py-2.5 font-bold uppercase">Payment Status</th>
                <th className="px-4 py-2.5 font-bold uppercase">Publication</th>
                <th className="px-4 py-2.5 font-bold uppercase text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-black/50">
                    Loading billing history...
                  </td>
                </tr>
              ) : billings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-black/50">
                    <EmptyState
                      title="No Billing Statements Found"
                      description="You currently have no billing statements issued for this period."
                    />
                  </td>
                </tr>
              ) : (
                billings.map((bill) => {
                  const isPaid = bill.payment_status === 'paid';
                  return (
                    <tr key={bill.id} className="hover:bg-[#F0F6FD]/50 transition-colors">
                      <td className="px-4 py-3 font-bold text-black">
                        {bill.billing_period}
                      </td>
                      <td className="px-4 py-3 font-mono text-[#1E6FD9]">
                        BILL-{bill.id.toString().padStart(5, '0')}
                      </td>
                      <td className="px-4 py-3 font-bold text-black">
                        ₱{Number(bill.amount_paid || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={isPaid ? 'blue' : 'black'}>
                          {isPaid ? 'PAID' : 'UNPAID'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-black/70">
                        {bill.is_published ? 'Published' : 'Draft'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="secondary"
                          onClick={() => setSelectedBill(bill)}
                        >
                          <IconReceipt size={12} className="inline mr-1" />
                          View Statement
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

      {/* Statement Receipt Modal */}
      {selectedBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md bg-white rounded-lg border border-black p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-black/15 pb-2">
              <div className="flex items-center gap-2">
                <IconReceipt size={14} className="text-[#1E6FD9]" />
                <span className="font-bold text-black uppercase tracking-wider">
                  Statement of Account
                </span>
              </div>
              <button
                onClick={() => setSelectedBill(null)}
                className="text-black hover:text-[#1E6FD9] p-1 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="border border-black p-4 rounded space-y-3 bg-[#F0F6FD]">
              <div className="text-center border-b border-black/15 pb-2">
                <div className="font-bold text-black uppercase tracking-wider">
                  Municipality of Sinacaban
                </div>
                <div className="text-black/60">Sinacaban Water System Service (SIWASS)</div>
                <div className="font-mono text-[#1E6FD9] mt-1">
                  BILL-{selectedBill.id.toString().padStart(5, '0')}
                </div>
              </div>

              <div className="space-y-1.5 text-[10px]">
                <div className="flex justify-between">
                  <span className="text-black/60">Billing Period:</span>
                  <strong className="text-black">{selectedBill.billing_period}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-black/60">Account Number:</span>
                  <strong className="text-black">
                    {selectedBill.customer_profile?.account_number || 'ACC-2026-0001'}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-black/60">Meter Number:</span>
                  <strong className="text-black">
                    {selectedBill.customer_profile?.meter?.meter_number || 'MTR-SIN-0001'}
                  </strong>
                </div>
                <div className="flex justify-between border-t border-black/15 pt-2">
                  <span className="text-black/60">Payment Status:</span>
                  <Badge variant={selectedBill.payment_status === 'paid' ? 'blue' : 'black'}>
                    {selectedBill.payment_status.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex justify-between items-baseline border-t border-black/15 pt-2">
                  <span className="font-bold text-black uppercase">Total Amount:</span>
                  <span className="font-bold text-black text-sm text-[#1E6FD9]">
                    ₱{Number(selectedBill.amount_paid || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-[10px] text-black/60 italic text-center">
              Payments can be settled in person at the Sinacaban Municipal Treasurer Office during office hours.
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-black/15">
              <Button
                variant="secondary"
                onClick={() => window.print()}
              >
                <IconPrinter size={12} className="inline mr-1" />
                Print Statement
              </Button>
              <Button
                variant="primary"
                onClick={() => setSelectedBill(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
      </div>
    </CustomerLayout>
  );
}
