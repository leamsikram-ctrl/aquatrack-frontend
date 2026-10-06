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
      <div className="max-w-xl mx-auto space-y-4 text-[10px] text-black">
        {/* Wireframe C8 Header */}
        <div className="border-b border-black/15 pb-2">
          <h1 className="text-[12px] font-bold text-black uppercase tracking-wider">
            Bills
          </h1>
        </div>

        {/* Wireframe C8 Top Card: Current bill */}
        {currentUnpaidBill ? (
          <Card className="p-4 border border-black/15 bg-white space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[9px] uppercase font-bold text-black/60 tracking-wider">
                Current bill
              </span>
              <Badge variant={currentUnpaidBill.payment_status === 'paid' ? 'blue' : 'black'}>
                {currentUnpaidBill.payment_status === 'paid' ? 'PAID' : 'UNPAID'}
              </Badge>
            </div>

            <div className="text-xl font-bold text-black">
              ₱{Number(currentUnpaidBill.amount_paid || 350.0).toFixed(2)}
            </div>

            <div className="text-[10px] text-black/70">
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
              <IconReceipt size={12} className="inline mr-1" />
              View statement
            </Button>
          </Card>
        ) : (
          <Card className="p-4 border border-black/15 text-center text-black/60">
            No active outstanding billing statement.
          </Card>
        )}

        {/* Wireframe C8 Section: Billing history */}
        <div className="space-y-2 pt-2">
          <div className="text-[9px] uppercase tracking-wider font-bold text-black/60">
            Billing history
          </div>

          {isLoading ? (
            <Card className="p-4 border border-black/15 text-center text-black/60">
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
                    className="p-3 flex items-center justify-between hover:bg-[#F0F6FD] cursor-pointer transition-colors"
                  >
                    <div>
                      <div className="font-bold text-black text-[10px]">
                        {bill.billing_period}
                      </div>
                      <div className="text-[9px] text-black/50">
                        BILL-{bill.id.toString().padStart(5, '0')}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-bold text-black text-[10px]">
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

        {/* Wireframe C8 Footnotes */}
        <div className="space-y-1 pt-3 border-t border-black/10 text-center text-[9px] text-black/50 italic">
          <div>Read-only. Status reflects published records.</div>
          <div>Read-only. No consumption chart, per the manuscript scope.</div>
        </div>

        {/* Statement Receipt Modal */}
        {selectedBill && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md bg-white rounded-lg border border-black p-5 space-y-4 shadow-xl text-[10px]">
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
                  <div className="text-black/60">Sinacaban Water Works System (SIWASS)</div>
                  <div className="font-mono text-[#1E6FD9] mt-1 font-bold">
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
                    <span className="font-bold text-black uppercase">Total Amount Due:</span>
                    <span className="font-bold text-black text-sm text-[#1E6FD9]">
                      ₱{Number(selectedBill.amount_paid || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-[9px] text-black/60 italic text-center">
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
