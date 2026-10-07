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
  const [selectedBill, setSelectedBill] = useState<Billing | null>(null);

  const fetchBillings = async () => {
    setIsLoading(true);
    try {
      const res = await billingApi.list();
      setBillings(res.data);
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBillings();
  }, []);

  const currentUnpaidBill = billings.find((b) => b.payment_status === 'unpaid') || billings[0];
  const billingHistory = billings.filter((b) => b.id !== currentUnpaidBill?.id);

  return (
    <CustomerLayout currentPath="/customer/bills" onNavigate={(path) => navigate(path)}>
      <div className="max-w-xl mx-auto space-y-4">
        {/* Header */}
        <div className="pb-1">
          <h1 className="text-base font-bold text-black uppercase tracking-wider">
            Bills
          </h1>
        </div>

        {/* Top Card: Current bill */}
        {currentUnpaidBill ? (
          <Card className="p-4 border border-black/15 bg-white space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold text-black/50 tracking-wider">
                Current bill
              </span>
              <Badge variant={currentUnpaidBill.payment_status === 'paid' ? 'blue' : 'black'}>
                {currentUnpaidBill.payment_status === 'paid' ? 'PAID' : 'UNPAID'}
              </Badge>
            </div>

            <div className="text-2xl font-bold text-black">
              ₱{Number(currentUnpaidBill.amount_paid || 350.0).toFixed(2)}
            </div>

            <div className="text-xs text-black/60">
              {currentUnpaidBill.billing_period || 'September 2026'} ·{' '}
              {currentUnpaidBill.due_date
                ? `Due ${new Date(currentUnpaidBill.due_date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}`
                : 'Due Oct 25, 2026'}
            </div>

            <Button
              variant="secondary"
              className="w-full justify-center"
              onClick={() => setSelectedBill(currentUnpaidBill)}
            >
              <IconReceipt size={14} className="inline mr-1.5" />
              View statement
            </Button>
          </Card>
        ) : (
          <Card className="p-4 border border-black/15 text-center text-black/60 text-xs">
            No active outstanding billing statement.
          </Card>
        )}

        {/* Section: Billing history */}
        <div className="space-y-2 pt-2">
          <div className="text-xs uppercase tracking-wider font-bold text-black/50">
            Billing history
          </div>

          {isLoading ? (
            <Card className="p-4 border border-black/15 text-center text-black/60 text-xs">
              Loading billing history...
            </Card>
          ) : billingHistory.length === 0 ? (
            <Card className="p-4 border border-black/15">
              <EmptyState
                title="No Previous Statements"
                description="Previous monthly records will be archived here once settled."
              />
            </Card>
          ) : (
            <Card className="p-0 border border-black/15 divide-y divide-black/10 overflow-hidden bg-white">
              {billingHistory.map((bill) => {
                const isPaid = bill.payment_status === 'paid';
                return (
                  <div
                    key={bill.id}
                    onClick={() => setSelectedBill(bill)}
                    className="p-3.5 flex items-center justify-between hover:bg-[#F0F6FD] cursor-pointer transition-colors"
                  >
                    <div>
                      <div className="font-bold text-black text-xs">
                        {bill.billing_period}
                      </div>
                      <div className="text-[11px] text-black/40 font-mono">
                        BILL-{bill.id.toString().padStart(5, '0')}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-bold text-black text-xs">
                        ₱{Number(bill.amount_paid || 0).toFixed(2)}
                      </span>
                      <Badge variant={isPaid ? 'blue' : 'black'}>
                        {isPaid ? 'PAID' : 'UNPAID'}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </Card>
          )}
        </div>

        {/* Statement Receipt Modal */}
        {selectedBill && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md bg-white rounded-lg border border-black p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-black/15 pb-2">
                <div className="flex items-center gap-2">
                  <IconReceipt size={16} className="text-[#1E6FD9]" />
                  <span className="font-bold text-sm text-black uppercase tracking-wider">
                    Statement of Account
                  </span>
                </div>
                <button
                  onClick={() => setSelectedBill(null)}
                  className="text-black hover:text-[#1E6FD9] p-1 font-bold text-sm"
                >
                  ✕
                </button>
              </div>

              <div className="border border-black p-4 rounded space-y-3 bg-[#F0F6FD]">
                <div className="text-center border-b border-black/15 pb-2">
                  <div className="font-bold text-black uppercase tracking-wider text-xs">
                    Municipality of Sinacaban
                  </div>
                  <div className="text-black/60 text-xs">Sinacaban Water Works System (SIWASS)</div>
                  <div className="font-mono text-[#1E6FD9] mt-1 font-bold text-xs">
                    BILL-{selectedBill.id.toString().padStart(5, '0')}
                  </div>
                </div>

                <div className="space-y-2 text-xs">
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
                    <span className="font-bold text-black uppercase">Total Due:</span>
                    <span className="font-bold text-base text-[#1E6FD9]">
                      ₱{Number(selectedBill.amount_paid || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-black/15">
                <Button
                  variant="secondary"
                  onClick={() => window.print()}
                >
                  <IconPrinter size={14} className="inline mr-1" />
                  Print
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
