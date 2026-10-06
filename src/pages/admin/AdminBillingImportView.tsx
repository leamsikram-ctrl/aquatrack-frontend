import { useState, useEffect } from 'react';
import { Card } from '../../components/atoms/Card';
import { Button } from '../../components/atoms/Button';
import { Badge } from '../../components/atoms/Badge';
import { EmptyState } from '../../components/molecules/EmptyState';
import { billingApi } from '../../api';
import type { Billing } from '../../types';
import { IconUpload, IconFileSpreadsheet, IconCheck, IconAlertCircle, IconLock } from '@tabler/icons-react';

export function AdminBillingImportView() {
  const [billings, setBillings] = useState<Billing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // Import summary state
  const [importSummary, setImportSummary] = useState<{
    batch_id: number;
    total_rows: number;
    created: number;
    updated: number;
    rejected: number;
    errors: string[];
  } | null>(null);

  const fetchBillings = async () => {
    setIsLoading(true);
    try {
      const res = await billingApi.list({ payment_status: undefined });
      setBillings(res.data);
    } catch {
      // Empty fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBillings();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUploadCsv = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setImportSummary(null);

    try {
      const res = await billingApi.importCsv(selectedFile);
      setImportSummary({
        batch_id: res.batch_id,
        ...res.summary,
      });
      setSelectedFile(null);
      fetchBillings();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      alert(errorObj?.response?.data?.message || 'CSV Import failed. Check file format.');
    } finally {
      setIsUploading(false);
    }
  };

  const handlePublishAllUnpublished = async () => {
    const unpublishedIds = billings.filter((b) => !b.is_published).map((b) => b.id);
    if (unpublishedIds.length === 0) {
      alert('No unpublished bills to publish.');
      return;
    }

    setIsPublishing(true);
    try {
      await billingApi.publish(unpublishedIds);
      fetchBillings();
    } catch {
      alert('Failed to publish bills.');
    } finally {
      setIsPublishing(false);
    }
  };

  const unpublishedCount = billings.filter((b) => !b.is_published).length;

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/10 pb-4">
        <div>
          <h1 className="text-[10px] font-bold uppercase tracking-wider text-black">
            Monthly Billing Batch CSV Import & Publishing
          </h1>
          <p className="text-[10px] text-black/60">
            Upload billing statements by account number with automated lock enforcement
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={unpublishedCount > 0 ? 'blue' : 'outline'}>
            {unpublishedCount} UNPUBLISHED STATEMENTS
          </Badge>
          {unpublishedCount > 0 && (
            <Button
              variant="primary"
              onClick={handlePublishAllUnpublished}
              disabled={isPublishing}
            >
              {isPublishing ? 'Publishing...' : 'Publish Batch (SMS Queue)'}
            </Button>
          )}
        </div>
      </div>

      {/* CSV Dropzone / Upload Box */}
      <Card className="p-6 border border-black/20 space-y-4">
        <div className="flex items-center gap-2 font-bold text-black border-b border-black/10 pb-2">
          <IconFileSpreadsheet size={16} className="text-[#1E6FD9]" />
          <span>Upload SIWASS Billing CSV Batch</span>
        </div>

        <div className="border-2 border-dashed border-black/20 rounded-xl p-6 text-center space-y-3 bg-[#F0F6FD]/30 hover:bg-[#F0F6FD]/60 transition-colors">
          <IconUpload size={24} className="mx-auto text-black/60" />
          <div className="space-y-1">
            <span className="font-bold text-black block">
              {selectedFile ? selectedFile.name : 'Choose or drop a billing CSV file'}
            </span>
            <span className="text-[10px] text-black/60 block">
              Headers required: <code>account_number, billing_period, amount_due, due_date</code>
            </span>
          </div>

          <div className="flex items-center justify-center gap-3">
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
              className="hidden"
              id="csvFileInput"
            />
            <label
              htmlFor="csvFileInput"
              className="px-4 py-2 bg-white text-black border border-black/20 rounded-lg cursor-pointer hover:border-black font-medium text-[10px]"
            >
              Select CSV File
            </label>

            {selectedFile && (
              <Button
                variant="primary"
                onClick={handleUploadCsv}
                disabled={isUploading}
              >
                {isUploading ? 'Parsing & Importing...' : 'Execute Batch Import'}
              </Button>
            )}
          </div>
        </div>

        {/* Import Results Banner */}
        {importSummary && (
          <div className="p-4 bg-white border-2 border-black rounded-lg space-y-3">
            <div className="flex items-center justify-between border-b border-black/10 pb-2">
              <div className="flex items-center gap-2 font-bold text-black">
                <IconCheck size={16} className="text-[#1E6FD9]" />
                <span>Batch #{importSummary.batch_id} Processing Summary</span>
              </div>
              <Badge variant="blue">COMPLETE</Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
              <div className="p-2 bg-[#F0F6FD] rounded border border-black/10">
                <span className="text-black/60 block">Total Processed:</span>
                <span className="font-bold text-black text-[12px]">{importSummary.total_rows}</span>
              </div>
              <div className="p-2 bg-[#F0F6FD] rounded border border-black/10">
                <span className="text-black/60 block">Newly Created:</span>
                <span className="font-bold text-black text-[12px]">{importSummary.created}</span>
              </div>
              <div className="p-2 bg-[#F0F6FD] rounded border border-black/10">
                <span className="text-black/60 block">Updated:</span>
                <span className="font-bold text-black text-[12px]">{importSummary.updated}</span>
              </div>
              <div className="p-2 bg-[#F0F6FD] rounded border border-black/10">
                <span className="text-black/60 block">Rejected (Locked):</span>
                <span className="font-bold text-black text-[12px]">{importSummary.rejected}</span>
              </div>
            </div>

            {importSummary.errors.length > 0 && (
              <div className="space-y-1 p-3 bg-white border border-black rounded">
                <div className="flex items-center gap-1 font-bold text-black">
                  <IconAlertCircle size={14} className="text-black" />
                  <span>Row Error & Publish Lock Logs:</span>
                </div>
                <div className="max-h-24 overflow-y-auto space-y-1 text-black/80 font-mono text-[9px]">
                  {importSummary.errors.map((err, i) => (
                    <div key={i}>• {err}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Existing Billing Records Table */}
      <Card className="overflow-hidden border border-black/20">
        <div className="px-5 py-3 border-b border-black/10 flex items-center justify-between">
          <span className="font-bold text-black uppercase tracking-wider text-[10px]">
            Billing Statements Archive ({billings.length} records)
          </span>
          <Button variant="ghost" onClick={fetchBillings}>
            Refresh Table
          </Button>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-black/60">
            Loading billing records...
          </div>
        ) : billings.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No Billing Records In System"
              description="Upload your first SIWASS billing CSV file above to populate accounts and amounts due."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[10px]">
              <thead className="bg-[#F0F6FD] border-b border-black/10 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-2.5 font-bold text-black">Account #</th>
                  <th className="px-4 py-2.5 font-bold text-black">Customer Name</th>
                  <th className="px-4 py-2.5 font-bold text-black">Period</th>
                  <th className="px-4 py-2.5 font-bold text-black">Amount Due</th>
                  <th className="px-4 py-2.5 font-bold text-black">Due Date</th>
                  <th className="px-4 py-2.5 font-bold text-black">Payment</th>
                  <th className="px-4 py-2.5 font-bold text-black">Publish State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {billings.map((b) => (
                  <tr key={b.id} className="hover:bg-[#F0F6FD]/50 transition-colors">
                    <td className="px-4 py-2 font-bold text-[#1E6FD9]">
                      {b.customer_profile?.account_number ?? `ACC-UID-${b.customer_profile_id}`}
                    </td>
                    <td className="px-4 py-2 text-black font-medium">
                      {b.customer_profile ? `${b.customer_profile.first_name} ${b.customer_profile.last_name}` : 'Unknown'}
                    </td>
                    <td className="px-4 py-2 text-black">{b.billing_period}</td>
                    <td className="px-4 py-2 font-bold text-black">
                      ₱{Number(b.amount_due).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-2 text-black">{b.due_date}</td>
                    <td className="px-4 py-2">
                      <Badge variant={b.payment_status === 'paid' ? 'blue' : 'outline'}>
                        {b.payment_status.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-4 py-2">
                      {b.is_published ? (
                        <span className="inline-flex items-center gap-1 font-bold text-black">
                          <IconLock size={12} className="text-[#1E6FD9]" />
                          PUBLISHED (LOCKED)
                        </span>
                      ) : (
                        <Badge variant="outline">DRAFT / UNPUBLISHED</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
