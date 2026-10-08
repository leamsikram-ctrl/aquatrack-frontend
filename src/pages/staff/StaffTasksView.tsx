import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { StaffLayout } from '../../components/templates/StaffLayout';
import { Card } from '../../components/atoms/Card';
import { Badge } from '../../components/atoms/Badge';
import { Button } from '../../components/atoms/Button';
import { EmptyState } from '../../components/molecules/EmptyState';
import { InterruptionCalendar } from '../../components/organisms/InterruptionCalendar';
import { requestsApi, interruptionsApi } from '../../api';
import type { ServiceRequest, WaterInterruption, Urgency } from '../../types';
import { MunicipalMap, type MapMarker } from '../../components/organisms/MunicipalMap';
import {
  IconMapPin,
  IconCalendar,
  IconArrowLeft,
  IconCamera,
  IconCheck,
  IconUser,
  IconPhoto,
} from '@tabler/icons-react';

export function StaffTasksView() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<ServiceRequest[]>([]);
  const [interruptions, setInterruptions] = useState<WaterInterruption[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Tab & Filters (Wireframe S2)
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortUrgency, setSortUrgency] = useState<'high_first' | 'newest'>('high_first');

  // Modals & Drawers
  const [selectedTask, setSelectedTask] = useState<ServiceRequest | null>(null); // Wireframe S3 Task Details
  const [showMapModal, setShowMapModal] = useState<boolean>(false); // Wireframe S5 Staff Map
  const [showCalendarModal, setShowCalendarModal] = useState<boolean>(false); // Wireframe S6 Interruptions

  // S3 Resolution state
  const [remarks, setRemarks] = useState<string>('');
  const [evidencePhotoAttached, setEvidencePhotoAttached] = useState<boolean>(false);
  const [isResolving, setIsResolving] = useState<boolean>(false);
  const [isStarting, setIsStarting] = useState<boolean>(false);

  const fetchTasksAndData = async () => {
    setIsLoading(true);
    try {
      const [reqRes, intRes] = await Promise.all([
        requestsApi.list({ per_page: 50 }),
        interruptionsApi.list().catch(() => ({ data: [] })),
      ]);
      setTasks(reqRes.data);
      setInterruptions(intRes.data);
    } catch {
      // Offline fallback handling
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasksAndData();
  }, []);

  const handleStartTask = async (taskId: number) => {
    setIsStarting(true);
    try {
      const updated = await requestsApi.start(taskId);
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
      if (selectedTask?.id === taskId) {
        setSelectedTask(updated);
      }
    } catch {
      alert('Could not start task.');
    } finally {
      setIsStarting(false);
    }
  };

  const handleResolveTask = async (taskId: number) => {
    if (!remarks.trim()) {
      alert('Resolution remarks are required.');
      return;
    }
    setIsResolving(true);
    try {
      const updated = await requestsApi.resolve(
        taskId,
        remarks,
        evidencePhotoAttached ? '/storage/evidence/simulated_repair.jpg' : undefined
      );
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
      setSelectedTask(null);
      setRemarks('');
      setEvidencePhotoAttached(false);
    } catch {
      alert('Could not resolve task.');
    } finally {
      setIsResolving(false);
    }
  };

  // Filter & sort logic for Active vs History tabs
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (activeTab === 'active') {
        const isActiveStatus = task.status === 'assigned' || task.status === 'in_progress' || task.status === 'submitted';
        if (!isActiveStatus) return false;
        if (statusFilter !== 'all' && task.status !== statusFilter) return false;
        return true;
      } else {
        const isHistoryStatus = task.status === 'resolved' || task.status === 'cancelled';
        if (!isHistoryStatus) return false;
        if (statusFilter !== 'all' && task.status !== statusFilter) return false;
        return true;
      }
    }).sort((a, b) => {
      if (sortUrgency === 'high_first') {
        const weight = (u: Urgency) => (u === 'high' ? 3 : u === 'medium' ? 2 : 1);
        return weight(b.urgency) - weight(a.urgency);
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [tasks, activeTab, statusFilter, sortUrgency]);

  const staffMapMarkers = useMemo<MapMarker[]>(() => {
    return filteredTasks.map((task, idx) => {
      const lat = task.latitude ? Number(task.latitude) : 8.2835 + ((idx % 5) - 2) * 0.003;
      const lng = task.longitude ? Number(task.longitude) : 123.8340 + (((idx * 2) % 5) - 2) * 0.003;
      const refNo = task.reference_no || task.reference || `AT-${task.id}`;

      return {
        id: task.id,
        lat,
        lng,
        title: refNo,
        subtitle: `${task.description} · ${task.customer?.barangay || 'Poblacion'}`,
        label: refNo,
        urgency: task.urgency,
        status: task.status,
        onClick: () => {
          setSelectedTask(task);
        },
      };
    });
  }, [filteredTasks]);

  return (
    <StaffLayout currentPath="/staff/tasks" onNavigate={(path) => navigate(path)}>
      <div className="space-y-4 text-black">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/15 pb-3">
          <div>
            <h1 className="text-[14px] font-bold text-black uppercase tracking-wider">
              My tasks
            </h1>
          </div>

          {/* Top-Right Action Icons: Map, Calendar */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowMapModal(true)}
              className="p-1.5 bg-[#F0F6FD] hover:bg-[#1E6FD9] hover:text-white text-black border border-black/20 rounded transition-colors"
              title="Assigned Area Map"
            >
              <IconMapPin size={16} />
            </button>

            <button
              onClick={() => setShowCalendarModal(true)}
              className="p-1.5 bg-[#F0F6FD] hover:bg-[#1E6FD9] hover:text-white text-black border border-black/20 rounded transition-colors"
              title="Interruptions Calendar"
            >
              <IconCalendar size={16} />
            </button>
          </div>
        </div>

        {/* Wireframe S2 Tabs & Filter Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          {/* Active vs History Switcher */}
          <div className="flex border border-black/20 rounded p-0.5 bg-[#F0F6FD]">
            <button
              onClick={() => {
                setActiveTab('active');
                setStatusFilter('all');
              }}
              className={`px-3 py-1 text-[14px] rounded transition-colors ${
                activeTab === 'active'
                  ? 'bg-[#1E6FD9] text-white font-bold'
                  : 'text-black hover:text-[#1E6FD9]'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => {
                setActiveTab('history');
                setStatusFilter('all');
              }}
              className={`px-3 py-1 text-[14px] rounded transition-colors ${
                activeTab === 'history'
                  ? 'bg-[#1E6FD9] text-white font-bold'
                  : 'text-black hover:text-[#1E6FD9]'
              }`}
            >
              History
            </button>
          </div>

          {/* Filter Dropdowns */}
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2 py-1 bg-white border border-black/20 rounded text-[14px] outline-none font-sans"
            >
              <option value="all">Status ∨ (All)</option>
              {activeTab === 'active' ? (
                <>
                  <option value="assigned">Assigned</option>
                  <option value="in_progress">In progress</option>
                </>
              ) : (
                <>
                  <option value="resolved">Resolved</option>
                  <option value="cancelled">Cancelled</option>
                </>
              )}
            </select>

            <select
              value={sortUrgency}
              onChange={(e) => setSortUrgency(e.target.value as 'high_first' | 'newest')}
              className="px-2 py-1 bg-white border border-black/20 rounded text-[14px] outline-none font-sans"
            >
              <option value="high_first">Sort: Urgency ∨</option>
              <option value="newest">Sort: Newest First</option>
            </select>
          </div>
        </div>

        {/* Task Cards List (Wireframe S2) */}
        {isLoading ? (
          <div className="p-8 text-center text-black/50 border border-black/15 rounded bg-white">
            Loading assigned field tasks...
          </div>
        ) : filteredTasks.length === 0 ? (
          <EmptyState
            title={activeTab === 'active' ? 'No active tasks found' : 'No history records'}
            description={
              activeTab === 'active'
                ? 'All field tasks in your area have been handled.'
                : 'No completed or cancelled service requests in archive.'
            }
          />
        ) : (
          <div className="space-y-3">
            {filteredTasks.map((task) => {
              const refNo = task.reference_no || task.reference || `AT-${String(task.id).padStart(4, '0')}`;
              const issueName = task.issue_type?.name || task.description || 'Service Issue';
              const barangayName = task.customer?.barangay || task.barangay?.name || 'Poblacion';

              return (
                <Card
                  key={task.id}
                  className="p-3.5 border border-black/15 hover:border-[#1E6FD9] transition-colors cursor-pointer space-y-2.5"
                  onClick={() => setSelectedTask(task)}
                >
                  {/* Top row: Reference & Urgency pill */}
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-black text-[14px] uppercase tracking-wider">
                      {refNo}
                    </span>
                    <Badge variant={task.urgency === 'high' ? 'outline' : 'blue'}>
                      {task.urgency ? task.urgency.toUpperCase() : 'MEDIUM'}
                    </Badge>
                  </div>

                  {/* Subtitle: Issue type · Barangay */}
                  <div className="text-[14px] text-black">
                    <span className="font-bold">{issueName}</span>
                    <span className="text-black/50 mx-1.5">·</span>
                    <span className="text-black/70">{barangayName}</span>
                  </div>

                  {/* Bottom row: Status pill & Primary action */}
                  <div className="flex items-center justify-between pt-2 border-t border-black/10">
                    <Badge variant="outline">
                      {task.status === 'in_progress' ? 'In progress' : task.status}
                    </Badge>

                    <div className="flex items-center gap-2">
                      {task.status === 'assigned' && (
                        <Button
                          variant="primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartTask(task.id);
                          }}
                          disabled={isStarting}
                        >
                          Get started
                        </Button>
                      )}

                      {task.status === 'in_progress' && (
                        <Button
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTask(task);
                          }}
                        >
                          Resolve details
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* Wireframe S3: Task Details Modal / Overlay */}
        {/* ------------------------------------------------------------- */}
        {selectedTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg bg-white rounded border border-black p-5 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
              {/* Header: ← AT-0000 & Status */}
              <div className="flex items-center justify-between border-b border-black/15 pb-2">
                <button
                  onClick={() => setSelectedTask(null)}
                  className="p-1 hover:bg-[#F0F6FD] rounded text-black flex items-center gap-1 font-bold text-[14px]"
                >
                  <IconArrowLeft size={14} />
                  <span>
                    {selectedTask.reference_no || selectedTask.reference || `AT-${String(selectedTask.id).padStart(4, '0')}`}
                  </span>
                </button>
                <Badge variant={selectedTask.status === 'in_progress' ? 'blue' : 'outline'}>
                  {selectedTask.status.toUpperCase()}
                </Badge>
              </div>

              {/* Card 1: Customer */}
              <div className="p-3 bg-[#F0F6FD] border border-black/15 rounded space-y-1.5 text-[14px]">
                <div className="flex items-center gap-1.5 font-bold text-black uppercase">
                  <IconUser size={12} className="text-[#1E6FD9]" />
                  <span>Customer Details</span>
                </div>
                <div className="space-y-0.5 text-black">
                  <div>
                    <strong>{selectedTask.customer?.full_name || selectedTask.customer_profile?.first_name || 'Consumer Household'}</strong>
                    <span className="text-black/50 mx-1.5">·</span>
                    <span className="font-normal text-black/70">
                      {selectedTask.customer?.account_number || selectedTask.customer_profile?.account_number || 'ACC-SIN-0000'}
                    </span>
                  </div>
                  <div>
                    <span className="text-black/60">Location: </span>
                    <span>
                      {selectedTask.customer?.barangay || selectedTask.customer_profile?.address || 'Sinacaban'},{' '}
                      {selectedTask.customer?.address || 'Customer Residence'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: Issue and urgency */}
              <div className="p-3 bg-white border border-black/15 rounded space-y-1.5 text-[14px]">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-black uppercase">Issue and Urgency</span>
                  <Badge variant={selectedTask.urgency === 'high' ? 'outline' : 'blue'}>
                    {selectedTask.urgency ? selectedTask.urgency.toUpperCase() : 'MEDIUM'} URGENCY
                  </Badge>
                </div>
                <p className="text-black bg-[#F0F6FD] p-2 rounded border border-black/10">
                  {selectedTask.issue_type?.name && (
                    <strong className="block text-[#1E6FD9] mb-1">
                      {selectedTask.issue_type.name}
                    </strong>
                  )}
                  {selectedTask.description}
                </p>
              </div>

              {/* Card 3: Customer photo */}
              <div className="p-3 bg-white border border-black/15 rounded space-y-2 text-[14px]">
                <span className="font-bold text-black uppercase block">Customer Photo</span>
                <div className="h-28 border border-dashed border-black/30 rounded flex flex-col items-center justify-center text-black/50 bg-[#F0F6FD]/40 space-y-1">
                  <IconPhoto size={24} className="text-black/40" />
                  <span>Report photo attached at customer submission</span>
                </div>
              </div>

              {/* Action Area: Mark as resolved / Get started */}
              {selectedTask.status === 'assigned' && (
                <div className="p-3 bg-[#F0F6FD] border border-black/15 rounded space-y-2">
                  <span className="font-bold text-black uppercase block">Task Ready to Begin</span>
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={() => handleStartTask(selectedTask.id)}
                    isLoading={isStarting}
                  >
                    Get Started
                  </Button>
                </div>
              )}

              {selectedTask.status === 'in_progress' && (
                <div className="border-t border-black/15 pt-3 space-y-3">
                  <span className="font-bold text-black uppercase tracking-wider block">
                    Mark as resolved
                  </span>
                  <div>
                    <label className="block text-[14px] font-bold text-black uppercase mb-1">
                      Resolution Remarks (Required)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="e.g. Replaced 1-inch pipe fitting and tested household line pressure..."
                      className="w-full p-2 bg-white text-black border border-black rounded text-[14px] outline-none focus:border-[#1E6FD9]"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setEvidencePhotoAttached(!evidencePhotoAttached)}
                      className={`px-3 py-1.5 border rounded text-[14px] font-bold flex items-center gap-1.5 transition-colors ${
                        evidencePhotoAttached
                          ? 'bg-[#1E6FD9] text-white border-[#1E6FD9]'
                          : 'bg-white text-black border-black/30 hover:bg-[#F0F6FD]'
                      }`}
                    >
                      <IconCamera size={14} />
                      <span>
                        {evidencePhotoAttached ? '✓ Photo Attached' : 'Add evidence photo'}
                      </span>
                    </button>
                    {evidencePhotoAttached && (
                      <span className="text-[9px] text-[#1E6FD9] font-bold">
                        repair_proof_sinacaban.jpg
                      </span>
                    )}
                  </div>

                  <Button
                    variant="primary"
                    className="w-full py-2"
                    onClick={() => handleResolveTask(selectedTask.id)}
                    isLoading={isResolving}
                  >
                    <IconCheck size={14} className="inline mr-1" />
                    Mark Resolved
                  </Button>
                </div>
              )}

              {selectedTask.status === 'resolved' && (
                <div className="p-3 bg-[#F0F6FD] border border-black/15 rounded space-y-1">
                  <span className="font-bold text-black uppercase block">Resolved Field Job</span>
                  <p className="text-black bg-white p-2 rounded border border-black/10">
                    Remarks: {selectedTask.resolution_remarks || 'Work completed and validated.'}
                  </p>
                </div>
              )}

              <div className="flex justify-end pt-2 border-t border-black/10">
                <Button variant="secondary" onClick={() => setSelectedTask(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* Wireframe S5: Staff Map Modal */}
        {/* ------------------------------------------------------------- */}
        {showMapModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg bg-white rounded border border-black p-5 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-black/15 pb-2">
                <button
                  onClick={() => setShowMapModal(false)}
                  className="p-1 hover:bg-[#F0F6FD] rounded text-black flex items-center gap-1 font-bold text-[14px]"
                >
                  <IconArrowLeft size={14} />
                  <span>Map</span>
                </button>
                <Badge variant="blue">Assigned only</Badge>
              </div>

              {/* Map Area */}
              <div className="border border-black/20 rounded overflow-hidden space-y-2 bg-[#F0F6FD]">
                <div className="flex justify-between items-center p-2 bg-white border-b border-black/10">
                  <span className="font-bold text-black uppercase text-[14px]">
                    Sinacaban Field Work Orders
                  </span>
                  <span className="text-[9px] text-black/70 bg-[#F0F6FD] px-2 py-0.5 border border-black/15 rounded font-bold">
                    {filteredTasks.length} Assigned Pin(s)
                  </span>
                </div>

                <div className="h-64 sm:h-72 w-full relative">
                  <MunicipalMap
                    center={[8.2835, 123.8340]}
                    zoom={14}
                    markers={staffMapMarkers}
                    className="h-full w-full"
                  />
                </div>

                {/* S5 Bottom Card: AT-0000 | Barangay | Open task */}
                {(() => {
                  const activeCardTask = selectedTask || filteredTasks[0];
                  if (!activeCardTask) {
                    return (
                      <div className="p-2.5 bg-white border-t border-black/20 text-center text-black/60 text-[14px]">
                        No active tasks currently mapped in this sector.
                      </div>
                    );
                  }

                  return (
                    <div className="p-2.5 bg-white border-t border-black/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <strong className="text-black font-bold text-[14px]">
                          {activeCardTask.reference_no || activeCardTask.reference || `AT-${activeCardTask.id}`}
                        </strong>
                        <span className="text-black/50 mx-1.5">·</span>
                        <span className="text-black/70 text-[14px]">
                          {activeCardTask.customer?.barangay || 'Poblacion'}
                        </span>
                        <div className="text-[9px] text-black/60 truncate max-w-xs">
                          {activeCardTask.description}
                        </div>
                      </div>
                      <Button
                        variant="primary"
                        className="py-1 px-2.5 text-[9px] shrink-0"
                        onClick={() => {
                          setShowMapModal(false);
                          setSelectedTask(activeCardTask);
                        }}
                      >
                        Open task
                      </Button>
                    </div>
                  );
                })()}
              </div>

              <div className="flex justify-end pt-1">
                <Button variant="secondary" onClick={() => setShowMapModal(false)}>
                  Close Map
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* Wireframe S6: Staff Interruptions Modal */}
        {/* ------------------------------------------------------------- */}
        {showCalendarModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg bg-white rounded border border-black p-5 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-black/15 pb-2">
                <button
                  onClick={() => setShowCalendarModal(false)}
                  className="p-1 hover:bg-[#F0F6FD] rounded text-black flex items-center gap-1 font-bold text-[14px]"
                >
                  <IconArrowLeft size={14} />
                  <span>Interruptions</span>
                </button>
                <Badge variant="blue">Municipal Advisories</Badge>
              </div>

              {/* Month calendar with advisory markers */}
              <div className="border border-black/15 rounded p-3">
                <InterruptionCalendar
                  interruptions={interruptions}
                  onSelectDate={() => {}}
                />
              </div>

              {/* List with Today / Upcoming Badges */}
              <div className="space-y-2">
                <span className="font-bold text-black uppercase tracking-wider block">
                  Active Disruption Schedules
                </span>
                {interruptions.length === 0 ? (
                  <div className="p-3 text-center text-black/50 border border-black/10 rounded">
                    No scheduled interruptions recorded for Sinacaban.
                  </div>
                ) : (
                  interruptions.map((item) => (
                    <div
                      key={item.id}
                      className="p-2.5 bg-[#F0F6FD] border border-black/15 rounded flex items-center justify-between"
                    >
                      <div>
                        <strong className="text-black block">
                          {item.barangays?.map((b) => b.name).join(', ') || 'Sinacaban General Sector'}
                        </strong>
                        <span className="text-black/60 text-[9px]">
                          {item.starts_at} - {item.ends_at}
                        </span>
                      </div>
                      <Badge variant="outline">
                        {item.status === 'ongoing' ? 'Today' : 'Upcoming'}
                      </Badge>
                    </div>
                  ))
                )}
              </div>

              <div className="flex justify-end pt-1">
                <Button variant="secondary" onClick={() => setShowCalendarModal(false)}>
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
