import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { StaffLayout } from '../../components/templates/StaffLayout';
import { Card } from '../../components/atoms/Card';
import { Badge } from '../../components/atoms/Badge';
import { Button } from '../../components/atoms/Button';
import { EmptyState } from '../../components/molecules/EmptyState';
import { InterruptionCalendar } from '../../components/organisms/InterruptionCalendar';
import { StatusTimeline } from '../../components/organisms/StatusTimeline';
import { requestsApi, interruptionsApi } from '../../api';
import type { ServiceRequest, WaterInterruption, Urgency } from '../../types';
import { advisoriesStore, computeAdvisoryStatus } from '../../services/advisoriesStore';
import { maintenanceStore } from '../../services/maintenanceStore';
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
  const [tasks, setTasks] = useState<ServiceRequest[]>(() => maintenanceStore.getRequests());
  const [interruptions, setInterruptions] = useState<WaterInterruption[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Tab & Filters (Wireframe S2)
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortUrgency, setSortUrgency] = useState<'high_first' | 'newest'>('high_first');

  // Modals & Drawers
  const [selectedTask, setSelectedTask] = useState<ServiceRequest | null>(null);
  const [showMapModal, setShowMapModal] = useState<boolean>(false);
  const [showCalendarModal, setShowCalendarModal] = useState<boolean>(false);

  // S3 Resolution state
  const [remarks, setRemarks] = useState<string>('');
  const [remarksError, setRemarksError] = useState<string | null>(null);
  const [evidencePhotoAttached, setEvidencePhotoAttached] = useState<boolean>(false);
  const [evidencePhotoUrl, setEvidencePhotoUrl] = useState<string>('');
  const [evidencePhotoName, setEvidencePhotoName] = useState<string>('');
  const evidenceInputRef = useRef<HTMLInputElement | null>(null);
  const [isResolving, setIsResolving] = useState<boolean>(false);
  const [isStarting, setIsStarting] = useState<boolean>(false);

  const handleEvidenceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEvidencePhotoName(file.name);
    setEvidencePhotoAttached(true);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setEvidencePhotoUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const fetchTasksAndData = async () => {
    setIsLoading(true);
    try {
      const [reqRes, intRes] = await Promise.all([
        requestsApi.list({ per_page: 50 }).catch(() => ({ data: [] })),
        interruptionsApi.list().catch(() => ({ data: [] })),
      ]);
      if (reqRes && Array.isArray(reqRes.data)) {
        setTasks(reqRes.data);
        maintenanceStore.saveRequests(reqRes.data);
      } else {
        setTasks(maintenanceStore.getRequests());
      }
      if (intRes && Array.isArray(intRes.data)) {
        setInterruptions(intRes.data);
      } else {
        const localAdvs = advisoriesStore.getAdvisories().map((a) => ({
          id: a.id,
          message: `${a.title}: ${a.reason}`,
          starts_at: a.starts_at,
          ends_at: a.actual_restored_at || a.ends_at,
          status: computeAdvisoryStatus(a) as unknown as WaterInterruption['status'],
          is_published: !a.is_cancelled,
          barangays: a.barangay_names.map((name, idx) => ({
            id: a.barangay_ids[idx] || idx + 1,
            name,
          })),
        }));
        setInterruptions(localAdvs);
      }
    } catch {
      setTasks(maintenanceStore.getRequests());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasksAndData();
  }, []);

  // PDF Section 6.2 & 10.1: Staff selects Get Started (Assigned -> In progress)
  const handleStartTask = async (taskId: number) => {
    setIsStarting(true);
    try {
      const apiUpdated = await requestsApi.start(taskId).catch(() => null);
      const storeUpdated = maintenanceStore.startWork(taskId);
      const finalUpdated = apiUpdated || storeUpdated;
      if (finalUpdated) {
        setTasks((prev) => prev.map((t) => (t.id === taskId ? finalUpdated : t)));
        if (selectedTask?.id === taskId) {
          setSelectedTask(finalUpdated);
        }
      }
    } finally {
      setIsStarting(false);
    }
  };

  // PDF Section 6.3 & 6.4: Staff selects Resolve, enters remarks, uploads evidence photos (In progress -> Resolved)
  const handleResolveTask = async (taskId: number) => {
    if (!remarks.trim()) {
      setRemarksError('Resolution remarks are required to resolve this task.');
      return;
    }
    setRemarksError(null);
    setIsResolving(true);
    try {
      const photoPath =
        evidencePhotoUrl ||
        (evidencePhotoAttached ? '/storage/evidence/simulated_repair.jpg' : undefined);
      const apiUpdated = await requestsApi.resolve(taskId, remarks, photoPath).catch(() => null);
      const storeUpdated = maintenanceStore.resolveRequest(taskId, remarks, photoPath);
      const finalUpdated = apiUpdated || storeUpdated;
      if (finalUpdated) {
        setTasks((prev) => prev.map((t) => (t.id === taskId ? finalUpdated : t)));
      }
      setSelectedTask(null);
      setRemarks('');
      setEvidencePhotoAttached(false);
      setEvidencePhotoUrl('');
    } finally {
      setIsResolving(false);
    }
  };

  // PDF Section 6 & 8.7: Staff see only their own assigned tasks (Assigned and In progress in Active; Resolved and Cancelled in History)
  const filteredTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        if (activeTab === 'active') {
          const isActiveStatus = task.status === 'assigned' || task.status === 'in_progress';
          if (!isActiveStatus) return false;
          if (statusFilter !== 'all' && task.status !== statusFilter) return false;
          return true;
        } else {
          const isHistoryStatus = task.status === 'resolved' || task.status === 'cancelled';
          if (!isHistoryStatus) return false;
          if (statusFilter !== 'all' && task.status !== statusFilter) return false;
          return true;
        }
      })
      .sort((a, b) => {
        if (sortUrgency === 'high_first') {
          const weight = (u: Urgency) => (u === 'high' ? 3 : u === 'medium' ? 2 : 1);
          return weight(b.urgency) - weight(a.urgency);
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [tasks, activeTab, statusFilter, sortUrgency]);

  // Section 8 Step 7 & New Rule:
  // Staff see only the pins of their own assigned tasks. They do not see the Customers layer.
  // Customer locations are visible to the admin only.
  const staffMapMarkers = useMemo<MapMarker[]>(() => {
    return filteredTasks.map((task, idx) => {
      const lat = task.latitude ? Number(task.latitude) : 8.2835 + ((idx % 5) - 2) * 0.003;
      const lng = task.longitude ? Number(task.longitude) : 123.8340 + (((idx * 2) % 5) - 2) * 0.003;
      const refNo = task.reference_no || task.reference || `AT-${task.id}`;

      return {
        id: task.id,
        markerType: 'request',
        lat,
        lng,
        title: refNo,
        subtitle: `${task.issue_type?.name || task.description} · ${task.customer?.barangay || 'Poblacion'}`,
        label: refNo,
        urgency: task.urgency,
        status: task.status,
        imageUrl: task.photo_path
          ? task.photo_path.startsWith('http') || task.photo_path.startsWith('data:')
            ? task.photo_path
            : `/storage/${task.photo_path}`
          : undefined,
        onClick: () => {
          setSelectedTask(task);
        },
        onOpenDetails: () => {
          setShowMapModal(false);
          setSelectedTask(task);
        },
      };
    });
  }, [filteredTasks]);

  return (
    <StaffLayout currentPath="/staff/tasks" onNavigate={(path) => navigate(path)}>
      <div className="space-y-4 text-black">
        {/* Header */}
        <div className="pb-1">
          <h1 className="text-xl sm:text-2xl font-bold text-black">
            My Tasks
          </h1>
        </div>

        {/* Task Controls & Filters Card */}
        <Card className="p-3.5 bg-white space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            {/* Active vs History Switcher */}
            <div className="flex border border-black/15 rounded p-0.5 bg-black/5">
              <button
                onClick={() => {
                  setActiveTab('active');
                  setStatusFilter('all');
                }}
                className={`px-3 py-1 text-[14px] rounded transition-colors ${
                  activeTab === 'active'
                    ? 'bg-brand-blue text-white font-medium'
                    : 'text-black hover:text-brand-blue'
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
                    ? 'bg-brand-blue text-white font-medium'
                    : 'text-black hover:text-brand-blue'
                }`}
              >
                History
              </button>
            </div>

            {/* Top-Right Action Icons: Map, Calendar */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowMapModal(true)}
                className="p-1.5 bg-white hover:bg-black/5 text-black border border-black/15 rounded transition-colors"
                title="Assigned Area Map"
              >
                <IconMapPin size={16} />
              </button>

              <button
                onClick={() => setShowCalendarModal(true)}
                className="p-1.5 bg-white hover:bg-black/5 text-black border border-black/15 rounded transition-colors"
                title="Interruptions Calendar"
              >
                <IconCalendar size={16} />
              </button>
            </div>
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-black/10">
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
        </Card>

        {/* Task Cards List */}
        {isLoading ? (
          <Card className="p-8 text-center text-black/50 bg-white">
            Loading assigned field tasks...
          </Card>
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
                  className="p-3.5 border border-black/15 hover:border-brand-blue transition-colors cursor-pointer space-y-2.5"
                  onClick={() => setSelectedTask(task)}
                >
                  {/* Top row: Reference & Urgency pill */}
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-black text-[14px]">
                      {refNo}
                    </span>
                    <Badge variant={task.urgency === 'high' ? 'outline' : 'blue'}>
                      {task.urgency ? task.urgency.toUpperCase() : 'MEDIUM'}
                    </Badge>
                  </div>

                  {/* Subtitle: Issue type · Barangay */}
                  <div className="text-[14px] text-black">
                    <span className="font-medium">{issueName}</span>
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
                  className="p-1 hover:bg-black/5 rounded text-black flex items-center gap-1 text-[14px]"
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
              <div className="p-3 bg-white border border-black/15 rounded space-y-1.5 text-[14px]">
                <div className="flex items-center gap-1.5 text-xs font-medium text-black/60">
                  <IconUser size={12} className="text-brand-blue" />
                  <span>Customer Details</span>
                </div>
                <div className="space-y-0.5 text-black">
                  <div>
                    <span className="font-medium text-black">
                      {selectedTask.customer?.full_name || selectedTask.customer_profile?.first_name || 'Consumer Household'}
                    </span>
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
                  {selectedTask.assignment_notes && (
                    <div className="pt-1 border-t border-black/10 text-xs text-black/80">
                      <span className="font-medium text-black/60">Admin Notes: </span>
                      {selectedTask.assignment_notes}
                    </div>
                  )}
                </div>
              </div>

              {/* Card 2: Issue and urgency */}
              <div className="p-3 bg-white border border-black/15 rounded space-y-1.5 text-[14px]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-black/60">Issue and Urgency</span>
                  <Badge variant={selectedTask.urgency === 'high' ? 'outline' : 'blue'}>
                    {selectedTask.urgency ? selectedTask.urgency.toUpperCase() : 'MEDIUM'} URGENCY
                  </Badge>
                </div>
                <p className="text-black bg-white p-2 rounded border border-black/15">
                  {selectedTask.issue_type?.name && (
                    <span className="block text-brand-blue font-medium mb-1">
                      {selectedTask.issue_type.name}
                    </span>
                  )}
                  {selectedTask.description}
                </p>
              </div>

              {/* Card 3: Customer photo */}
              <div className="p-3 bg-white border border-black/15 rounded space-y-2 text-[14px]">
                <span className="text-xs font-medium text-black/60 block">Customer Photo</span>
                {selectedTask.photo_path ? (
                  <img
                    src={selectedTask.photo_path}
                    alt="Customer submitted"
                    className="w-full h-36 object-cover rounded border border-black/15"
                  />
                ) : (
                  <div className="h-28 border border-dashed border-black/30 rounded flex flex-col items-center justify-center text-black/50 bg-white space-y-1">
                    <IconPhoto size={24} className="text-black/40" />
                    <span>Report photo attached at customer submission</span>
                  </div>
                )}
              </div>

              {/* Status Timeline (PDF Section 7) */}
              <div className="p-3 bg-white border border-black/15 rounded space-y-2">
                <span className="text-xs font-medium text-black/60 block">Status Timeline</span>
                <StatusTimeline
                  status={selectedTask.status}
                  submittedAt={selectedTask.created_at}
                  assignedAt={selectedTask.assigned_at}
                  startedAt={selectedTask.started_at}
                  resolvedAt={selectedTask.resolved_at}
                  cancelledAt={selectedTask.cancelled_at}
                />
              </div>

              {/* Action Area: Mark as resolved / Get started */}
              {selectedTask.status === 'assigned' && (
                <div className="p-3 bg-white border border-black/15 rounded space-y-2">
                  <span className="text-xs font-medium text-black/60 block">Task Ready to Begin</span>
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
                  <h3 className="text-sm font-bold text-black block">
                    Mark as resolved
                  </h3>
                  <div>
                    <label className="block text-xs font-medium text-black/70 mb-1">
                      Resolution Remarks (Required)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="e.g. Replaced 1-inch pipe fitting and tested household line pressure..."
                      className={`w-full p-2 bg-white text-black border rounded text-[14px] outline-none ${
                        remarksError ? 'border-red-500 focus:border-red-600' : 'border-black focus:border-brand-blue'
                      }`}
                      value={remarks}
                      onChange={(e) => {
                        setRemarks(e.target.value);
                        if (remarksError) setRemarksError(null);
                      }}
                    />
                    {remarksError && (
                      <p className="text-xs text-red-600 font-semibold mt-1">
                        {remarksError}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <input
                      ref={evidenceInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleEvidenceFileChange}
                      className="hidden"
                    />
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => evidenceInputRef.current?.click()}
                        className={`px-3 py-1.5 border rounded text-[14px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                          evidencePhotoAttached
                            ? 'bg-brand-blue text-white border-brand-blue'
                            : 'bg-white text-black border-black/30 hover:bg-black/5'
                        }`}
                      >
                        <IconCamera size={14} />
                        <span>
                          {evidencePhotoAttached ? '✓ Photo Attached' : 'Add evidence photo'}
                        </span>
                      </button>
                      {evidencePhotoAttached && (
                        <span className="text-[11px] text-brand-blue font-medium truncate max-w-[180px]">
                          {evidencePhotoName || 'repair_proof_sinacaban.jpg'}
                        </span>
                      )}
                    </div>
                    {evidencePhotoUrl && (
                      <img
                        src={evidencePhotoUrl}
                        alt="Evidence preview"
                        className="w-full h-32 object-cover rounded border border-black/15"
                      />
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
                <div className="p-3 bg-white border border-black/15 rounded space-y-1">
                  <span className="text-xs font-medium text-black/60 block">Resolved Field Job</span>
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
        {/* Wireframe S5: Staff Map Modal (PDF Section 8.7: Assigned only + Directions) */}
        {/* ------------------------------------------------------------- */}
        {showMapModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg bg-white rounded border border-black p-5 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-black/15 pb-2">
                <button
                  onClick={() => setShowMapModal(false)}
                  className="p-1 hover:bg-black/5 rounded text-black flex items-center gap-1 text-[14px]"
                >
                  <IconArrowLeft size={14} />
                  <span>Map</span>
                </button>
                <Badge variant="blue">Assigned only</Badge>
              </div>

              {/* Map Area */}
              <div className="border border-black/15 rounded overflow-hidden space-y-2 bg-white">
                <div className="flex justify-between items-center p-2 bg-white border-b border-black/10">
                  <h3 className="text-sm font-bold text-black">
                    Sinacaban Field Work Orders
                  </h3>
                  <span className="text-[9px] text-black/70 bg-white px-2 py-0.5 border border-black/15 rounded font-medium">
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

                {/* S5 Bottom Card: AT-0000 | Barangay | Directions + Open task */}
                {(() => {
                  const activeCardTask = selectedTask || filteredTasks[0];
                  if (!activeCardTask) {
                    return (
                      <div className="p-2.5 bg-white border-t border-black/20 text-center text-black/60 text-[14px]">
                        No active tasks currently mapped in this sector.
                      </div>
                    );
                  }

                  const destLat = activeCardTask.latitude || 8.2855;
                  const destLng = activeCardTask.longitude || 123.8429;

                  return (
                    <div className="p-2.5 bg-white border-t border-black/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="text-black font-medium text-[14px]">
                          {activeCardTask.reference_no || activeCardTask.reference || `AT-${activeCardTask.id}`}
                        </span>
                        <span className="text-black/50 mx-1.5">·</span>
                        <span className="text-black/70 text-[14px]">
                          {activeCardTask.customer?.barangay || 'Poblacion'}
                        </span>
                        <div className="text-[9px] text-black/60 truncate max-w-xs">
                          {activeCardTask.description}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}`}
                          target="_blank"
                          rel="noreferrer"
                          className="py-1 px-2.5 text-[11px] font-medium border border-black/20 rounded text-black hover:bg-black/5"
                        >
                          Directions
                        </a>
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
                  className="p-1 hover:bg-black/5 rounded text-black flex items-center gap-1 text-[14px]"
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
                <h3 className="text-sm font-bold text-black block">
                  Active Disruption Schedules
                </h3>
                {interruptions.length === 0 ? (
                  <div className="p-3 text-center text-black/50 border border-black/10 rounded">
                    No scheduled interruptions recorded for Sinacaban.
                  </div>
                ) : (
                  interruptions.map((item) => (
                    <div
                      key={item.id}
                      className="p-2.5 bg-white border border-black/15 rounded flex items-center justify-between"
                    >
                      <div>
                        <span className="text-black font-medium block">
                          {item.barangays?.map((b) => b.name).join(', ') || 'Sinacaban General Sector'}
                        </span>
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
