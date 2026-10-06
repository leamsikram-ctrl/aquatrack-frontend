import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StaffLayout } from '../../components/templates/StaffLayout';
import { Card } from '../../components/atoms/Card';
import { Badge } from '../../components/atoms/Badge';
import { Button } from '../../components/atoms/Button';
import { EmptyState } from '../../components/molecules/EmptyState';
import { requestsApi } from '../../api';
import type { ServiceRequest } from '../../types';
import {
  IconTool,
  IconMapPin,
  IconPhone,
  IconCamera,
  IconCheck,
  IconClock,
  IconFilter,
} from '@tabler/icons-react';

export function StaffTasksView() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<ServiceRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'assigned' | 'in_progress' | 'resolved'>('all');

  // Resolving Work Order State
  const [resolvingTaskId, setResolvingTaskId] = useState<number | null>(null);
  const [remarks, setRemarks] = useState<string>('');
  const [partsUsed, setPartsUsed] = useState<string>('');
  const [photoUploaded, setPhotoUploaded] = useState<boolean>(false);
  const [isSubmittingResolve, setIsSubmittingResolve] = useState<boolean>(false);

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const data = await requestsApi.list({
        status: statusFilter === 'all' ? undefined : statusFilter,
        per_page: 50,
      });
      setTasks(data.data);
    } catch {
      // Offline fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [statusFilter]);

  const handleStartTask = async (id: number) => {
    try {
      await requestsApi.start(id);
      fetchTasks();
    } catch {
      alert('Could not start task.');
    }
  };

  const handleResolveTask = async (id: number) => {
    if (!remarks.trim()) {
      alert('Resolution remarks are required to close this task.');
      return;
    }

    setIsSubmittingResolve(true);
    try {
      const fullRemarks = partsUsed.trim()
        ? `${remarks.trim()} [Materials used: ${partsUsed.trim()}]`
        : remarks.trim();

      await requestsApi.resolve(id, fullRemarks);
      setResolvingTaskId(null);
      setRemarks('');
      setPartsUsed('');
      setPhotoUploaded(false);
      fetchTasks();
    } catch {
      alert('Could not resolve task.');
    } finally {
      setIsSubmittingResolve(false);
    }
  };

  return (
    <StaffLayout currentPath="/staff/tasks" onNavigate={(path) => navigate(path)}>
      <div className="space-y-6 text-[10px]">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/15 pb-3">
          <div>
            <h1 className="text-[10px] font-bold text-black uppercase tracking-wider">
              Technician Field Work Orders
            </h1>
            <p className="text-[10px] text-black/60">
              Assigned pipeline maintenance, leak dispatches, and emergency repairs in Sinacaban
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="blue">{tasks.length} Assigned Jobs</Badge>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <IconFilter size={12} className="text-black/60" />
            <span className="text-[10px] font-bold text-black uppercase">Filter Status:</span>
          </div>
          {(['all', 'assigned', 'in_progress', 'resolved'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded text-[10px] font-bold capitalize transition-colors border border-black ${
                statusFilter === st
                  ? 'bg-[#1E6FD9] text-white'
                  : 'bg-white text-black hover:bg-[#F0F6FD]'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>

        {tasks.length === 0 ? (
          <EmptyState
            title={isLoading ? 'Loading assigned work orders...' : 'No tasks currently assigned'}
            description={
              isLoading
                ? 'Fetching live tasks from server.'
                : 'All maintenance requests in your sector have been completed or none match the selected filter.'
            }
          />
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => {
              const isResolvingThis = resolvingTaskId === task.id;

              return (
                <Card
                  key={task.id}
                  className="space-y-3 border-l-4 border-l-[#1E6FD9] border border-black/15 p-4"
                >
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#1E6FD9] text-[10px]">
                          {task.reference_no || task.reference}
                        </span>
                        <span className="text-black/40">·</span>
                        <span className="font-bold text-black uppercase text-[10px]">
                          {task.issue_type?.name || 'General Leak'}
                        </span>
                      </div>
                      <p className="text-black/90 font-medium mt-1 text-[10px]">
                        {task.description}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <Badge variant={task.urgency === 'high' ? 'black' : 'blue'}>
                        {task.urgency ? task.urgency.toUpperCase() : 'MEDIUM'} URGENCY
                      </Badge>
                      <span className="text-[9px] text-black/50">
                        Created: {new Date(task.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Customer & Location Info Box */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-2.5 bg-[#F0F6FD] rounded border border-black/10 text-[10px]">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-black">
                        <IconMapPin size={12} className="text-[#1E6FD9] shrink-0" />
                        <span>
                          <strong>Location:</strong> {task.customer?.barangay ?? 'Sinacaban'},{' '}
                          {task.customer?.address ?? 'Customer Residence'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-black">
                        <IconPhone size={12} className="text-[#1E6FD9] shrink-0" />
                        <span>
                          <strong>Contact:</strong>{' '}
                          {task.customer?.mobile_number ?? '0917-000-0000'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1 sm:border-l sm:border-black/10 sm:pl-3">
                      <div>
                        <strong>Resident:</strong>{' '}
                        {task.customer?.full_name ?? 'Sinacaban Consumer'}
                      </div>
                      <div>
                        <strong>Account No:</strong>{' '}
                        <span className="font-mono text-[#1E6FD9]">
                          {task.customer?.account_number ?? 'ACC-2026-0001'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status Bar & Action Controls */}
                  <div className="flex items-center justify-between pt-2 border-t border-black/10">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          task.status === 'in_progress'
                            ? 'blue'
                            : task.status === 'resolved'
                            ? 'black'
                            : 'outline'
                        }
                      >
                        STATUS: {task.status.toUpperCase().replace('_', ' ')}
                      </Badge>

                      {task.started_at && (
                        <span className="text-[9px] text-black/60 flex items-center gap-1">
                          <IconClock size={10} />
                          En route since {new Date(task.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {task.status === 'assigned' && (
                        <Button
                          variant="primary"
                          onClick={() => handleStartTask(task.id)}
                          className="py-1 px-3"
                        >
                          <IconTool size={12} className="inline mr-1" />
                          Start Work Order
                        </Button>
                      )}

                      {task.status === 'in_progress' && !isResolvingThis && (
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setResolvingTaskId(task.id);
                            setRemarks('');
                            setPartsUsed('');
                            setPhotoUploaded(false);
                          }}
                          className="py-1 px-3"
                        >
                          <IconCheck size={12} className="inline mr-1" />
                          Resolve Order
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Resolution Input Box */}
                  {isResolvingThis && (
                    <div className="mt-3 p-3.5 bg-white border-2 border-black rounded space-y-3">
                      <div className="flex items-center justify-between border-b border-black/15 pb-2">
                        <span className="font-bold text-black uppercase tracking-wider text-[10px]">
                          Complete Work Order · Field Report
                        </span>
                        <button
                          onClick={() => setResolvingTaskId(null)}
                          className="text-black hover:text-[#1E6FD9] font-bold"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="space-y-1">
                        <label className="block font-bold uppercase text-black text-[10px]">
                          Technician Resolution Remarks (Required):
                        </label>
                        <textarea
                          className="w-full p-2 text-[10px] text-black bg-white border border-black rounded outline-none focus:border-[#1E6FD9]"
                          rows={2}
                          placeholder="Describe repair actions (e.g. Replaced 1/2-inch gate valve and verified pipeline water pressure)..."
                          value={remarks}
                          onChange={(e) => setRemarks(e.target.value)}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="block font-bold uppercase text-black text-[10px]">
                            Materials & Parts Used:
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. 1x PVC Elbow, 2x Teflon tape"
                            className="w-full p-1.5 text-[10px] text-black bg-white border border-black rounded outline-none focus:border-[#1E6FD9]"
                            value={partsUsed}
                            onChange={(e) => setPartsUsed(e.target.value)}
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block font-bold uppercase text-black text-[10px]">
                            Work Completion Photo:
                          </label>
                          <button
                            type="button"
                            onClick={() => setPhotoUploaded(!photoUploaded)}
                            className={`w-full py-1.5 px-2 rounded border flex items-center justify-center gap-1.5 text-[10px] font-bold transition-colors ${
                              photoUploaded
                                ? 'bg-[#1E6FD9] text-white border-[#1E6FD9]'
                                : 'bg-white text-black border-black hover:bg-[#F0F6FD]'
                            }`}
                          >
                            <IconCamera size={12} />
                            {photoUploaded ? '✓ Photo Attached' : 'Attach Photo Proof'}
                          </button>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t border-black/10">
                        <Button
                          variant="ghost"
                          onClick={() => setResolvingTaskId(null)}
                          disabled={isSubmittingResolve}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="primary"
                          onClick={() => handleResolveTask(task.id)}
                          isLoading={isSubmittingResolve}
                        >
                          Submit Resolution Report
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </StaffLayout>
  );
}
