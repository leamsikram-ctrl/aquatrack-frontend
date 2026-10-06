import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StaffLayout } from '../../components/templates/StaffLayout';
import { Card } from '../../components/atoms/Card';
import { Badge } from '../../components/atoms/Badge';
import { Button } from '../../components/atoms/Button';
import { EmptyState } from '../../components/molecules/EmptyState';
import { requestsApi } from '../../api';
import type { ServiceRequest } from '../../types';

export function StaffTasksView() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<ServiceRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [resolvingTaskId, setResolvingTaskId] = useState<number | null>(null);
  const [remarks, setRemarks] = useState<string>('');

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const data = await requestsApi.list({ per_page: 20 });
      setTasks(data.data);
    } catch {
      // Offline fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

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
      alert('Remarks are required to resolve a task.');
      return;
    }

    try {
      await requestsApi.resolve(id, remarks);
      setResolvingTaskId(null);
      setRemarks('');
      fetchTasks();
    } catch {
      alert('Could not resolve task.');
    }
  };

  return (
    <StaffLayout currentPath="/staff/tasks" onNavigate={(path) => navigate(path)}>
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-black/10 pb-3">
          <div>
            <h1 className="text-sm font-bold text-black">Technician Work Orders</h1>
            <p className="text-sm text-black/70">Tasks assigned in your coverage area (Sinacaban Area 1)</p>
          </div>
          <Badge variant="blue">{tasks.length} Assigned</Badge>
        </div>

        {tasks.length === 0 ? (
          <EmptyState
            title={isLoading ? 'Loading assigned work orders...' : 'No tasks currently assigned'}
            description={isLoading ? 'Fetching live tasks from server.' : 'All maintenance requests in your sector have been completed.'}
          />
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => (
              <Card key={task.id} className="space-y-3 border-l-4 border-l-[#1E6FD9]">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-black">
                    {task.reference} · {task.description}
                  </span>
                  <Badge variant={task.urgency === 'high' ? 'black' : 'blue'}>
                    {task.urgency ? task.urgency.toUpperCase() : 'MEDIUM'} URGENCY
                  </Badge>
                </div>

                <div className="text-sm text-black/80">
                  Location: {task.customer?.barangay ?? 'Sinacaban'}, {task.customer?.address ?? 'Customer Residence'}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-black/10">
                  <Badge variant={task.status === 'in_progress' ? 'blue' : 'outline'}>
                    STATUS: {task.status.toUpperCase()}
                  </Badge>

                  <div className="flex items-center gap-2">
                    {task.status === 'assigned' && (
                      <Button variant="primary" onClick={() => handleStartTask(task.id)}>
                        Get Started
                      </Button>
                    )}

                    {task.status === 'in_progress' && (
                      <Button variant="secondary" onClick={() => setResolvingTaskId(task.id)}>
                        Mark Resolved
                      </Button>
                    )}
                  </div>
                </div>

                {resolvingTaskId === task.id && (
                  <div className="mt-3 p-3 bg-[#F0F6FD] border border-black/20 rounded-md space-y-2">
                    <label className="block text-sm font-bold text-black">Resolution Remarks (Required):</label>
                    <textarea
                      className="w-full p-2 text-sm text-black bg-white border border-black rounded-md outline-none"
                      rows={2}
                      placeholder="e.g. Replaced 1-inch valve and tested flow..."
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" onClick={() => setResolvingTaskId(null)}>
                        Cancel
                      </Button>
                      <Button variant="primary" onClick={() => handleResolveTask(task.id)}>
                        Confirm Resolved
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </StaffLayout>
  );
}
