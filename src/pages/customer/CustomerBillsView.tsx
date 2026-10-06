import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CustomerLayout } from '../../components/templates/CustomerLayout';
import { Card } from '../../components/atoms/Card';
import { Button } from '../../components/atoms/Button';
import { Badge } from '../../components/atoms/Badge';
import { EmptyState } from '../../components/molecules/EmptyState';
import { billingApi } from '../../api';
import type { Billing } from '../../types';
import {
  IconReceipt,
  IconPrinter,
  IconCreditCard,
  IconCheck,
  IconX,
  IconTrendingDown,
  IconQrcode,
} from '@tabler/icons-react';

interface ConsumptionRecord {
  month: string;
  usage: number; // m³
  bill: number;  // ₱
}

interface CompletedReceipt {
  bill: Billing;
  receiptNo: string;
  paidAt: string;
  method: string;
  referenceNo: string;
}

export function CustomerBillsView() {
  const navigate = useNavigate();
  const [billings, setBillings] = useState<Billing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unpaid' | 'paid'>('all');
  const [selectedBill, setSelectedBill] = useState<Billing | null>(null);

  // Wireframe C3: Online Payment Flow
  const [payingBill, setPayingBill] = useState<Billing | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'gcash' | 'maya' | 'landbank'>('gcash');
  const [mobileWalletNumber, setMobileWalletNumber] = useState('0917-889-1234');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Wireframe C4: Official Electronic Receipt
  const [completedReceipt, setCompletedReceipt] = useState<CompletedReceipt | null>(null);

  // Wireframe C12: 6-Month Historical Consumption Data
  const consumptionHistory: ConsumptionRecord[] = [
    { month: 'May 2026', usage: 14.2, bill: 380 },
    { month: 'Jun 2026', usage: 16.5, bill: 420 },
    { month: 'Jul 2026', usage: 15.0, bill: 395 },
    { month: 'Aug 2026', usage: 18.2, bill: 460 },
    { month: 'Sep 2026', usage: 17.0, bill: 435 },
    { month: 'Oct 2026', usage: 15.8, bill: 410 },
  ];

  const maxUsage = Math.max(...consumptionHistory.map((c) => c.usage));

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

  const handleConfirmPayment = () => {
    if (!payingBill) return;

    setIsProcessingPayment(true);
    setTimeout(() => {
      setIsProcessingPayment(false);

      // Generate receipt
      const receiptNo = `OR-SIN-2026-${Math.floor(10000 + Math.random() * 90000)}`;
      const referenceNo = `TXN-SIWASS-${Date.now().toString().slice(-8)}`;
      const paidDate = new Date().toLocaleString();

      setCompletedReceipt({
        bill: payingBill,
        receiptNo,
        paidAt: paidDate,
        method:
          paymentMethod === 'gcash'
            ? 'GCash Mobile'
            : paymentMethod === 'maya'
            ? 'Maya Wallet'
            : 'Landbank e-Payment',
        referenceNo,
      });

      // Update local state to show paid
      setBillings((prev) =>
        prev.map((b) =>
          b.id === payingBill.id ? { ...b, payment_status: 'paid' } : b
        )
      );

      setPayingBill(null);
    }, 1000);
  };

  return (
    <CustomerLayout currentPath="/customer/bills" onNavigate={(path) => navigate(path)}>
      <div className="space-y-6 text-[10px]">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/15 pb-4">
          <div>
            <h1 className="text-[10px] font-bold text-black uppercase tracking-wider">
              Water Statements & Billing History
            </h1>
            <p className="text-[10px] text-black/60">
              Sinacaban Water Works System (SIWASS) official monthly billing and consumption portal
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="blue">Account: ACC-2026-0001</Badge>
          </div>
        </div>

        {/* Summary KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4 border-l-4 border-l-[#1E6FD9] border border-black/15">
            <div className="text-[10px] text-black/60 uppercase font-bold">Unpaid Balance</div>
            <div className="text-[10px] font-bold text-[#1E6FD9] mt-1">
              ₱{totalOutstanding.toFixed(2)}
            </div>
            <div className="text-[10px] text-black/50 mt-0.5">Payable online or via Municipal Treasurer</div>
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

        {/* Wireframe C12: Monthly Water Consumption Analytics Card */}
        <Card className="p-4 border border-black/15 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black/15 pb-2">
            <div>
              <span className="font-bold text-black uppercase tracking-wider block text-[10px]">
                Historical Water Consumption (6-Month Trend)
              </span>
              <span className="text-black/60 text-[10px]">
                Measured in cubic meters (m³) · Sinacaban Residential Tariff Bracket (₱25.00 / m³)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[#1E6FD9] font-bold text-[10px]">
                <IconTrendingDown size={12} />
                -7.1% vs September
              </span>
              <Badge variant="blue">Avg: 16.1 m³/mo</Badge>
            </div>
          </div>

          {/* Bar Chart Visualization */}
          <div className="pt-2">
            <div className="grid grid-cols-6 gap-2 sm:gap-4 items-end h-32 pt-4 px-2 border-b border-black/15">
              {consumptionHistory.map((item, idx) => {
                const heightPercent = Math.round((item.usage / maxUsage) * 100);
                const isCurrent = idx === consumptionHistory.length - 1;

                return (
                  <div key={item.month} className="flex flex-col items-center gap-1.5 h-full justify-end group">
                    <span className="text-[9px] font-bold text-black/70 group-hover:text-[#1E6FD9] transition-colors">
                      {item.usage} m³
                    </span>
                    <div className="w-full max-w-[36px] bg-[#F0F6FD] rounded-t border border-black/20 flex items-end overflow-hidden h-full">
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full transition-all duration-300 ${
                          isCurrent ? 'bg-[#1E6FD9]' : 'bg-black/70 hover:bg-[#1E6FD9]'
                        }`}
                      />
                    </div>
                    <span className="text-[9px] text-black/60 truncate max-w-full text-center">
                      {item.month.split(' ')[0]}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between items-center pt-2 px-1 text-black/50 text-[9px]">
              <span>Household baseline: Normal (Under 20 m³)</span>
              <span>Water Meter: MTR-SIN-0001 · Tested & Calibrated</span>
            </div>
          </div>
        </Card>

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
                  <th className="px-4 py-2.5 font-bold uppercase">Due Date</th>
                  <th className="px-4 py-2.5 font-bold uppercase text-right">Actions</th>
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
                          {bill.due_date || 'October 25, 2026'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {!isPaid && (
                              <Button
                                variant="primary"
                                onClick={() => setPayingBill(bill)}
                                className="py-1 px-2.5"
                              >
                                <IconCreditCard size={12} className="inline mr-1" />
                                Pay Online
                              </Button>
                            )}
                            <Button
                              variant="secondary"
                              onClick={() => setSelectedBill(bill)}
                              className="py-1 px-2.5"
                            >
                              <IconReceipt size={12} className="inline mr-1" />
                              View Statement
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

        {/* Wireframe C3: Online Payment Modal */}
        {payingBill && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md bg-white rounded-lg border-2 border-black p-5 space-y-4 shadow-2xl text-[10px]">
              <div className="flex items-center justify-between border-b border-black/15 pb-2">
                <div className="flex items-center gap-2">
                  <IconCreditCard size={14} className="text-[#1E6FD9]" />
                  <span className="font-bold text-black uppercase tracking-wider text-[10px]">
                    Sinacaban Water e-Payment Checkout
                  </span>
                </div>
                <button
                  onClick={() => setPayingBill(null)}
                  className="text-black hover:text-[#1E6FD9] p-1 font-bold"
                >
                  <IconX size={14} />
                </button>
              </div>

              {/* Bill Details Summary */}
              <div className="p-3 bg-[#F0F6FD] rounded border border-black/15 space-y-2">
                <div className="flex justify-between">
                  <span className="text-black/60">Billing Cycle:</span>
                  <strong className="text-black">{payingBill.billing_period}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-black/60">Account Number:</span>
                  <strong className="text-black">ACC-2026-0001</strong>
                </div>
                <div className="flex justify-between border-t border-black/10 pt-1.5">
                  <span className="text-black/60">Water Consumption Fee:</span>
                  <span className="text-black">
                    ₱{(Number(payingBill.amount_paid || 0) - 25).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black/60">Sewerage & Environment:</span>
                  <span className="text-black">₱15.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black/60">Meter Maintenance Fund:</span>
                  <span className="text-black">₱10.00</span>
                </div>
                <div className="flex justify-between border-t border-black/15 pt-2 items-baseline font-bold">
                  <span className="uppercase text-black">Total Payable:</span>
                  <span className="text-sm text-[#1E6FD9]">
                    ₱{Number(payingBill.amount_paid || 0).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Select Gateway */}
              <div className="space-y-2">
                <label className="font-bold uppercase text-black block">
                  Select Electronic Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'gcash', name: 'GCash' },
                    { id: 'maya', name: 'Maya' },
                    { id: 'landbank', name: 'Landbank' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id as 'gcash' | 'maya' | 'landbank')}
                      className={`p-2.5 rounded border text-center font-bold text-[10px] transition-colors ${
                        paymentMethod === m.id
                          ? 'border-[#1E6FD9] bg-[#F0F6FD] text-[#1E6FD9] ring-1 ring-[#1E6FD9]'
                          : 'border-black/20 bg-white text-black hover:border-black'
                      }`}
                    >
                      {m.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mobile / Account Number Input */}
              <div className="space-y-1">
                <label className="font-bold uppercase text-black block">
                  {paymentMethod === 'landbank' ? 'Bank Account / Reference ID' : 'Mobile Wallet Number'}
                </label>
                <input
                  type="text"
                  required
                  value={mobileWalletNumber}
                  onChange={(e) => setMobileWalletNumber(e.target.value)}
                  className="w-full p-2 bg-white text-black border border-black rounded outline-none focus:border-[#1E6FD9] font-mono text-[10px]"
                />
                <span className="text-[9px] text-black/50 block">
                  Sinacaban Municipal e-Treasury instant verification enabled (0% convenience fee).
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-black/15">
                <Button
                  variant="secondary"
                  onClick={() => setPayingBill(null)}
                  disabled={isProcessingPayment}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleConfirmPayment}
                  isLoading={isProcessingPayment}
                >
                  <IconCheck size={12} className="inline mr-1" />
                  {isProcessingPayment ? 'Processing Settlement...' : `Pay ₱${Number(payingBill.amount_paid || 0).toFixed(2)}`}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Wireframe C4: Official Electronic Receipt Modal */}
        {completedReceipt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md bg-white rounded-lg border-2 border-black p-5 space-y-4 shadow-2xl text-[10px]">
              <div className="flex items-center justify-between border-b border-black/15 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-[#1E6FD9] text-white flex items-center justify-center font-bold">
                    ✓
                  </div>
                  <span className="font-bold text-black uppercase tracking-wider text-[10px]">
                    Official Payment Receipt (e-OR)
                  </span>
                </div>
                <button
                  onClick={() => setCompletedReceipt(null)}
                  className="text-black hover:text-[#1E6FD9] p-1 font-bold"
                >
                  <IconX size={14} />
                </button>
              </div>

              <div className="p-4 border-2 border-dashed border-black/30 rounded bg-white space-y-3">
                <div className="text-center border-b border-black/15 pb-2">
                  <div className="font-bold text-black uppercase">
                    Republic of the Philippines
                  </div>
                  <div className="font-bold text-[#1E6FD9] uppercase">
                    Municipality of Sinacaban · SIWASS
                  </div>
                  <div className="text-black/60 text-[9px]">
                    Office of the Municipal Treasurer · Electronic Water Payment
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-black/60">Official Receipt No:</span>
                    <strong className="text-black font-mono">{completedReceipt.receiptNo}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-black/60">Transaction Ref:</span>
                    <strong className="text-black font-mono">{completedReceipt.referenceNo}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-black/60">Payment Timestamp:</span>
                    <span className="text-black">{completedReceipt.paidAt}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-black/60">Payment Channel:</span>
                    <span className="text-black font-bold">{completedReceipt.method}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-black/60">Billing Cycle:</span>
                    <span className="text-black">{completedReceipt.bill.billing_period}</span>
                  </div>
                  <div className="flex justify-between border-t border-black/15 pt-2 items-baseline">
                    <span className="font-bold text-black uppercase">Amount Settled:</span>
                    <span className="text-sm font-bold text-[#1E6FD9]">
                      ₱{Number(completedReceipt.bill.amount_paid || 0).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="p-2 bg-[#F0F6FD] rounded border border-black/15 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-black font-bold">
                    <IconQrcode size={16} className="text-[#1E6FD9]" />
                    <span>DIGITALLY SIGNED & VERIFIED</span>
                  </div>
                  <Badge variant="blue">CLEARED</Badge>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-black/15">
                <Button variant="secondary" onClick={() => window.print()}>
                  <IconPrinter size={12} className="inline mr-1" />
                  Print / Save Receipt
                </Button>
                <Button variant="primary" onClick={() => setCompletedReceipt(null)}>
                  Done
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Existing Statement Details Modal */}
        {selectedBill && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md bg-white rounded-lg border border-black p-5 space-y-4 shadow-xl text-[10px]">
              <div className="flex items-center justify-between border-b border-black/15 pb-2">
                <div className="flex items-center gap-2">
                  <IconReceipt size={14} className="text-[#1E6FD9]" />
                  <span className="font-bold text-black uppercase tracking-wider text-[10px]">
                    Statement of Account
                  </span>
                </div>
                <button
                  onClick={() => setSelectedBill(null)}
                  className="text-black hover:text-[#1E6FD9] p-1 font-bold"
                >
                  <IconX size={14} />
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
                    <span className="font-bold text-sm text-[#1E6FD9]">
                      ₱{Number(selectedBill.amount_paid || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-black/60 italic text-center">
                Payments can also be settled in person at the Sinacaban Municipal Treasurer Office during office hours.
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-black/15">
                <Button variant="secondary" onClick={() => window.print()}>
                  <IconPrinter size={12} className="inline mr-1" />
                  Print Statement
                </Button>
                <Button variant="primary" onClick={() => setSelectedBill(null)}>
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
