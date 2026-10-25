import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StaffLayout } from '../../components/templates/StaffLayout';
import { Card } from '../../components/atoms/Card';
import { Button } from '../../components/atoms/Button';
import { Badge } from '../../components/atoms/Badge';
import { EmptyState } from '../../components/molecules/EmptyState';
import { StatusTimeline } from '../../components/organisms/StatusTimeline';
import { requestsApi } from '../../api';
import type { ServiceRequest } from '../../types';
import { maintenanceStore } from '../../services/maintenanceStore';
import { IconCheck, IconEye } from '@tabler/icons-react';

export function StaffHistoryView() {
  const navigate = useNavigate();
  const [completedTasks, setCompletedTasks] = useState<ServiceRequest[]>(() =>
    maintenanceStore.getRequests().filter((r) => r.status === 'resolved')
  );
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState<ServiceRequest | null>(null);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const res = await requestsApi.list({ status: 'resolved', per_page: 50 }).catch(() => ({ data: [] }));
      if (res && Array.isArray(res.data)) {
        setCompletedTasks(res.data);
      } else {
        setCompletedTasks(maintenanceStore.getRequests().filter((r) => r.status === 'resolved'));
      }
    } catch {
      setCompletedTasks(maintenanceStore.getRequests().filter((r) => r.status === 'resolved'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const distinctBarangays = new Set(
    completedTasks.map((t) => t.customer?.barangay || t.barangay?.name).filter(Boolean)
  ).size;

  const latestResolvedDate =
    completedTasks[0]?.resolved_at || completedTasks[0]?.updated_at
      ? new Date(completedTasks[0]?.resolved_at || completedTasks[0]?.updated_at || '').toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })
      : 'None yet';

  return (
    <StaffLayout currentPath="/staff/history" onNavigate={(path) => navigate(path)}>
      <div className="space-y-6">
        {/* Header */}
        <div className="pb-1">
          <h1 className="text-xl sm:text-2xl font-bold text-black">
            Completed Operations
          </h1>
        </div>

        {/* Summary KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4 border border-black/15 bg-white">
            <div className="text-xs font-semibold text-black/60">Total Resolved</div>
            <div className="text-3xl sm:text-4xl font-bold text-brand-blue leading-none mt-2">
              {completedTasks.length}
            </div>
          </Card>
          <Card className="p-4 border border-black/15 bg-white">
            <div className="text-xs font-semibold text-black/60">Barangays Covered</div>
            <div className="text-3xl sm:text-4xl font-bold text-black leading-none mt-2">
              {distinctBarangays || (completedTasks.length > 0 ? 1 : 0)}
            </div>
          </Card>
          <Card className="p-4 border border-black/15 bg-white">
            <div className="text-xs font-semibold text-black/60">Latest Resolution</div>
            <div className="text-xl sm:text-2xl font-bold text-black leading-none mt-3">
              {latestResolvedDate}
            </div>
          </Card>
        </div>

        {/* Tasks Table */}
        <Card className="p-0 overflow-hidden border border-black/15">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[14px]">
              <thead className="bg-white text-black border-b border-black/15">
                <tr>
                  <th className="px-4 py-2 text-xs font-semibold text-black/60">Reference</th>
                  <th className="px-4 py-2 text-xs font-semibold text-black/60">Issue Type</th>
                  <th className="px-4 py-2 text-xs font-semibold text-black/60">Barangay</th>
                  <th className="px-4 py-2 text-xs font-semibold text-black/60">Resolution Remarks</th>
                  <th className="px-4 py-2 text-xs font-semibold text-black/60">Status</th>
                  <th className="px-4 py-2 text-xs font-semibold text-black/60 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-black/50">
                      Loading resolved history...
                    </td>
                  </tr>
                ) : completedTasks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-black/50">
                      <EmptyState
                        title="No Completed Operations Found"
                        description="No resolved maintenance tasks recorded yet."
                      />
                    </td>
                  </tr>
                ) : (
                  completedTasks.map((task) => (
                    <tr key={task.id} className="hover:bg-black/5 transition-colors">
                      <td className="px-4 py-3 font-medium text-brand-blue">
                        {task.reference_no || task.reference}
                      </td>
                      <td className="px-4 py-3 font-normal text-black">
                        {task.issue_type?.name || 'General Leak'}
                      </td>
                      <td className="px-4 py-3 text-black font-normal">
                        {task.customer?.barangay || task.barangay?.name || 'Poblacion'}
                      </td>
                      <td className="px-4 py-3 text-black max-w-xs truncate font-normal">
                        {task.resolution_remarks || 'Inspection and valve calibration complete.'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="blue">RESOLVED</Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="secondary"
                          onClick={() => setSelectedTask(task)}
                        >
                          <IconEye size={12} className="inline mr-1" />
                          View Report
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* View Report Modal */}
        {selectedTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md bg-white rounded-lg border border-black p-5 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-black/15 pb-2">
                <div className="flex items-center gap-2">
                  <IconCheck size={14} className="text-brand-blue" />
                  <h2 className="text-sm font-bold text-black">
                    Resolution Report ({selectedTask.reference_no || selectedTask.reference})
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="text-black hover:text-brand-blue p-1"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 bg-white p-3 rounded border border-black/15 text-[14px]">
                <div>
                  <span className="text-black/60 text-xs font-medium block">Issue Type:</span>
                  <span className="text-black font-medium">
                    {selectedTask.issue_type?.name || 'Water Service'}
                  </span>
                </div>

                <div>
                  <span className="text-black/60 text-xs font-medium block">Original Problem:</span>
                  <p className="text-black bg-white p-2 rounded border border-black/15 mt-1">
                    {selectedTask.description}
                  </p>
                </div>

                <div>
                  <span className="text-black/60 text-xs font-medium block">Assigned Technician:</span>
                  <span className="text-black font-medium">
                    {selectedTask.assigned_staff?.name || 'Technician Staff'}
                  </span>
                </div>

                <div className="border-t border-black/10 pt-2">
                  <span className="text-black/60 text-xs font-medium block">
                    Technician Resolution Notes:
                  </span>
                  <p className="text-black bg-white p-2.5 rounded border border-black/15 mt-1 font-normal">
                    {selectedTask.resolution_remarks || 'Pipeline replaced with heavy-duty PVC junction and tested for standard water pressure.'}
                  </p>
                </div>

                <div className="border-t border-black/10 pt-2">
                  <span className="text-black/60 text-xs font-medium block mb-1.5">
                    Status Timeline:
                  </span>
                  <StatusTimeline
                    status={selectedTask.status}
                    submittedAt={selectedTask.created_at}
                    assignedAt={selectedTask.assigned_at}
                    startedAt={selectedTask.started_at}
                    resolvedAt={selectedTask.resolved_at}
                    cancelledAt={selectedTask.cancelled_at}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-black/15">
                <Button
                  variant="secondary"
                  onClick={() => setSelectedTask(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </StaffLayout>
  );
}
