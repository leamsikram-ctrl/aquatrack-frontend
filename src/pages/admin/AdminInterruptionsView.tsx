import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/templates/AdminLayout';
import { Card } from '../../components/atoms/Card';
import { Button } from '../../components/atoms/Button';
import { Badge } from '../../components/atoms/Badge';
import { EmptyState } from '../../components/molecules/EmptyState';
import { interruptionsApi, referenceApi } from '../../api';
import type { WaterInterruption, Barangay } from '../../types';
import { IconAlertTriangle, IconPlus, IconX, IconCheck, IconCalendarTime, IconMapPin } from '@tabler/icons-react';

export function AdminInterruptionsView() {
  const navigate = useNavigate();
  const [interruptions, setInterruptions] = useState<WaterInterruption[]>([]);
  const [barangays, setBarangays] = useState<Barangay[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New Advisory Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [message, setMessage] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [selectedBarangayIds, setSelectedBarangayIds] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [intRes, bgRes] = await Promise.all([
        interruptionsApi.list().catch(() => ({ data: [] })),
        referenceApi.getBarangays().catch(() => []),
      ]);
      setInterruptions(intRes.data);
      setBarangays(bgRes);
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleBarangay = (id: number) => {
    if (selectedBarangayIds.includes(id)) {
      setSelectedBarangayIds(selectedBarangayIds.filter((bId) => bId !== id));
    } else {
      setSelectedBarangayIds([...selectedBarangayIds, id]);
    }
  };

  const handleSelectAllBarangays = () => {
    if (selectedBarangayIds.length === barangays.length) {
      setSelectedBarangayIds([]);
    } else {
      setSelectedBarangayIds(barangays.map((b) => b.id));
    }
  };

  const handleCreateAdvisory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !startsAt || !endsAt || selectedBarangayIds.length === 0) {
      setCreateError('Please complete the message, dates, and select at least one barangay.');
      return;
    }

    setIsSubmitting(true);
    setCreateError(null);

    try {
      await interruptionsApi.create({
        message: message.trim(),
        starts_at: startsAt,
        ends_at: endsAt,
        barangay_ids: selectedBarangayIds,
      });

      setShowCreateModal(false);
      setMessage('');
      setStartsAt('');
      setEndsAt('');
      setSelectedBarangayIds([]);
      fetchData();
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      setCreateError(apiErr.response?.data?.message || 'Failed to publish advisory. Check input format.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminLayout
      title="Water Advisories"
      subtitle="Public Notices & Repairs"
      currentPath="/admin/interruptions"
      onNavigate={(path) => navigate(path)}
    >
      <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/15 pb-4">
        <div>
          <h1 className="text-[10px] font-bold text-black uppercase tracking-wider">
            Water Service Interruption Advisories
          </h1>
          <p className="text-[10px] text-black/60">
            Publish and manage emergency maintenance notices, pipeline repairs, and low pressure schedules.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="primary" onClick={() => setShowCreateModal(true)}>
            <IconPlus size={12} className="inline mr-1" />
            Create Advisory
          </Button>
        </div>
      </div>

      {/* Advisory Count Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border border-black/15">
          <div className="text-[10px] text-black/60 uppercase font-bold">Total Advisories</div>
          <div className="text-[10px] font-bold text-black mt-1">{interruptions.length}</div>
          <div className="text-[10px] text-black/50 mt-0.5">Recorded in municipal registry</div>
        </Card>
        <Card className="p-4 border border-black/15">
          <div className="text-[10px] text-black/60 uppercase font-bold">Published & Live</div>
          <div className="text-[10px] font-bold text-[#1E6FD9] mt-1">
            {interruptions.filter((i) => i.is_published).length}
          </div>
          <div className="text-[10px] text-black/50 mt-0.5">Broadcasted to consumer portal</div>
        </Card>
        <Card className="p-4 border border-black/15">
          <div className="text-[10px] text-black/60 uppercase font-bold">Active Barangays</div>
          <div className="text-[10px] font-bold text-black mt-1">{barangays.length}</div>
          <div className="text-[10px] text-black/50 mt-0.5">Sinacaban coverage zones</div>
        </Card>
      </div>

      {/* List of Advisories */}
      {isLoading ? (
        <Card className="p-8 text-center text-black/60 border border-black/15">
          Loading water interruption advisories...
        </Card>
      ) : interruptions.length === 0 ? (
        <EmptyState
          title="No Water Interruption Advisories"
          description="There are currently no active or historical interruption advisories posted."
          actionLabel="Create First Advisory"
          onAction={() => setShowCreateModal(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {interruptions.map((advisory) => (
            <Card
              key={advisory.id}
              className="p-4 space-y-3 border-l-4 border-l-[#1E6FD9] border border-black/15"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <IconAlertTriangle size={14} className="text-[#1E6FD9] shrink-0" />
                  <span className="font-bold text-black uppercase tracking-wider">
                    Advisory #{advisory.id}
                  </span>
                </div>
                <Badge variant={advisory.is_published ? 'blue' : 'black'}>
                  {advisory.is_published ? 'Published' : 'Draft'}
                </Badge>
              </div>

              <p className="text-black leading-relaxed font-normal bg-[#F0F6FD] p-2.5 rounded border border-black/10">
                {advisory.message}
              </p>

              <div className="space-y-1.5 text-black/70 pt-1">
                <div className="flex items-center gap-1.5">
                  <IconCalendarTime size={12} className="text-black/50 shrink-0" />
                  <span>
                    <strong>Starts:</strong> {new Date(advisory.starts_at).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <IconCalendarTime size={12} className="text-black/50 shrink-0" />
                  <span>
                    <strong>Expected End:</strong> {new Date(advisory.ends_at).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-start gap-1.5 pt-1 border-t border-black/10">
                  <IconMapPin size={12} className="text-black/50 shrink-0 mt-0.5" />
                  <div>
                    <strong>Affected Areas:</strong>{' '}
                    {advisory.barangays && advisory.barangays.length > 0 ? (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {advisory.barangays.map((b) => (
                          <span
                            key={b.id}
                            className="inline-block bg-white border border-black/20 text-black px-1.5 py-0.5 rounded text-[10px]"
                          >
                            {b.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span>All Sinacaban Service Zones</span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Advisory Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg bg-white rounded-lg border border-black p-5 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-black/15 pb-2">
              <div className="flex items-center gap-2">
                <IconAlertTriangle size={14} className="text-[#1E6FD9]" />
                <span className="font-bold text-black uppercase tracking-wider">
                  Create Municipal Water Advisory
                </span>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-black hover:text-[#1E6FD9] p-1 font-bold"
              >
                <IconX size={14} />
              </button>
            </div>

            {createError && (
              <div className="p-2.5 bg-[#F0F6FD] border border-black text-black rounded text-[10px]">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateAdvisory} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-black uppercase mb-1">
                  Advisory Notice / Message
                </label>
                <textarea
                  className="w-full p-2.5 text-[10px] bg-white text-black border border-black rounded outline-none focus:border-[#1E6FD9] h-24"
                  placeholder="e.g. Emergency pipeline repair along National Highway. Low water pressure or temporary cutoff expected."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-black uppercase mb-1">
                    Interruption Start Time
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full p-2 text-[10px] bg-white text-black border border-black rounded outline-none focus:border-[#1E6FD9]"
                    value={startsAt}
                    onChange={(e) => setStartsAt(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-black uppercase mb-1">
                    Expected Restoration Time
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full p-2 text-[10px] bg-white text-black border border-black rounded outline-none focus:border-[#1E6FD9]"
                    value={endsAt}
                    onChange={(e) => setEndsAt(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-bold text-black uppercase">
                    Select Affected Barangays ({selectedBarangayIds.length} Selected)
                  </label>
                  <button
                    type="button"
                    onClick={handleSelectAllBarangays}
                    className="text-[10px] text-[#1E6FD9] underline font-bold"
                  >
                    {selectedBarangayIds.length === barangays.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-36 overflow-y-auto p-2 border border-black/15 rounded bg-[#F0F6FD]">
                  {barangays.map((b) => {
                    const isChecked = selectedBarangayIds.includes(b.id);
                    return (
                      <label
                        key={b.id}
                        className={`flex items-center gap-1.5 p-1.5 rounded cursor-pointer border text-[10px] ${
                          isChecked
                            ? 'bg-[#1E6FD9] text-white border-black font-bold'
                            : 'bg-white text-black border-black/20 hover:border-black'
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={isChecked}
                          onChange={() => handleToggleBarangay(b.id)}
                        />
                        <span>{isChecked ? '✓ ' : ''}{b.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-black/15">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  isLoading={isSubmitting}
                >
                  <IconCheck size={12} className="inline mr-1" />
                  Publish Advisory
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </AdminLayout>
  );
}
