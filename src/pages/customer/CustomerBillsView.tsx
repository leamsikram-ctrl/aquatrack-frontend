import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { CustomerLayout } from '../../components/templates/CustomerLayout';
import { Card } from '../../components/atoms/Card';
import { Button } from '../../components/atoms/Button';
import { Badge } from '../../components/atoms/Badge';
import { EmptyState } from '../../components/molecules/EmptyState';
import { EmptyBillsIllustration } from '../../components/illustrations';
import { authApi, billingApi } from '../../api';
import type { User } from '../../types';
import {
  billingStore,
  DEFAULT_SINACABAN_CUSTOMERS,
  type CustomerBalanceRecord,
  type BillingPaymentEntry,
  type RegisteredDirectoryCustomer,
} from '../../services/billingStore';
import {
  IconReceipt,
  IconPrinter,
  IconUser,
  IconGauge,
  IconMapPin,
  IconCalendar,
  IconHistory,
  IconCash,
  IconRotate2,
  IconClock,
  IconX,
} from '@tabler/icons-react';

export function CustomerBillsView() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [records, setRecords] = useState<CustomerBalanceRecord[]>(() => billingStore.getRecords());
  const [payments, setPayments] = useState<BillingPaymentEntry[]>(() => billingStore.getPayments());
  const [selectedStatement, setSelectedStatement] = useState<CustomerBalanceRecord | null>(null);

  const [selectedMeterNumber, setSelectedMeterNumber] = useState<string>('MTR-SIN-0001');

  useEffect(() => {
    authApi
      .me()
      .then((u) => {
        if (u) {
          setUser(u);
          const mtr = u.customer_profile?.meter?.meter_number;
          if (mtr) {
            setSelectedMeterNumber(mtr);
          }
        }
      })
      .catch(() => {
        // Fallback to default customer
      });

    billingApi
      .list()
      .then((res) => {
        const storeRecords = billingStore.getRecords();
        if (res && Array.isArray(res.data) && res.data.length > 0) {
          const apiRecords: CustomerBalanceRecord[] = res.data.map((b: any) => {
            const meter =
              b.customer?.meter_number || selectedMeterNumber || 'MTR-SIN-0001';
            const matchingStoreRec = storeRecords.find(
              (r) =>
                r.meter_number.toLowerCase() === meter.toLowerCase() &&
                (r.period_label === b.period_label || r.period_label === b.billing_period)
            );

            const curBal = Number(
              b.current_balance !== undefined
                ? b.current_balance
                : matchingStoreRec
                ? matchingStoreRec.current_balance
                : b.amount_due ?? 0
            );
            const prevBal = Number(
              b.previous_balance !== undefined
                ? b.previous_balance
                : matchingStoreRec
                ? matchingStoreRec.previous_balance
                : 0
            );
            const totBal = Number(
              b.total_balance !== undefined
                ? b.total_balance
                : matchingStoreRec
                ? matchingStoreRec.total_balance
                : curBal + prevBal
            );

            return {
              id: `bill-${b.id}`,
              period_id: b.billing_period_id
                ? `period-${b.billing_period_id}`
                : `period-${(b.billing_period || 'current').replace(/\s+/g, '-').toLowerCase()}`,
              period_label: b.period_label || b.billing_period || 'Current Period',
              customer_id: b.customer?.id || user?.id || 101,
              customer_name: b.customer?.full_name || user?.name || 'Customer',
              account_number:
                b.customer?.account_number ||
                user?.customer_profile?.account_number ||
                'ACC-2026-0001',
              meter_number: meter,
              barangay:
                b.customer?.barangay || user?.customer_profile?.barangay?.name || 'Poblacion',
              address: user?.customer_profile?.address || 'Sinacaban',
              mobile_number: user?.mobile_number || '',
              is_active_customer: true,
              original_current_balance: Number(
                b.original_current_balance ?? matchingStoreRec?.original_current_balance ?? curBal
              ),
              original_previous_balance: Number(
                b.original_previous_balance ?? matchingStoreRec?.original_previous_balance ?? prevBal
              ),
              current_balance: curBal,
              previous_balance: prevBal,
              total_balance: totBal,
              due_date: b.due_date || '2026-10-25',
              notice_sent: true,
              last_updated: b.last_updated_at || b.created_at || new Date().toISOString(),
            };
          });

          // Merge API records with billingStore records to ensure full directory coverage
          const existingIds = new Set(apiRecords.map((r) => r.meter_number.toLowerCase()));
          const extraStoreRecords = storeRecords.filter(
            (sr) => !existingIds.has(sr.meter_number.toLowerCase())
          );
          setRecords([...apiRecords, ...extraStoreRecords]);
        } else {
          setRecords(storeRecords);
        }
      })
      .catch(() => {
        setRecords(billingStore.getRecords());
      });

    setPayments(billingStore.getPayments());
  }, [selectedMeterNumber]);

  const activeCustomer: RegisteredDirectoryCustomer = useMemo(() => {
    const found = DEFAULT_SINACABAN_CUSTOMERS.find(
      (c) => c.meter_number.toLowerCase() === selectedMeterNumber.toLowerCase()
    );
    if (found) return found;

    return {
      id: user?.id || 101,
      name: user?.name || 'Maria Santos',
      account_number: user?.customer_profile?.account_number || 'ACC-2026-0001',
      meter_number: selectedMeterNumber || 'MTR-SIN-0001',
      barangay: user?.customer_profile?.barangay?.name || 'Poblacion',
      address:
        user?.customer_profile?.address ||
        'Purok 2, Near Public Market, Poblacion',
      mobile_number: user?.mobile_number || '09171234567',
      is_active: true,
    };
  }, [selectedMeterNumber, user]);

  const customerRecords = useMemo(() => {
    const periods = billingStore.getPeriods();
    return records
      .filter((r) => r.meter_number.toLowerCase() === activeCustomer.meter_number.toLowerCase())
      .sort((a, b) => {
        const pA = periods.find((p) => p.id === a.period_id);
        const pB = periods.find((p) => p.id === b.period_id);
        const valA = (pA?.year || 0) * 100 + (pA?.month || 0);
        const valB = (pB?.year || 0) * 100 + (pB?.month || 0);
        return valB - valA;
      });
  }, [records, activeCustomer.meter_number]);

  const latestRecord: CustomerBalanceRecord | null = customerRecords[0] || null;
  const earlierRecords: CustomerBalanceRecord[] = customerRecords.slice(1);

  const customerPayments = useMemo(() => {
    return payments.filter(
      (p) => p.meter_number.toLowerCase() === activeCustomer.meter_number.toLowerCase()
    );
  }, [payments, activeCustomer.meter_number]);

  const isAnyModalOpen = Boolean(selectedStatement);

  return (
    <CustomerLayout
      currentPath="/customer/bills"
      onNavigate={(path) => navigate(path)}
      userName={activeCustomer.name}
      accountNumber={activeCustomer.account_number}
    >
      <div
        className={`space-y-4 transition-all duration-200 ${
          isAnyModalOpen ? 'filter blur-[4px] pointer-events-none select-none opacity-40' : ''
        }`}
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-black tracking-tight">
              Billing Information
            </h1>
            <div className="text-black/60 text-[14px]">
              Municipal water statement, billing periods, and official payment logs
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedMeterNumber}
              onChange={(e) => setSelectedMeterNumber(e.target.value)}
              aria-label="Switch Customer Account Preview"
              className="px-3 py-1.5 bg-white border border-black/20 rounded-lg text-xs font-semibold text-black outline-none focus:border-brand-blue shadow-sm"
            >
              {DEFAULT_SINACABAN_CUSTOMERS.filter((c) => c.is_active).map((c) => (
                <option key={c.meter_number} value={c.meter_number}>
                  {c.name} ({c.meter_number})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Account Details */}
        <Card className="p-4 sm:p-5 border border-black/10 bg-white rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,0.06)]">
          <div className="flex items-center justify-between border-b border-black/10 pb-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-tint text-brand-blue flex items-center justify-center">
                <IconUser size={18} />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-black/60">
                Customer Account Details
              </span>
            </div>
            <Badge variant="blue">{activeCustomer.account_number}</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-[13px]">
            <div className="p-3 rounded-lg bg-blue-tint/50 border border-black/10">
              <div className="text-[11px] font-bold uppercase tracking-wider text-black/50">
                Name
              </div>
              <div className="font-bold text-black mt-0.5">{activeCustomer.name}</div>
            </div>

            <div className="p-3 rounded-lg bg-blue-tint/50 border border-black/10">
              <div className="text-[11px] font-bold uppercase tracking-wider text-black/50 flex items-center gap-1">
                <IconGauge size={13} className="text-brand-blue" />
                <span>Meter Number</span>
              </div>
              <div className="font-bold text-brand-blue mt-0.5">{activeCustomer.meter_number}</div>
            </div>

            <div className="p-3 rounded-lg bg-blue-tint/50 border border-black/10">
              <div className="text-[11px] font-bold uppercase tracking-wider text-black/50 flex items-center gap-1">
                <IconMapPin size={13} className="text-brand-blue" />
                <span>Barangay</span>
              </div>
              <div className="font-semibold text-black mt-0.5">{activeCustomer.barangay}</div>
            </div>

            <div className="p-3 rounded-lg bg-blue-tint/50 border border-black/10">
              <div className="text-[11px] font-bold uppercase tracking-wider text-black/50">
                Address
              </div>
              <div className="font-medium text-black mt-0.5 truncate" title={activeCustomer.address}>
                {activeCustomer.address}
              </div>
            </div>
          </div>
        </Card>

        {/* Latest Period Record */}
        {!latestRecord ? (
          <Card className="p-8 border border-black/10 bg-white rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,0.06)]">
            <EmptyState
              illustration={<EmptyBillsIllustration />}
              title="No billing yet"
              description="No billing statements found for your account."
            />
          </Card>
        ) : (
          <Card className="p-5 border border-black/10 bg-white rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,0.06)] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/10 pb-3">
              <div>
                <span className="text-xs font-bold text-black/50 uppercase tracking-wider block">
                  Active Billing Cycle
                </span>
                <h2 className="text-lg font-extrabold text-black">
                  {latestRecord.period_label}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant={latestRecord.total_balance <= 0 ? 'blue' : 'outline'}>
                  {latestRecord.total_balance <= 0 ? 'Settled' : 'Unpaid'}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              <div className="p-4 rounded-xl bg-brand-blue text-white flex flex-col justify-between shadow-sm">
                <div className="text-[11px] font-bold uppercase tracking-wider text-white/80">
                  Total Balance Due
                </div>
                <div className="text-3xl font-extrabold tracking-tight mt-1">
                  ₱{latestRecord.total_balance.toFixed(2)}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-blue-tint/60 border border-black/10 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-black/60">
                    Current Balance
                  </span>
                  <span className="text-[11px] font-semibold text-brand-blue flex items-center gap-1">
                    <IconCalendar size={13} />
                    Due {latestRecord.due_date}
                  </span>
                </div>
                <div className="text-2xl font-extrabold text-black mt-1">
                  ₱{latestRecord.current_balance.toFixed(2)}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-blue-tint/60 border border-black/10 flex flex-col justify-between">
                <div className="text-[11px] font-bold uppercase tracking-wider text-black/60">
                  Previous Balance
                </div>
                <div className="text-2xl font-extrabold mt-1 text-black">
                  ₱{latestRecord.previous_balance.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-black/10">
              <div className="text-xs text-black/60 flex items-center gap-1.5">
                <IconClock size={15} className="text-brand-blue" />
                <span>Last Updated:</span>
                <span className="font-bold text-black">{latestRecord.last_updated}</span>
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedStatement(latestRecord)}
                className="shrink-0"
              >
                <IconReceipt size={15} className="inline mr-1.5" />
                View Statement
              </Button>
            </div>
          </Card>
        )}

        {/* Payment History */}
        <Card className="p-4 sm:p-5 border border-black/10 bg-white rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,0.06)] space-y-3">
          <div className="flex items-center justify-between border-b border-black/10 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-tint text-brand-blue flex items-center justify-center">
                <IconCash size={18} />
              </div>
              <div>
                <span className="text-xs font-bold text-black/50 uppercase tracking-wider block">
                  Official Records
                </span>
                <h3 className="text-[14px] font-bold text-black">Payment History</h3>
              </div>
            </div>
            <Badge variant="outline">{customerPayments.length}</Badge>
          </div>

          {customerPayments.length === 0 ? (
            <div className="py-6 text-center text-xs text-black/60">
              No payment entries recorded.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-blue-tint text-black/70 border-b border-black/10">
                  <tr>
                    <th className="px-3 py-2.5 font-bold uppercase tracking-wider">Date</th>
                    <th className="px-3 py-2.5 font-bold uppercase tracking-wider">Period</th>
                    <th className="px-3 py-2.5 font-bold uppercase tracking-wider">Type / OR #</th>
                    <th className="px-3 py-2.5 font-bold uppercase tracking-wider text-right">Amount</th>
                    <th className="px-3 py-2.5 font-bold uppercase tracking-wider text-right">
                      Current
                    </th>
                    <th className="px-3 py-2.5 font-bold uppercase tracking-wider text-right">
                      Previous
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/10">
                  {customerPayments.map((entry) => {
                    const isReversal = entry.type === 'reversal';
                    return (
                      <tr
                        key={entry.id}
                        className={`${
                          isReversal ? 'bg-black/5' : 'hover:bg-blue-tint/50'
                        } transition-colors`}
                      >
                        <td className="px-3 py-2.5 font-medium text-black whitespace-nowrap">
                          {entry.payment_date}
                        </td>
                        <td className="px-3 py-2.5 font-semibold text-black">
                          {entry.period_label}
                        </td>
                        <td className="px-3 py-2.5">
                          {isReversal ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border border-black/20 text-black">
                              <IconRotate2 size={11} />
                              Reversal
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-tint text-brand-blue border border-brand-blue/20">
                              Payment
                            </span>
                          )}
                          {entry.or_number && (
                            <span className="ml-1.5 text-[11px] text-black/60 font-mono">
                              {entry.or_number}
                            </span>
                          )}
                        </td>
                        <td
                          className={`px-3 py-2.5 text-right font-bold whitespace-nowrap ${
                            isReversal ? 'text-black' : 'text-brand-blue'
                          }`}
                        >
                          {isReversal ? '+' : '-'}₱{entry.amount.toFixed(2)}
                        </td>
                        <td className="px-3 py-2.5 text-right text-black whitespace-nowrap">
                          ₱{entry.applied_to_current.toFixed(2)}
                        </td>
                        <td className="px-3 py-2.5 text-right text-black whitespace-nowrap">
                          ₱{entry.applied_to_previous.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Earlier Billing Periods */}
        <Card className="p-4 sm:p-5 border border-black/10 bg-white rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,0.06)] space-y-3">
          <div className="flex items-center justify-between border-b border-black/10 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-tint text-brand-blue flex items-center justify-center">
                <IconHistory size={18} />
              </div>
              <div>
                <span className="text-xs font-bold text-black/50 uppercase tracking-wider block">
                  Past Cycles
                </span>
                <h3 className="text-[14px] font-bold text-black">Earlier Billing Periods</h3>
              </div>
            </div>
            <Badge variant="outline">{earlierRecords.length}</Badge>
          </div>

          {earlierRecords.length === 0 ? (
            <div className="py-6 text-center text-xs text-black/60">
              No earlier billing periods.
            </div>
          ) : (
            <div className="divide-y divide-black/10">
              {earlierRecords.map((rec) => {
                const isSettled = rec.total_balance <= 0;
                return (
                  <div
                    key={rec.id}
                    onClick={() => setSelectedStatement(rec)}
                    className="py-3 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-blue-tint/50 cursor-pointer rounded-lg transition-colors"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[14px] text-black">
                          {rec.period_label}
                        </span>
                        <Badge variant={isSettled ? 'blue' : 'outline'}>
                          {isSettled ? 'Settled' : 'Unpaid'}
                        </Badge>
                      </div>
                      <div className="text-xs text-black/60">
                        Due {rec.due_date} · Updated {rec.last_updated}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs">
                      <div className="text-right">
                        <div className="text-black/50">Current</div>
                        <div className="font-bold text-black">
                          ₱{rec.current_balance.toFixed(2)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-black/50">Previous</div>
                        <div className="font-bold text-black">
                          ₱{rec.previous_balance.toFixed(2)}
                        </div>
                      </div>
                      <div className="text-right min-w-[80px]">
                        <div className="text-black/50">Total</div>
                        <div className="font-extrabold text-[14px] text-brand-blue">
                          ₱{rec.total_balance.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Statement Modal */}
      {selectedStatement &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-white rounded-xl border border-black/15 p-5 space-y-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] text-[14px] max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-black/10 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md bg-blue-tint text-brand-blue flex items-center justify-center">
                    <IconReceipt size={16} />
                  </div>
                  <h2 className="text-[14px] font-bold text-black">Statement of Account</h2>
                </div>
                <button
                  onClick={() => setSelectedStatement(null)}
                  className="text-black/50 hover:text-black p-1 rounded-md hover:bg-black/5 transition-colors"
                >
                  <IconX size={18} />
                </button>
              </div>

              <div className="border border-black/10 p-4 rounded-xl space-y-3 bg-blue-tint/50">
                <div className="text-center border-b border-black/10 pb-2.5">
                  <div className="font-bold text-black text-[14px]">
                    Municipality of Sinacaban
                  </div>
                  <div className="text-brand-blue mt-0.5 font-bold text-xs">
                    {selectedStatement.period_label}
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-black/60">Customer:</span>
                    <span className="text-black font-bold">
                      {selectedStatement.customer_name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-black/60">Account #:</span>
                    <span className="text-black font-semibold">
                      {selectedStatement.account_number}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-black/60">Meter #:</span>
                    <span className="text-brand-blue font-bold">
                      {selectedStatement.meter_number}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-black/60">Address:</span>
                    <span className="text-black font-medium text-right max-w-[220px]">
                      {selectedStatement.address}
                    </span>
                  </div>

                  <div className="border-t border-black/10 pt-2 space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-black/60">Current Balance:</span>
                      <span className="text-black font-bold">
                        ₱{selectedStatement.current_balance.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-black/60">Due Date:</span>
                      <span className="text-black font-semibold">
                        {selectedStatement.due_date}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-black/60">Previous Balance:</span>
                      <span className="text-black font-bold">
                        ₱{selectedStatement.previous_balance.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-baseline border-t border-black/15 pt-2.5">
                    <span className="font-bold text-black uppercase">Total Balance:</span>
                    <span className="font-extrabold text-lg text-brand-blue">
                      ₱{selectedStatement.total_balance.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between text-[11px] text-black/60 pt-1">
                    <span>Updated:</span>
                    <span>{selectedStatement.last_updated}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-black/10">
                <Button variant="secondary" leftIcon={<IconPrinter size={14} />} onClick={() => window.print()}>
                  Print
                </Button>
                <Button variant="primary" onClick={() => setSelectedStatement(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </CustomerLayout>
  );
}
