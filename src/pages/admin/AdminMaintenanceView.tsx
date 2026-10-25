import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AdminLayout } from '../../components/templates/AdminLayout';
import { Card } from '../../components/atoms/Card';
import { EmptyState } from '../../components/molecules/EmptyState';
import { StatusTimeline } from '../../components/organisms/StatusTimeline';
import { MunicipalMap, SINACABAN_CENTER, isWithinSinacabanBounds, type MapMarker, type MapHotspot } from '../../components/organisms/MunicipalMap';
import { SystemModal } from '../../components/molecules/SystemModal';
import { requestsApi, referenceApi, adminApi } from '../../api';
import type { ServiceRequest, Barangay, User, Urgency } from '../../types';
import {
  FIXED_ISSUE_TYPES,
  DEFAULT_ACTIVE_STAFF,
  DEFAULT_GIS_CUSTOMERS,
  isCustomerActiveForGisMap,
  maintenanceStore,
  formatTimelineDateTime,
} from '../../services/maintenanceStore';
import { SINACABAN_BARANGAY_LIST } from '../../services/advisoriesStore';
import {
  IconSearch,
  IconTool,
  IconX,
  IconCheck,
  IconFlame,
  IconZoomReset,
  IconFilter,
  IconHome,
  IconMapPin,
  IconClock,
} from '@tabler/icons-react';

// Official PhilAtlas GIS coordinates for all Sinacaban barangays
const SINACABAN_BARANGAYS: Record<string, [number, number]> = {
  'poblacion': [8.2855, 123.8429],
  'cagay-anon': [8.3152, 123.8487],
  'cagayanon': [8.3152, 123.8487],
  'camanse': [8.3008, 123.8244],
  'sinonoc': [8.3034, 123.8474],
  'katipunan': [8.2834, 123.7285],
  'libertad': [8.2747, 123.8081],
  'libertad alto': [8.2747, 123.8081],
  'libertad bajo': [8.2801, 123.8433],
  'señor': [8.2812, 123.8034],
  'senor': [8.2812, 123.8034],
  'colupan': [8.2945, 123.8169],
  'colupan alto': [8.2945, 123.8169],
  'colupan bajo': [8.2989, 123.8463],
  'estrella': [8.2982, 123.7438],
  'san isidro': [8.2760, 123.7504],
  'san isidro alto': [8.2760, 123.7504],
  'san isidro bajo': [8.2818, 123.7744],
  'tipan': [8.2968, 123.7817],
  'dinas': [8.3018, 123.7740],
  'san vicente': [8.3134, 123.8307],
  'san lorenzo ruiz': [8.2856, 123.6998],
};

// Contiguous polygon boundaries for the 17 official Sinacaban barangays
const SINACABAN_BARANGAY_POLYGONS: Record<string, [number, number][]> = {
  'cagay-anon': [
    [8.3090, 123.8390],
    [8.3240, 123.8400],
    [8.3240, 123.8620],
    [8.3090, 123.8620],
  ],
  'sinonoc': [
    [8.2980, 123.8380],
    [8.3090, 123.8390],
    [8.3090, 123.8600],
    [8.2980, 123.8580],
  ],
  'colupan bajo': [
    [8.2920, 123.8360],
    [8.2980, 123.8380],
    [8.2980, 123.8560],
    [8.2920, 123.8540],
  ],
  'poblacion': [
    [8.2810, 123.8320],
    [8.2920, 123.8360],
    [8.2920, 123.8550],
    [8.2810, 123.8540],
  ],
  'libertad bajo': [
    [8.2710, 123.8300],
    [8.2810, 123.8320],
    [8.2810, 123.8540],
    [8.2710, 123.8520],
  ],
  'san vicente': [
    [8.3050, 123.8180],
    [8.3220, 123.8180],
    [8.3240, 123.8400],
    [8.3050, 123.8390],
  ],
  'camanse': [
    [8.2950, 123.8160],
    [8.3050, 123.8180],
    [8.3050, 123.8380],
    [8.2950, 123.8360],
  ],
  'colupan alto': [
    [8.2880, 123.8080],
    [8.2950, 123.8160],
    [8.2950, 123.8360],
    [8.2880, 123.8320],
  ],
  'señor': [
    [8.2750, 123.7940],
    [8.2880, 123.8080],
    [8.2880, 123.8320],
    [8.2750, 123.8300],
  ],
  'senor': [
    [8.2750, 123.7940],
    [8.2880, 123.8080],
    [8.2880, 123.8320],
    [8.2750, 123.8300],
  ],
  'libertad alto': [
    [8.2660, 123.7950],
    [8.2750, 123.7940],
    [8.2750, 123.8300],
    [8.2660, 123.8280],
  ],
  'dinas': [
    [8.2960, 123.7620],
    [8.3100, 123.7620],
    [8.3100, 123.7850],
    [8.2960, 123.7850],
  ],
  'tipan': [
    [8.2880, 123.7700],
    [8.2960, 123.7700],
    [8.2960, 123.7940],
    [8.2880, 123.7940],
  ],
  'san isidro bajo': [
    [8.2740, 123.7640],
    [8.2880, 123.7700],
    [8.2880, 123.7940],
    [8.2740, 123.7940],
  ],
  'san isidro alto': [
    [8.2670, 123.7400],
    [8.2780, 123.7400],
    [8.2780, 123.7680],
    [8.2670, 123.7680],
  ],
  'estrella': [
    [8.2900, 123.7320],
    [8.3080, 123.7320],
    [8.3080, 123.7620],
    [8.2900, 123.7620],
  ],
  'katipunan': [
    [8.2740, 123.7120],
    [8.2920, 123.7120],
    [8.2920, 123.7400],
    [8.2740, 123.7400],
  ],
  'san lorenzo ruiz': [
    [8.2760, 123.6800],
    [8.2960, 123.6800],
    [8.2960, 123.7120],
    [8.2760, 123.7120],
  ],
};

// Historical municipal maintenance operations baseline per sector
const HISTORICAL_MAINTENANCE_BASELINE: Record<string, number> = {
  'poblacion': 24,
  'cagay-anon': 18,
  'cagayanon': 18,
  'sinonoc': 14,
  'camanse': 11,
  'colupan bajo': 10,
  'libertad bajo': 10,
  'colupan alto': 8,
  'colupan': 8,
  'señor': 7,
  'senor': 7,
  'san vicente': 7,
  'dinas': 6,
  'libertad alto': 5,
  'libertad': 5,
  'tipan': 4,
  'san isidro bajo': 4,
  'estrella': 3,
  'san isidro alto': 3,
  'san isidro': 3,
  'katipunan': 2,
  'san lorenzo ruiz': 1,
};

function getMaintenanceIntensity(count: number): {
  color: string;
  level: string;
} {
  if (count >= 18) {
    return { color: 'var(--color-urgency-high)', level: 'High Hotspot' };
  }
  if (count >= 13) {
    return { color: 'var(--color-urgency-medium)', level: 'Moderate-High' };
  }
  if (count >= 9) {
    return { color: 'var(--color-urgency-medium)', level: 'Moderate' };
  }
  if (count >= 5) {
    return { color: 'var(--color-urgency-low)', level: 'Low-Moderate' };
  }
  return { color: 'var(--color-urgency-low)', level: 'Low Maintenance' };
}

function getBarangayCoordinates(barangayName?: string | null): [number, number] {
  if (!barangayName) return SINACABAN_CENTER;
  const key = barangayName.trim().toLowerCase();
  if (SINACABAN_BARANGAYS[key]) return SINACABAN_BARANGAYS[key];
  for (const [bName, coords] of Object.entries(SINACABAN_BARANGAYS)) {
    if (key.includes(bName) || bName.includes(key)) {
      return coords;
    }
  }
  return SINACABAN_CENTER;
}

function getRequestPhoto(req?: ServiceRequest | null): string {
  if (!req) return '';
  if (req.photo_path) {
    return req.photo_path.startsWith('http') || req.photo_path.startsWith('/') || req.photo_path.startsWith('data:')
      ? req.photo_path
      : `/storage/${req.photo_path}`;
  }
  const samplePhotos = [
    'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1542013936693-884638332954?w=600&auto=format&fit=crop&q=80',
  ];
  return samplePhotos[(req.id || 0) % samplePhotos.length];
}

function getCustomerPhoto(c?: User | null): string {
  const sampleCustomerPhotos = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80',
  ];
  return sampleCustomerPhotos[(c?.id || 0) % sampleCustomerPhotos.length];
}

function isRequestAssigned(req?: ServiceRequest | null): boolean {
  if (!req) return false;
  return Boolean(
    req.assigned_staff_id ||
    req.assigned_staff ||
    req.status === 'assigned' ||
    req.status === 'in_progress'
  );
}

export function AdminMaintenanceView() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Primary Data State (hydrated from maintenanceStore + API)
  const [requests, setRequests] = useState<ServiceRequest[]>(() => maintenanceStore.getRequests());
  const [staffList, setStaffList] = useState<User[]>(DEFAULT_ACTIVE_STAFF);
  const [customersList, setCustomersList] = useState<User[]>(DEFAULT_GIS_CUSTOMERS);
  const [barangays, setBarangays] = useState<Barangay[]>(SINACABAN_BARANGAY_LIST);
  const [isLoading, setIsLoading] = useState(false);

  // Section 8 Step 1: Switch between Request Pins and Customer Homes layers
  const [showRequestsLayer, setShowRequestsLayer] = useState<boolean>(true);
  const [showCustomersLayer, setShowCustomersLayer] = useState<boolean>(false);
  const [selectedCustomerSummary, setSelectedCustomerSummary] = useState<User | null>(null);
  const [customerRecordModal, setCustomerRecordModal] = useState<User | null>(null);

  // Filters & Search (PDF Section 5.1 & 8.4: Requests filtered by status, urgency, issue type, barangay, and date range; Customers filtered by barangay)
  const selectedStaff = searchParams.get('staff') || 'all';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBarangay, setSelectedBarangay] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('active'); // 'active' hides Resolved/Cancelled by default; 'all' shows them in grey
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');
  const [issueTypeFilter, setIssueTypeFilter] = useState<string>('all');
  const [startDateFilter, setStartDateFilter] = useState<string>('');
  const [endDateFilter, setEndDateFilter] = useState<string>('');
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [showHotspots, setShowHotspots] = useState(false);

  // Focus & Map Coordinates (Locked to Sinacaban center)
  const [focusedRequestId, setFocusedRequestId] = useState<number | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>(SINACABAN_CENTER);
  const [mapZoom, setMapZoom] = useState<number>(12);
  const [viewResetKey, setViewResetKey] = useState<number>(0);

  // Modal States
  const [drawerReq, setDrawerReq] = useState<ServiceRequest | null>(null);
  const [adjustedUrgency, setAdjustedUrgency] = useState<Urgency>('medium');
  const [urgencyReason, setUrgencyReason] = useState('');
  const [isSavingUrgency, setIsSavingUrgency] = useState(false);
  const [urgencySavedNotice, setUrgencySavedNotice] = useState(false);

  const [assigningReq, setAssigningReq] = useState<ServiceRequest | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null);
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [isSubmittingAssign, setIsSubmittingAssign] = useState(false);
  const [isUnassigningId, setIsUnassigningId] = useState<number | null>(null);

  // Modern System Modal for alerts and verifications
  const [systemModal, setSystemModal] = useState<{
    isOpen: boolean;
    type: 'info' | 'success' | 'warning' | 'error' | 'confirm';
    title: string;
    message: string | React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void | Promise<void>;
    isDestructive?: boolean;
    details?: { label: string; value: string }[];
  }>({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
  });

  // Rule 10.2: Only Active staff members can be assigned
  const activeStaffList = useMemo(
    () => staffList.filter((s) => !s.status || s.status === 'active'),
    [staffList]
  );

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [reqRes, staffRes, bgRes, custRes] = await Promise.all([
        requestsApi.list({ per_page: 100 }).catch(() => ({ data: [] })),
        adminApi.staffList().catch(() => []),
        referenceApi.getBarangays().catch(() => []),
        typeof adminApi.customersList === 'function'
          ? adminApi.customersList({ per_page: 200 }).catch(() => ({ data: [] }))
          : Promise.resolve({ data: [] }),
      ]);
      if (reqRes && Array.isArray(reqRes.data)) {
        setRequests(reqRes.data);
        maintenanceStore.saveRequests(reqRes.data);
      } else {
        setRequests(maintenanceStore.getRequests());
      }
      if (Array.isArray(staffRes) && staffRes.length > 0) {
        setStaffList(staffRes);
      } else {
        setStaffList(DEFAULT_ACTIVE_STAFF);
      }
      if (Array.isArray(bgRes) && bgRes.length > 0) {
        setBarangays(bgRes);
      } else {
        setBarangays(SINACABAN_BARANGAY_LIST);
      }
      if (custRes && Array.isArray(custRes.data) && custRes.data.length > 0) {
        setCustomersList(custRes.data);
      } else {
        setCustomersList(DEFAULT_GIS_CUSTOMERS);
      }
    } catch {
      setRequests(maintenanceStore.getRequests());
      setCustomersList(DEFAULT_GIS_CUSTOMERS);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered requests based on Status, Urgency, Issue Type, Barangay, Staff, Date Range, and Search
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      // Status filter (PDF 8.5: Resolved and Cancelled are hidden by default and can be shown in grey)
      if (statusFilter === 'active') {
        if (r.status === 'resolved' || r.status === 'cancelled') return false;
      } else if (statusFilter !== 'all') {
        if (r.status !== statusFilter) return false;
      }

      // Urgency filter
      if (urgencyFilter !== 'all' && r.urgency !== urgencyFilter) return false;

      // Issue Type filter
      if (issueTypeFilter !== 'all') {
        const matchId = String(r.issue_type_id) === issueTypeFilter || String(r.issue_type?.id) === issueTypeFilter;
        const matchName = (r.issue_type?.name || '').toLowerCase() === issueTypeFilter.toLowerCase();
        if (!matchId && !matchName) return false;
      }

      // Barangay filter
      const reqBrgy = r.customer?.barangay || r.barangay?.name || 'Poblacion';
      if (selectedBarangay !== 'all' && reqBrgy.toLowerCase() !== selectedBarangay.toLowerCase()) return false;

      // Staff filter
      if (selectedStaff !== 'all') {
        if (selectedStaff === 'unassigned') {
          if (r.assigned_staff_id) return false;
        } else if (String(r.assigned_staff_id) !== selectedStaff) {
          return false;
        }
      }

      // Date range filter
      if (startDateFilter) {
        const reqDate = (r.created_at || '').slice(0, 10);
        if (reqDate && reqDate < startDateFilter) return false;
      }
      if (endDateFilter) {
        const reqDate = (r.created_at || '').slice(0, 10);
        if (reqDate && reqDate > endDateFilter) return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const ref = (r.reference || r.reference_no || '').toLowerCase();
        const brgy = reqBrgy.toLowerCase();
        const name = (r.customer?.full_name || '').toLowerCase();
        const issue = (r.issue_type?.name || '').toLowerCase();
        if (!ref.includes(q) && !brgy.includes(q) && !name.includes(q) && !issue.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [
    requests,
    statusFilter,
    urgencyFilter,
    issueTypeFilter,
    selectedBarangay,
    selectedStaff,
    startDateFilter,
    endDateFilter,
    searchQuery,
  ]);

  // Top Section: Unassigned requests (Submitted)
  const unassignedRequests = useMemo(() => {
    return filteredRequests
      .filter((r) => r.status === 'submitted' && !isRequestAssigned(r))
      .sort((a, b) => {
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        if (!isNaN(timeA) && !isNaN(timeB) && timeB !== timeA) {
          return timeB - timeA;
        }
        return (b.id || 0) - (a.id || 0);
      });
  }, [filteredRequests]);

  // Bottom Section: Assigned / In Progress / Closed requests
  const assignedRequests = useMemo(() => {
    return filteredRequests
      .filter((r) => r.status !== 'submitted' || isRequestAssigned(r))
      .sort((a, b) => {
        const timeA = a.assigned_at
          ? new Date(a.assigned_at).getTime()
          : a.updated_at
          ? new Date(a.updated_at).getTime()
          : a.created_at
          ? new Date(a.created_at).getTime()
          : 0;
        const timeB = b.assigned_at
          ? new Date(b.assigned_at).getTime()
          : b.updated_at
          ? new Date(b.updated_at).getTime()
          : b.created_at
          ? new Date(b.created_at).getTime()
          : 0;

        if (!isNaN(timeA) && !isNaN(timeB) && timeB !== timeA) {
          return timeB - timeA;
        }
        return (b.id || 0) - (a.id || 0);
      });
  }, [filteredRequests]);

  // Selected / Featured request
  const selectedReq = useMemo(() => {
    if (focusedRequestId) {
      const found = filteredRequests.find((r) => r.id === focusedRequestId);
      if (found) return found;
    }
    return unassignedRequests[0] || assignedRequests[0] || filteredRequests[0] || null;
  }, [focusedRequestId, filteredRequests, unassignedRequests, assignedRequests]);

  const resolveRequestCoords = (req: ServiceRequest, idx: number = 0): [number, number] => {
    // 1. Exact GPS coordinates stored directly on the service request
    const reqLat = req.latitude !== undefined && req.latitude !== null ? Number(req.latitude) : null;
    const reqLng = req.longitude !== undefined && req.longitude !== null ? Number(req.longitude) : null;
    if (reqLat !== null && reqLng !== null && !isNaN(reqLat) && !isNaN(reqLng) && isWithinSinacabanBounds(reqLat, reqLng)) {
      return [reqLat, reqLng];
    }

    // 2. Profile coordinates attached to request
    const profLat = req.customer_profile?.latitude ? Number(req.customer_profile.latitude) : null;
    const profLng = req.customer_profile?.longitude ? Number(req.customer_profile.longitude) : null;
    if (profLat !== null && profLng !== null && !isNaN(profLat) && !isNaN(profLng) && isWithinSinacabanBounds(profLat, profLng)) {
      return [profLat, profLng];
    }

    // 3. Match from active customers directory
    if (req.customer_profile_id || req.customer?.id) {
      const targetId = req.customer_profile_id || req.customer?.id;
      const matchedCust = customersList.find((c) => c.id === targetId || c.customer_profile?.id === targetId);
      if (matchedCust?.customer_profile?.latitude && matchedCust?.customer_profile?.longitude) {
        const cLat = Number(matchedCust.customer_profile.latitude);
        const cLng = Number(matchedCust.customer_profile.longitude);
        if (!isNaN(cLat) && !isNaN(cLng) && isWithinSinacabanBounds(cLat, cLng)) {
          return [cLat, cLng];
        }
      }
    }

    // 4. Fallback to official PhilAtlas coordinates of the barangay with slight consistent dispersion
    const brgyName = req.customer?.barangay || req.barangay?.name;
    const brgyCoords = getBarangayCoordinates(brgyName);
    const seed = (req.id ? req.id : 0) + idx;
    const offsetFactor = ((seed * 17) % 7) - 3;
    const lat = brgyCoords[0] + offsetFactor * 0.0006;
    const lng = brgyCoords[1] + (((seed * 13) % 7) - 3) * 0.0006;
    return [lat, lng];
  };

  useEffect(() => {
    if (selectedBarangay === 'all') {
      setMapCenter(SINACABAN_CENTER);
      setMapZoom(12);
      setFocusedRequestId(null);
    } else {
      const targetCenter = getBarangayCoordinates(selectedBarangay);
      setMapCenter(targetCenter);
      setMapZoom(14.5);

      const bgRequests = requests.filter((r) => {
        const b = (r.customer?.barangay || r.barangay?.name || '').toLowerCase();
        const sel = selectedBarangay.toLowerCase();
        return b.includes(sel) || sel.includes(b);
      });

      if (bgRequests.length > 0) {
        setFocusedRequestId(bgRequests[0].id);
      } else {
        setFocusedRequestId(null);
      }
    }
  }, [selectedBarangay, requests]);

  // Step 4 & Step 5a (Customers layer):
  // Only Active customers appear (Pending, Declined, and Inactive do not appear).
  // The Customers layer can be filtered by barangay.
  const allActiveCustomers = useMemo(
    () => customersList.filter(isCustomerActiveForGisMap),
    [customersList]
  );

  const activeCustomersForMap = useMemo(() => {
    return allActiveCustomers.filter((c) => {
      const custBrgy = c.customer_profile?.barangay?.name || 'Poblacion';
      if (selectedBarangay !== 'all' && custBrgy.toLowerCase() !== selectedBarangay.toLowerCase()) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const fullName = (
          c.name ||
          `${c.customer_profile?.first_name || ''} ${c.customer_profile?.last_name || ''}`
        ).toLowerCase();
        const meterNo = (c.customer_profile?.meter?.meter_number || '').toLowerCase();
        const acctNo = (c.customer_profile?.account_number || '').toLowerCase();
        const addr = (c.customer_profile?.address || '').toLowerCase();
        const brgy = custBrgy.toLowerCase();
        if (
          !fullName.includes(q) &&
          !meterNo.includes(q) &&
          !acctNo.includes(q) &&
          !addr.includes(q) &&
          !brgy.includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [allActiveCustomers, selectedBarangay, searchQuery]);

  const selectedCustomer = useMemo(() => {
    if (selectedCustomerSummary) {
      const found = activeCustomersForMap.find((c) => c.id === selectedCustomerSummary.id);
      if (found) return found;
    }
    return activeCustomersForMap[0] || null;
  }, [selectedCustomerSummary, activeCustomersForMap]);

  // Map markers combining Requests layer (pins) and Customers layer (home icons)
  const mapMarkers = useMemo<MapMarker[]>(() => {
    const markers: MapMarker[] = [];

    if (showRequestsLayer) {
      filteredRequests.forEach((req, idx) => {
        const [lat, lng] = resolveRequestCoords(req, idx);
        const isHighlighted = !selectedCustomerSummary && selectedReq ? req.id === selectedReq.id : false;

        markers.push({
          id: req.id,
          markerType: 'request',
          lat,
          lng,
          title: req.reference_no || req.reference || `AT-${req.id}`,
          subtitle: `${req.issue_type?.name || 'Water Issue'} · ${req.customer?.barangay || 'Poblacion'}`,
          label: req.reference_no || req.reference || `AT-${req.id}`,
          urgency: req.urgency,
          status: req.status,
          imageUrl: getRequestPhoto(req),
          isHighlighted,
          onClick: () => {
            setSelectedCustomerSummary(null);
            handleFocusOnMap(req);
          },
          onOpenDetails: () => openDetails(req),
          onAssignStaff:
            req.status !== 'resolved' && req.status !== 'cancelled'
              ? () => handleOpenAssignModal(req)
              : undefined,
        });
      });
    }

    if (showCustomersLayer) {
      activeCustomersForMap.forEach((c) => {
        const custBrgy = c.customer_profile?.barangay?.name || 'Poblacion';
        const fallbackCoords = getBarangayCoordinates(custBrgy);
        const lat = c.customer_profile?.latitude ? Number(c.customer_profile.latitude) : fallbackCoords[0];
        const lng = c.customer_profile?.longitude ? Number(c.customer_profile.longitude) : fallbackCoords[1];
        const fullName =
          c.name ||
          `${c.customer_profile?.first_name || ''} ${c.customer_profile?.last_name || ''}`.trim() ||
          'Active Customer';
        const meterNo = c.customer_profile?.meter?.meter_number || 'MTR-UNASSIGNED';
        const address = c.customer_profile?.address || 'Sinacaban';
        const accountNo = c.customer_profile?.account_number || `ACC-${c.id}`;

        markers.push({
          id: `customer-${c.id}`,
          markerType: 'customer',
          lat,
          lng,
          title: fullName,
          subtitle: `${meterNo} · ${custBrgy}`,
          label: fullName,
          customerName: fullName,
          meterNumber: meterNo,
          address,
          barangay: custBrgy,
          accountNumber: accountNo,
          imageUrl: getCustomerPhoto(c),
          isHighlighted: selectedCustomer?.id === c.id,
          onClick: () => {
            setSelectedCustomerSummary(c);
          },
          onOpenRecord: () => {
            setCustomerRecordModal(c);
          },
        });
      });
    }

    return markers;
  }, [
    showRequestsLayer,
    showCustomersLayer,
    filteredRequests,
    activeCustomersForMap,
    selectedReq,
    selectedCustomer,
    selectedCustomerSummary,
  ]);

  const mapHotspots = useMemo<MapHotspot[]>(() => {
    if (!showHotspots) return [];

    const officialBarangays = [
      'Cagay-anon', 'Camanse', 'Colupan Alto', 'Colupan Bajo', 'Dinas',
      'Estrella', 'Katipunan', 'Libertad Alto', 'Libertad Bajo', 'Poblacion',
      'San Isidro Alto', 'San Isidro Bajo', 'San Lorenzo Ruiz', 'San Vicente',
      'Señor', 'Sinonoc', 'Tipan',
    ];

    return officialBarangays.map((name, idx) => {
      const key = name.toLowerCase();
      const centerCoords = getBarangayCoordinates(name);
      const polygon = SINACABAN_BARANGAY_POLYGONS[key];
      const baseline = HISTORICAL_MAINTENANCE_BASELINE[key] || 3;

      const areaRequests = requests.filter((r) => {
        const b = (r.customer?.barangay || r.barangay?.name || '').toLowerCase();
        return b.includes(key) || key.includes(b);
      });

      const liveCount = areaRequests.length;
      const resolvedCount = areaRequests.filter((r) => r.status === 'resolved').length;
      const activeCount = areaRequests.filter((r) => r.status !== 'resolved' && r.status !== 'cancelled').length;

      const totalMaintenanceDone = baseline + liveCount;
      const { color, level } = getMaintenanceIntensity(totalMaintenanceDone);

      return {
        id: `hotspot-${idx}-${key}`,
        lat: centerCoords[0],
        lng: centerCoords[1],
        polygon,
        label: `${name} Sector`,
        color,
        fillColor: color,
        fillOpacity: 0.28,
        maintenanceCount: totalMaintenanceDone,
        resolvedCount: resolvedCount + baseline,
        activeCount,
        intensityLevel: level,
        details: `${totalMaintenanceDone} cumulative maintenance requests logged for ${name} pipelines.`,
      };
    });
  }, [showHotspots, requests]);

  const handleFocusOnMap = (req: ServiceRequest) => {
    setFocusedRequestId(req.id);
    const [lat, lng] = resolveRequestCoords(req, 0);
    setMapCenter([lat, lng]);
    setMapZoom(15.5);
  };

  const handleFocusCustomerOnMap = (c: User) => {
    setSelectedCustomerSummary(c);
    const custBrgy = c.customer_profile?.barangay?.name || 'Poblacion';
    const fallbackCoords = getBarangayCoordinates(custBrgy);
    const lat = c.customer_profile?.latitude ? Number(c.customer_profile.latitude) : fallbackCoords[0];
    const lng = c.customer_profile?.longitude ? Number(c.customer_profile.longitude) : fallbackCoords[1];
    setMapCenter([lat, lng]);
    setMapZoom(15.5);
  };

  const handleResetView = () => {
    setSelectedBarangay('all');
    setStatusFilter('active');
    setUrgencyFilter('all');
    setIssueTypeFilter('all');
    setStartDateFilter('');
    setEndDateFilter('');
    setMapCenter(SINACABAN_CENTER);
    setMapZoom(12);
    setFocusedRequestId(null);
    setViewResetKey((k) => k + 1);
  };

  const handleOpenAssignModal = (req: ServiceRequest) => {
    if (req.status === 'resolved' || req.status === 'cancelled') return;
    setAssigningReq(req);
    setSelectedStaffId(
      req.assigned_staff_id || (activeStaffList.length > 0 ? activeStaffList[0].id : null)
    );
    setAssignmentNotes(req.assignment_notes || '');
  };

  const handleConfirmAssign = async () => {
    if (!assigningReq || !selectedStaffId) return;

    const staffUser = activeStaffList.find((s) => s.id === selectedStaffId);
    if (!staffUser) {
      setSystemModal({
        isOpen: true,
        type: 'warning',
        title: 'Invalid Staff Selection',
        message: 'Only an active field technician can be assigned to maintenance requests.',
        confirmText: 'Understood',
      });
      return;
    }

    setIsSubmittingAssign(true);
    try {
      await requestsApi.assign(assigningReq.id, selectedStaffId, assignmentNotes.trim() || undefined).catch(() => {});
      const { request: updated } = maintenanceStore.assignStaff(
        assigningReq.id,
        staffUser,
        assignmentNotes.trim() || undefined
      );
      if (updated) {
        setRequests(maintenanceStore.getRequests());
        if (drawerReq && drawerReq.id === assigningReq.id) {
          setDrawerReq(updated);
        }
      }
      setAssigningReq(null);
    } finally {
      setIsSubmittingAssign(false);
    }
  };

  const handleUnassign = async (requestId: number) => {
    setIsUnassigningId(requestId);
    try {
      await requestsApi.unassign(requestId).catch(() => {});
      try {
        const updated = maintenanceStore.unassignStaff(requestId);
        if (updated) {
          setRequests(maintenanceStore.getRequests());
          if (drawerReq && drawerReq.id === requestId) {
            setDrawerReq(updated);
          }
        }
      } catch {
        // Fallback for API-mocked requests
      }
    } finally {
      setIsUnassigningId(null);
    }
  };

  const handleAdminCancelRequest = (req: ServiceRequest) => {
    if (req.status === 'resolved') {
      setSystemModal({
        isOpen: true,
        type: 'info',
        title: 'Request Already Resolved',
        message: 'A resolved maintenance request has already been completed and cannot be reopened or cancelled.',
        confirmText: 'Understood',
      });
      return;
    }

    setSystemModal({
      isOpen: true,
      type: 'confirm',
      isDestructive: true,
      title: 'Cancel Maintenance Ticket',
      message: `Are you sure you want to cancel ticket ${req.reference || req.reference_no || `AT-${req.id}`} (${req.issue_type?.name || 'Water Service'})? The resident will be notified that work has been cancelled.`,
      confirmText: 'Cancel Ticket',
      cancelText: 'Keep Active',
      onConfirm: () => {
        const updated = maintenanceStore.cancelRequest(req.id, 'admin', 'Cancelled by administrator');
        if (updated) {
          setRequests(maintenanceStore.getRequests());
          if (drawerReq && drawerReq.id === req.id) {
            setDrawerReq(updated);
          }
        }
        setSystemModal((m) => ({ ...m, isOpen: false }));
      },
    });
  };

  const openDetails = (req: ServiceRequest) => {
    setDrawerReq(req);
    setAdjustedUrgency(req.urgency);
    setUrgencyReason(req.urgency_adjustment_reason || '');
    setUrgencySavedNotice(false);
  };

  const handleSaveUrgencyAdjustment = () => {
    if (!drawerReq || drawerReq.status === 'resolved' || drawerReq.status === 'cancelled') return;

    setIsSavingUrgency(true);
    setTimeout(() => {
      setIsSavingUrgency(false);
      setUrgencySavedNotice(true);
      const updated = maintenanceStore.adjustUrgency(drawerReq.id, adjustedUrgency, urgencyReason);
      if (updated) {
        setRequests(maintenanceStore.getRequests());
        setDrawerReq(updated);
      }
      setTimeout(() => setUrgencySavedNotice(false), 2500);
    }, 300);
  };

  const getStatusDot = (status: string) => {
    if (status === 'in_progress') return 'bg-brand-blue';
    if (status === 'assigned') return 'bg-amber-500';
    if (status === 'resolved') return 'bg-emerald-500';
    return 'bg-slate-400';
  };

  // PDF Section 8.3: Red for High, Orange for Medium, Yellow for Low; Grey for Resolved/Cancelled
  const getUrgencyTheme = (urgency: string, _isClosedOrAssigned?: boolean, status?: string) => {
    if (status === 'resolved' || status === 'cancelled') {
      return {
        bg: 'bg-slate-500',
        accentColor: 'var(--color-assigned)',
        badgeBg: 'bg-slate-100 text-slate-700 border-slate-300',
        label: status === 'resolved' ? 'Resolved' : 'Cancelled',
      };
    }
    const cleanUrgency = (urgency || '').toLowerCase();
    switch (cleanUrgency) {
      case 'critical':
      case 'high':
        return {
          bg: 'bg-urgency-high',
          accentColor: 'var(--color-urgency-high)',
          badgeBg: 'bg-red-50 text-rose-700 border-rose-200',
          label: 'High Urgency',
        };
      case 'medium':
        return {
          bg: 'bg-urgency-medium',
          accentColor: 'var(--color-urgency-medium)',
          badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
          label: 'Medium Urgency',
        };
      case 'low':
      default:
        return {
          bg: 'bg-brand-blue',
          accentColor: 'var(--color-brand-blue)',
          badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
          label: 'Low Urgency',
        };
    }
  };

  const renderRequestCard = (req: ServiceRequest, isAssigned: boolean) => {
    const isSelected = selectedReq ? req.id === selectedReq.id : false;
    const isClosed = req.status === 'resolved' || req.status === 'cancelled';
    const theme = getUrgencyTheme(req.urgency, isAssigned, req.status);

    return (
      <div
        key={req.id}
        onClick={() => handleFocusOnMap(req)}
        className={`rounded-xl overflow-hidden flex items-stretch text-white transition-all duration-200 cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.18)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.25)] hover:-translate-y-0.5 border border-white/20 ${
          theme.bg
        } ${
          isSelected
            ? 'ring-2 ring-white ring-offset-2 ring-offset-black/40 shadow-xl scale-[1.01]'
            : ''
        }`}
      >
        {/* Left: Icon Compartment */}
        <div className="w-11 sm:w-12 bg-black/20 flex items-center justify-center border-r border-white/20 shrink-0">
          <IconTool size={18} stroke={1.75} className="text-white" />
        </div>

        {/* Right: Content */}
        <div className="flex-1 px-3 py-2 flex items-center justify-between gap-2 min-w-0">
          <div className="min-w-0">
            <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
              <span>{req.reference || req.reference_no || `AT-${req.id}`}</span>
              {isSelected && (
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-white text-black shrink-0 shadow-xs">
                  Active
                </span>
              )}
            </div>
            <div className="text-[11px] text-white/85 truncate font-medium">
              {req.customer?.barangay || 'Poblacion'}
              {isAssigned && req.assigned_staff?.name && (
                <span className="text-white/70"> · {req.assigned_staff.name}</span>
              )}
            </div>
          </div>

          {/* Right: Actions */}
          <div
            className="flex items-center gap-1.5 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => openDetails(req)}
              className="px-2 py-1 text-xs font-bold rounded bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
            >
              View
            </button>
            {!isClosed && (
              !isAssigned ? (
                <button
                  type="button"
                  onClick={() => handleOpenAssignModal(req)}
                  className="px-2.5 py-1 text-xs font-bold rounded bg-black/30 hover:bg-black/50 text-white shadow-xs transition-colors cursor-pointer"
                >
                  Assign
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleUnassign(req.id)}
                  disabled={isUnassigningId === req.id}
                  className="px-2 py-1 text-xs font-bold rounded bg-black/25 hover:bg-black/40 text-white transition-colors cursor-pointer"
                >
                  {isUnassigningId === req.id ? '...' : 'Unassign'}
                </button>
              )
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderCustomerCard = (c: User) => {
    const isSelected = selectedCustomer ? c.id === selectedCustomer.id : false;
    const fullName =
      c.name ||
      `${c.customer_profile?.first_name || ''} ${c.customer_profile?.last_name || ''}`.trim() ||
      'Active Customer';
    const meterNo = c.customer_profile?.meter?.meter_number || 'MTR-UNASSIGNED';
    const custBrgy = c.customer_profile?.barangay?.name || 'Poblacion';

    return (
      <div
        key={c.id}
        onClick={() => handleFocusCustomerOnMap(c)}
        className={`rounded-xl overflow-hidden flex items-stretch text-white transition-all duration-200 cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.18)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.25)] hover:-translate-y-0.5 border border-white/20 bg-brand-blue ${
          isSelected
            ? 'ring-2 ring-white ring-offset-2 ring-offset-black/40 shadow-xl scale-[1.01]'
            : ''
        }`}
      >
        {/* Left: Customer Profile Photo Compartment */}
        <div className="w-11 sm:w-12 bg-black/20 flex items-center justify-center border-r border-white/20 shrink-0">
          <img
            src={getCustomerPhoto(c)}
            alt={fullName}
            className="w-7 h-7 rounded-full object-cover border border-white/40 shadow-xs"
          />
        </div>

        {/* Right: Content */}
        <div className="flex-1 px-3 py-2 flex items-center justify-between gap-2 min-w-0">
          <div className="min-w-0">
            <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
              <span>{fullName}</span>
              {isSelected && (
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-white text-black shrink-0 shadow-xs">
                  Active
                </span>
              )}
            </div>
            <div className="text-[11px] text-white/85 truncate font-medium">
              {meterNo} · {custBrgy}
            </div>
          </div>

          <div
            className="flex items-center gap-1.5 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setCustomerRecordModal(c)}
              className="px-2.5 py-1 text-xs font-bold rounded bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
            >
              View
            </button>
          </div>
        </div>
      </div>
    );
  };

  const isModalOpen = Boolean(assigningReq || drawerReq || customerRecordModal);

  return (
    <AdminLayout
      currentPath="/admin/maintenance"
      onNavigate={(path) => navigate(path)}
    >
      <div
        className={`space-y-6 text-[14px] font-normal text-black transition-all duration-300 ${
          isModalOpen ? 'filter blur-[4px] pointer-events-none select-none opacity-50' : ''
        }`}
      >
        {/* Header - Direct & Clean, Minimal Text */}
        <div className="border-b border-black/10 pb-3">
          <h1 className="text-xl sm:text-2xl font-bold text-black tracking-tight">
            Maintenance Requests
          </h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-5 h-auto lg:h-[calc(100vh-10rem)] min-h-[620px]">
        {/* LEFT COLUMN: Grouped into a Single Unified Card */}
        <div className="w-full lg:w-[410px] xl:w-[450px] bg-urgency-low rounded-md border border-black/10 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.14),0_6px_10px_-4px_rgba(0,0,0,0.08)] p-4 flex flex-col gap-3 shrink-0 h-full overflow-hidden text-white">
          {/* Top Inset Search & Barangay Filter Bar */}
          <div className="bg-black/15 rounded-xl border border-white/20 p-2.5 space-y-2 shrink-0 shadow-[inset_0_2px_4px_rgba(0,0,0,0.12)]">
            <div className="flex items-center gap-2">
              <IconSearch size={15} className="text-white shrink-0" />
              <input
                type="text"
                placeholder={
                  showCustomersLayer
                    ? 'Search customer, meter no., barangay...'
                    : 'Search reference, resident, barangay...'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs font-normal text-white bg-transparent outline-none placeholder:text-white/70"
              />
              {showRequestsLayer && (
                <button
                  type="button"
                  onClick={() => setShowFiltersPanel((p) => !p)}
                  title="Toggle filters (Status, Urgency, Issue Type, Date)"
                  className={`p-1 rounded-lg border transition-colors cursor-pointer shrink-0 ${
                    showFiltersPanel || statusFilter !== 'active' || urgencyFilter !== 'all' || issueTypeFilter !== 'all' || startDateFilter || endDateFilter
                      ? 'bg-white text-emerald-800 border-white'
                      : 'bg-white/15 text-white border-white/25 hover:bg-white/25'
                  }`}
                >
                  <IconFilter size={14} />
                </button>
              )}
            </div>

            {barangays.length > 0 && (
              <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-white/15">
                <select
                  value={selectedBarangay}
                  onChange={(e) => setSelectedBarangay(e.target.value)}
                  aria-label="Filter by barangay"
                  className="flex-1 min-w-0 text-xs font-semibold text-white bg-white/20 rounded-lg px-2 py-1 outline-none border border-white/25 cursor-pointer shadow-xs hover:bg-white/30 transition-colors"
                >
                  <option className="bg-emerald-800 text-white" value="all">All</option>
                  {barangays.map((b) => (
                    <option key={b.id} value={b.name} className="bg-emerald-800 text-white">
                      {b.name}
                    </option>
                  ))}
                </select>

                {/* Clean Tab Switcher for Pins (Requests) and Homes (Customers) matching other Admin pages */}
                <div className="flex items-center gap-1 bg-black/15 p-1 rounded-lg border border-white/20 shrink-0">
                  <button
                    type="button"
                    aria-pressed={showRequestsLayer}
                    onClick={() => {
                      setShowRequestsLayer(true);
                      setShowCustomersLayer(false);
                      setSelectedCustomerSummary(null);
                    }}
                    title="Show Request Pins on map"
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                      showRequestsLayer
                        ? 'bg-white text-emerald-800 shadow-sm'
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <span>Pins</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        showRequestsLayer ? 'bg-emerald-800/15 text-emerald-800' : 'bg-white/20 text-white'
                      }`}
                    >
                      {filteredRequests.length}
                    </span>
                  </button>
                  <button
                    type="button"
                    aria-pressed={showCustomersLayer}
                    onClick={() => {
                      setShowCustomersLayer(true);
                      setShowRequestsLayer(false);
                      setShowFiltersPanel(false);
                    }}
                    title="Show Customer Homes on map"
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                      showCustomersLayer
                        ? 'bg-white text-emerald-800 shadow-sm'
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <span>Homes</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        showCustomersLayer ? 'bg-emerald-800/15 text-emerald-800' : 'bg-white/20 text-white'
                      }`}
                    >
                      {activeCustomersForMap.length}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Expandable Multi-Filter Bar (PDF Section 5.1 & 8.4: Status, Urgency, Issue Type, Date Range) */}
          {showRequestsLayer && showFiltersPanel && (
            <div className="bg-black/20 rounded-xl border border-white/20 p-2.5 grid grid-cols-2 gap-2 shrink-0 text-xs">
              <div>
                <label className="block text-[10px] text-white/75 mb-0.5">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-white/15 text-white border border-white/25 rounded-lg px-2 py-1 text-xs outline-none"
                >
                  <option className="bg-emerald-800 text-white" value="active">Active Only</option>
                  <option className="bg-emerald-800 text-white" value="all">All (+ Grey History)</option>
                  <option className="bg-emerald-800 text-white" value="submitted">Submitted</option>
                  <option className="bg-emerald-800 text-white" value="assigned">Assigned</option>
                  <option className="bg-emerald-800 text-white" value="in_progress">In progress</option>
                  <option className="bg-emerald-800 text-white" value="resolved">Resolved</option>
                  <option className="bg-emerald-800 text-white" value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-white/75 mb-0.5">Urgency</label>
                <select
                  value={urgencyFilter}
                  onChange={(e) => setUrgencyFilter(e.target.value)}
                  className="w-full bg-white/15 text-white border border-white/25 rounded-lg px-2 py-1 text-xs outline-none"
                >
                  <option className="bg-emerald-800 text-white" value="all">All Urgencies</option>
                  <option className="bg-emerald-800 text-white" value="high">High</option>
                  <option className="bg-emerald-800 text-white" value="medium">Medium</option>
                  <option className="bg-emerald-800 text-white" value="low">Low</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] text-white/75 mb-0.5">Issue Type</label>
                <select
                  value={issueTypeFilter}
                  onChange={(e) => setIssueTypeFilter(e.target.value)}
                  className="w-full bg-white/15 text-white border border-white/25 rounded-lg px-2 py-1 text-xs outline-none"
                >
                  <option className="bg-emerald-800 text-white" value="all">All Issue Types</option>
                  {FIXED_ISSUE_TYPES.map((t) => (
                    <option key={t.id} value={String(t.id)} className="bg-emerald-800 text-white">
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-white/75 mb-0.5">From Date</label>
                <input
                  type="date"
                  value={startDateFilter}
                  onChange={(e) => setStartDateFilter(e.target.value)}
                  className="w-full bg-white/15 text-white border border-white/25 rounded-lg px-2 py-1 text-xs outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] text-white/75 mb-0.5">To Date</label>
                <input
                  type="date"
                  value={endDateFilter}
                  onChange={(e) => setEndDateFilter(e.target.value)}
                  className="w-full bg-white/15 text-white border border-white/25 rounded-lg px-2 py-1 text-xs outline-none"
                />
              </div>
            </div>
          )}

          {/* LEFT PANEL CONTENT: Switches between Customer Homes view and Request Pins view */}
          {showCustomersLayer ? (
            activeCustomersForMap.length === 0 ? (
              <div className="p-8 text-center bg-black/15 rounded-xl border border-white/20">
                <EmptyState
                  icon={<IconHome size={28} className="text-white" />}
                  title="No Active Customers"
                  description="No active customer homes match the selected barangay or search."
                />
              </div>
            ) : (
              <>
                {/* Selected Customer Summary Card (Step 5a: name, meter number, address, barangay + Open Customer Record button) */}
                {selectedCustomer && (() => {
                  const fullName =
                    selectedCustomer.name ||
                    `${selectedCustomer.customer_profile?.first_name || ''} ${
                      selectedCustomer.customer_profile?.last_name || ''
                    }`.trim() ||
                    'Active Customer';
                  const meterNo =
                    selectedCustomer.customer_profile?.meter?.meter_number || 'MTR-UNASSIGNED';
                  const custBrgy =
                    selectedCustomer.customer_profile?.barangay?.name || 'Poblacion';
                  const custAddr =
                    selectedCustomer.customer_profile?.address || 'Sinacaban';
                  const acctNo =
                    selectedCustomer.customer_profile?.account_number || `ACC-${selectedCustomer.id}`;

                  return (
                    <div className="rounded-xl p-3 space-y-2.5 shrink-0 text-white bg-brand-blue transition-all shadow-[0_8px_24px_rgba(0,0,0,0.22)] border border-white/25">
                      <div className="flex items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={getCustomerPhoto(selectedCustomer)}
                            alt={fullName}
                            className="w-10 h-10 rounded-full object-cover border-2 border-white/40 shadow-xs shrink-0"
                          />
                          <div className="min-w-0">
                            <span className="text-sm font-bold text-white tracking-wide truncate block">
                              {fullName}
                            </span>
                            <span className="text-[11px] font-medium text-white/85 truncate block">
                              {acctNo}
                            </span>
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-black/30 text-white border border-white/20 shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          Active
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs font-normal py-1.5 border-t border-b border-white/20">
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold text-white/75 block uppercase tracking-wider">
                            Meter No.
                          </span>
                          <span className="text-xs font-bold text-white truncate block">
                            {meterNo}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold text-white/75 block uppercase tracking-wider">
                            Barangay
                          </span>
                          <span className="text-xs font-bold text-white truncate block">
                            {custBrgy}
                          </span>
                        </div>
                        <div className="col-span-2 min-w-0 pt-0.5">
                          <span className="text-[10px] font-bold text-white/75 block uppercase tracking-wider">
                            Address
                          </span>
                          <span className="text-xs font-bold text-white truncate block">
                            {custAddr}
                          </span>
                        </div>
                      </div>

                      <div className="bg-black/20 border border-white/20 rounded-lg p-2.5 flex items-center justify-between gap-2 shadow-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-full bg-white/20 text-white flex items-center justify-center shrink-0">
                            <IconHome size={15} />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-white truncate">
                              Registered Home
                            </div>
                            <div className="text-[10px] font-medium text-white/80">
                              {selectedCustomer.mobile_number}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setCustomerRecordModal(selectedCustomer)}
                          className="px-2.5 py-1 text-xs font-bold rounded bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer border border-white/20 shrink-0"
                        >
                          Open Record
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* Active Customers List */}
                <div className="flex flex-col flex-1 overflow-hidden min-h-0 space-y-2 pt-1 border-t border-white/20">
                  <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                    <div className="text-xs font-bold text-white px-1 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-white shadow-xs" />
                        Active Customers ({activeCustomersForMap.length})
                      </span>
                    </div>

                    {activeCustomersForMap.map((c) => renderCustomerCard(c))}
                  </div>
                </div>
              </>
            )
          ) : isLoading ? (
            <div className="py-12 text-center text-white/80 text-xs font-medium">
              Loading requests...
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="p-8 text-center bg-black/15 rounded-xl border border-white/20">
              <EmptyState
                icon={<IconCheck size={28} className="text-white" />}
                title="No Matching Requests"
                description="All maintenance tickets are resolved or no open requests match."
              />
            </div>
          ) : (
            <>
              {/* Pin Summary Card (PDF Section 8.5: request ID, issue type, urgency, status, and date, with buttons to open full details and assign staff) */}
              {selectedReq && (() => {
                const isSelectedAssigned = isRequestAssigned(selectedReq);
                const isClosed = selectedReq.status === 'resolved' || selectedReq.status === 'cancelled';
                const theme = getUrgencyTheme(selectedReq.urgency, false, selectedReq.status);
                const [pinLat, pinLng] = resolveRequestCoords(selectedReq);

                return (
                  <div
                    className={`rounded-xl p-3 space-y-2.5 shrink-0 text-white transition-all shadow-[0_8px_24px_rgba(0,0,0,0.22)] border border-white/25 ${theme.bg}`}
                  >
                    {/* Customer Submitted Photo & Status Overlays */}
                    <div className="relative w-full h-32 rounded-lg overflow-hidden border border-white/25 bg-black/15 shadow-sm">
                      <img
                        src={getRequestPhoto(selectedReq)}
                        alt="Customer submitted issue"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2 flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white text-black shadow-md border border-black/10 uppercase tracking-wide">
                          <IconFlame size={12} className={selectedReq.urgency === 'high' ? 'text-red-600' : 'text-amber-600'} />
                          {selectedReq.urgency} Urgency
                        </span>
                      </div>
                      <div className="absolute top-2 right-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-black/50 backdrop-blur-md text-white border border-white/20 shadow-xs capitalize">
                          <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(selectedReq.status)}`} />
                          {selectedReq.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-1 text-[10px] font-semibold text-white bg-black/60 backdrop-blur-md px-2 py-0.5 rounded border border-white/15">
                        <span className="flex items-center gap-1 font-mono">
                          <IconMapPin size={12} className="text-white/80 shrink-0" />
                          GPS: {pinLat.toFixed(4)}°, {pinLng.toFixed(4)}°
                        </span>
                        <span className="flex items-center gap-1 text-white/90">
                          <IconClock size={12} className="text-white/80 shrink-0" />
                          {formatTimelineDateTime(selectedReq.created_at)}
                        </span>
                      </div>
                    </div>

                    {/* Ref, Date & Location */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <IconTool size={16} stroke={2} className="text-white shrink-0" />
                        <span className="text-sm font-bold text-white tracking-wide truncate">
                          {selectedReq.reference || selectedReq.reference_no || `AT-${selectedReq.id}`}
                        </span>
                      </div>
                      <span className="text-[11px] font-medium text-white/90 shrink-0">
                        {selectedReq.customer?.barangay || 'Poblacion'} · {formatTimelineDateTime(selectedReq.created_at)}
                      </span>
                    </div>

                    {/* Specs: Resident & Issue Type */}
                    <div className="grid grid-cols-2 gap-2 text-xs font-normal py-1 border-t border-b border-white/20">
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-white/75 block uppercase tracking-wider">Resident</span>
                        <span className="text-xs font-bold text-white truncate block">
                          {selectedReq.customer?.full_name || 'Resident'}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-white/75 block uppercase tracking-wider">Category</span>
                        <span className="text-xs font-bold text-white truncate block">
                          {selectedReq.issue_type?.name || 'Water Service'}
                        </span>
                      </div>
                    </div>

                    {/* Technician & Action Buttons */}
                    <div className="bg-black/20 border border-white/20 rounded-lg p-2.5 flex items-center justify-between gap-2 shadow-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-white/20 text-white flex items-center justify-center text-xs font-bold shrink-0">
                          {selectedReq.assigned_staff?.name?.charAt(0) || 'U'}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white truncate">
                            {selectedReq.assigned_staff?.name || 'Unassigned'}
                          </div>
                          <div className="text-[10px] font-medium text-white/80">
                            {selectedReq.assigned_staff ? 'Field Technician' : 'Awaiting Staff'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => openDetails(selectedReq)}
                          className="px-2.5 py-1 text-xs font-bold rounded bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer border border-white/20"
                        >
                          View
                        </button>
                        {!isClosed && (
                          !isSelectedAssigned ? (
                            <button
                              type="button"
                              onClick={() => handleOpenAssignModal(selectedReq)}
                              className="px-2.5 py-1 text-xs font-bold rounded bg-black/35 hover:bg-black/50 text-white shadow-xs transition-colors cursor-pointer border border-white/20"
                            >
                              Assign
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleUnassign(selectedReq.id)}
                              disabled={isUnassigningId === selectedReq.id}
                              className="px-2.5 py-1 text-xs font-bold rounded bg-black/30 hover:bg-black/45 text-white transition-colors cursor-pointer border border-white/20"
                            >
                              {isUnassigningId === selectedReq.id ? '...' : 'Unassign'}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Requests Queue: Separated into Unassigned (top) and Assigned (bottom) */}
              <div className="flex flex-col flex-1 overflow-hidden min-h-0 space-y-2 pt-1 border-t border-white/20">
                <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
                  {/* TOP SECTION: Unassigned Requests */}
                  <div className="space-y-1.5">
                    <div className="text-xs font-bold text-white px-1 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-white shadow-xs" />
                        Unassigned Requests ({unassignedRequests.length})
                      </span>
                      <span className="text-[10px] text-white/75 font-normal">Newest first</span>
                    </div>

                    {unassignedRequests.length === 0 ? (
                      <div className="py-3 text-center text-white/80 text-xs font-medium bg-black/15 rounded-lg border border-white/15">
                        All active requests have been assigned
                      </div>
                    ) : (
                      unassignedRequests.map((req) => renderRequestCard(req, false))
                    )}
                  </div>

                  {/* BOTTOM SECTION: Assigned Requests */}
                  <div className="space-y-1.5 pt-2.5 border-t border-white/20">
                    <div className="text-xs font-bold text-white/95 px-1 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-white/70 shadow-xs" />
                        Assigned Requests ({assignedRequests.length})
                      </span>
                      <span className="text-[10px] text-white/75 font-normal">Latest assigned first</span>
                    </div>

                    {assignedRequests.length === 0 ? (
                      <div className="py-3 text-center text-white/80 text-xs font-medium bg-black/15 rounded-lg border border-white/15">
                        No assigned requests currently in progress
                      </div>
                    ) : (
                      assignedRequests.map((req) => renderRequestCard(req, true))
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* RIGHT COLUMN: Tracking Map Canvas */}
        <div className="flex-1 h-full min-h-[580px] rounded-md overflow-hidden border border-black/10 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.14),0_6px_10px_-4px_rgba(0,0,0,0.08)] relative bg-slate-100">
          <MunicipalMap
            center={mapCenter}
            zoom={mapZoom}
            markers={mapMarkers}
            hotspots={mapHotspots}
            selectedMarkerId={
              showCustomersLayer && selectedCustomer
                ? `customer-${selectedCustomer.id}`
                : selectedReq?.id
            }
            lockToSinacaban={true}
            viewResetKey={viewResetKey}
            className="w-full h-full"
          />

          {/* Top-Left Urgency Legend */}
          <div className="absolute top-4 left-16 z-[400] hidden sm:flex items-center gap-2.5 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-black/10 shadow-[0_8px_20px_rgba(0,0,0,0.15)] text-[11px] text-black/70">
            <span className="text-black/50">Urgency:</span>
            <span className="inline-flex items-center gap-1 text-black">
              <span className="w-2 h-2 rounded-full bg-urgency-high" /> High
            </span>
            <span className="inline-flex items-center gap-1 text-black">
              <span className="w-2 h-2 rounded-full bg-urgency-medium" /> Medium
            </span>
            <span className="inline-flex items-center gap-1 text-black">
              <span className="w-2 h-2 rounded-full bg-urgency-low" /> Low
            </span>
            {statusFilter !== 'active' && (
              <span className="inline-flex items-center gap-1 text-black">
                <span className="w-2 h-2 rounded-full bg-assigned" /> Closed
              </span>
            )}
          </div>

          {/* Top-Right Map View Controls */}
          <div className="absolute top-4 right-4 z-[400] flex items-center gap-1.5 bg-white/95 backdrop-blur-md p-1.5 rounded-xl border border-black/10 shadow-[0_8px_20px_rgba(0,0,0,0.15)]">
            <button
              type="button"
              onClick={() => setStatusFilter((prev) => (prev === 'active' ? 'all' : 'active'))}
              className={`px-2.5 py-1 rounded-lg text-xs font-normal border transition-colors cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-slate-600 text-white border-slate-600'
                  : 'bg-white text-black/70 border-black/10 hover:border-black/20'
              }`}
            >
              {statusFilter === 'all' ? 'Hide Closed' : 'Show Closed'}
            </button>
            <button
              type="button"
              onClick={() => setShowHotspots((prev) => !prev)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-normal border transition-colors cursor-pointer ${
                showHotspots
                  ? 'bg-orange-600 text-white border-orange-600'
                  : 'bg-white text-black/70 border-black/10 hover:border-black/20'
              }`}
            >
              <IconFlame size={13} />
              <span>Risk Hotspots</span>
            </button>
            <button
              type="button"
              onClick={handleResetView}
              title="Reset map view to whole Sinacaban"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-normal bg-white text-black/70 border border-black/10 hover:border-black/20 hover:text-brand-blue transition-colors cursor-pointer"
            >
              <IconZoomReset size={14} className="shrink-0" />
              <span>Reset View</span>
            </button>
          </div>

          {/* Floating Hotspot Maintenance Intensity Legend */}
          {showHotspots && (
            <div className="absolute bottom-4 left-4 z-[400] bg-white/95 backdrop-blur-md rounded-2xl border border-black/10 shadow-[0_16px_36px_rgba(0,0,0,0.22)] p-3 space-y-2 max-w-[290px] text-black animate-hero-entrance">
              <div className="flex items-center justify-between gap-2 border-b border-black/10 pb-1.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <IconFlame size={15} className="text-orange-600 shrink-0" />
                  <span className="text-xs font-medium text-black truncate">
                    Maintenance Hotspots
                  </span>
                </div>
                <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-black/5 text-black/60 shrink-0">
                  17 Sectors
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-normal text-black/60">
                  <span>Low Maintenance</span>
                  <span>High Volume</span>
                </div>
                <div
                  className="h-2.5 w-full rounded-full shadow-inner"
                  style={{
                    background:
                      'linear-gradient(to right, var(--color-urgency-low) 0%, var(--color-urgency-medium) 50%, var(--color-urgency-high) 100%)',
                  }}
                />
                <div className="flex items-center justify-between text-[9px] font-normal text-black/45 pt-0.5">
                  <span>&lt; 5 requests</span>
                  <span>5 - 12</span>
                  <span>&gt; 18 requests</span>
                </div>
              </div>

              <div className="text-[10px] font-normal text-black/55 pt-1 border-t border-black/5 flex items-center justify-between">
                <span>Intensity: Cumulative requests</span>
                <span className="font-medium text-black/80">Poblacion (Top)</span>
              </div>
            </div>
          )}
        </div>
        </div>
      </div>

      {/* Modal: Assign / Reassign Active Staff Technician */}
      {assigningReq &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 bg-black/65 backdrop-blur-md z-[99999] flex items-center justify-center p-4 animate-hero-entrance"
            onClick={(e) => {
              if (e.target === e.currentTarget) setAssigningReq(null);
            }}
          >
            <Card
              className="w-full max-w-md bg-white p-5 rounded-md shadow-2xl border border-black/15 space-y-4 relative z-[100000]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-black/10 pb-3">
                <h3 className="text-sm font-medium text-black">
                  {isRequestAssigned(assigningReq) ? 'Reassign Staff Technician' : 'Assign Staff Technician'}
                </h3>
                <button
                  type="button"
                  onClick={() => setAssigningReq(null)}
                  className="p-1 text-black/50 hover:text-black cursor-pointer"
                >
                  <IconX size={16} />
                </button>
              </div>

              <div className="text-xs font-normal text-black/70 space-y-1">
                <div>
                  Ticket: {assigningReq.reference || `AT-${assigningReq.id}`}
                </div>
                <div>
                  Issue: {assigningReq.issue_type?.name || 'Water Service'}
                </div>
                <div>
                  Location: {assigningReq.customer?.barangay || 'Poblacion'}
                </div>
              </div>

              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-normal text-black/70 mb-1">
                    Select Active Staff Member
                  </label>
                  <select
                    value={selectedStaffId || ''}
                    onChange={(e) => setSelectedStaffId(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-normal bg-white text-black border border-black/20 rounded-xl outline-none focus:border-brand-blue"
                  >
                    {activeStaffList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.staff_profile?.assigned_barangay?.name || 'General Utility'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-normal text-black/70 mb-1">
                    Assignment Notes
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Provide specific pipe junction instructions or notes..."
                    value={assignmentNotes}
                    onChange={(e) => setAssignmentNotes(e.target.value)}
                    className="w-full p-2.5 text-xs font-normal bg-white text-black border border-black/20 rounded-xl outline-none focus:border-brand-blue"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-black/10 pt-3">
                <button
                  type="button"
                  onClick={() => setAssigningReq(null)}
                  disabled={isSubmittingAssign}
                  className="px-3 py-1.5 text-xs font-normal rounded-xl bg-black/5 text-black hover:bg-black/10 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAssign}
                  disabled={isSubmittingAssign || activeStaffList.length === 0}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  {isSubmittingAssign ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </Card>
          </div>,
          document.body
        )}

      {/* Center Modal: Full Request Details */}
      {drawerReq &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 bg-black/65 backdrop-blur-md z-[99999] flex items-center justify-center p-4 animate-hero-entrance"
            onClick={(e) => {
              if (e.target === e.currentTarget) setDrawerReq(null);
            }}
          >
            <div
              className="w-full max-w-lg max-h-[90vh] bg-white rounded-md shadow-2xl border border-black/15 overflow-hidden flex flex-col font-normal relative z-[100000]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div
                className="flex items-center justify-between border-b border-black/10 p-4 shrink-0 text-white"
                style={{ backgroundColor: getUrgencyTheme(drawerReq.urgency, false, drawerReq.status).accentColor }}
              >
                <div>
                  <h3 className="text-base font-bold text-white">
                    {drawerReq.reference || `AT-${drawerReq.id}`}
                  </h3>
                  <div className="text-xs font-medium text-white/80">
                    Maintenance Request Details
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDrawerReq(null)}
                  className="p-1.5 rounded-full hover:bg-black/15 text-white/80 hover:text-white cursor-pointer"
                >
                  <IconX size={18} />
                </button>
              </div>

              {/* Modal Body (Scrollable) */}
              <div className="p-5 overflow-y-auto space-y-4">
                {/* Customer Submitted Photo */}
                <div className="space-y-1.5">
                  <div className="text-black/50 uppercase tracking-wider text-[11px]">
                    Customer Submitted Photo
                  </div>
                  <div className="w-full h-52 rounded-xl overflow-hidden border border-black/10 bg-black/5 relative">
                    <img
                      src={getRequestPhoto(drawerReq)}
                      alt="Customer submitted issue"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Status & Assignment Overview */}
                <div className="p-3 bg-black/5 rounded-xl border border-black/10 space-y-2 text-xs font-normal">
                  <div className="flex items-center justify-between">
                    <span className="text-black/60">Status:</span>
                    <span className="capitalize text-black font-medium">{drawerReq.status.replace('_', ' ')}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-black/60">Issue Type:</span>
                    <span className="text-black">{drawerReq.issue_type?.name || 'Water Service'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-black/60">Assigned Technician:</span>
                    <span className="text-black">{drawerReq.assigned_staff?.name || 'Unassigned'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-black/60">Location:</span>
                    <span className="text-black">{drawerReq.customer?.barangay || 'Poblacion'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-black/60">Resident:</span>
                    <span className="text-black">{drawerReq.customer?.full_name || 'Resident'}</span>
                  </div>
                  {drawerReq.assignment_notes && (
                    <div className="pt-1 border-t border-black/10">
                      <span className="text-black/60 block mb-0.5">Assignment Notes:</span>
                      <span className="text-black">{drawerReq.assignment_notes}</span>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-1.5 text-xs font-normal">
                  <div className="text-black/50 uppercase tracking-wider text-[11px]">
                    Description
                  </div>
                  <p className="p-3 bg-white border border-black/10 rounded-xl text-black/80 leading-relaxed">
                    {drawerReq.description}
                  </p>
                </div>

                {/* Resolution Remarks & Evidence Photo (PDF Section 2 & 6) */}
                {drawerReq.status === 'resolved' && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2.5 text-xs">
                    <div className="font-semibold text-emerald-800">Resolution Details</div>
                    {drawerReq.resolution_remarks && (
                      <p className="text-emerald-900">{drawerReq.resolution_remarks}</p>
                    )}
                    {drawerReq.evidence_photo_path && (
                      <img
                        src={drawerReq.evidence_photo_path}
                        alt="Repair evidence"
                        className="w-full h-36 object-cover rounded-lg border border-emerald-200"
                      />
                    )}
                  </div>
                )}

                {/* Urgency Adjuster (PDF Section 4: Admin may adjust urgency after reviewing) */}
                {drawerReq.status !== 'resolved' && drawerReq.status !== 'cancelled' && (
                  <div className="p-3.5 bg-white border border-black/15 rounded-xl space-y-3 font-normal">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-black">Urgency Level</span>
                      {urgencySavedNotice && (
                        <span className="text-xs text-urgency-low">Updated</span>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {(['low', 'medium', 'high'] as Urgency[]).map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setAdjustedUrgency(lvl)}
                          className={`py-1.5 rounded-lg text-xs font-normal capitalize border transition-all cursor-pointer ${
                            adjustedUrgency === lvl
                              ? lvl === 'high'
                                ? 'bg-urgency-high text-white border-urgency-high'
                                : lvl === 'medium'
                                ? 'bg-urgency-medium text-white border-urgency-medium'
                                : 'bg-urgency-low text-white border-urgency-low'
                              : 'bg-white text-black/70 border-black/20 hover:border-black/40'
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Reason for adjustment (optional)..."
                        value={urgencyReason}
                        onChange={(e) => setUrgencyReason(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs font-normal bg-white text-black border border-black/20 rounded-lg outline-none focus:border-brand-blue"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleSaveUrgencyAdjustment}
                      disabled={isSavingUrgency}
                      className="w-full text-xs font-normal py-1.5 rounded-lg bg-black/5 hover:bg-black/10 text-black border border-black/10 transition-colors cursor-pointer"
                    >
                      {isSavingUrgency ? 'Saving...' : 'Apply Urgency Adjustment'}
                    </button>
                  </div>
                )}

                {/* Lifecycle Timeline with Timestamps (PDF Section 7 & 10.5) */}
                <div className="pt-1">
                  <div className="text-xs font-normal text-black/50 uppercase tracking-wider mb-2">
                    Ticket Lifecycle
                  </div>
                  <StatusTimeline
                    status={drawerReq.status}
                    submittedAt={drawerReq.created_at}
                    assignedAt={drawerReq.assigned_at}
                    startedAt={drawerReq.started_at}
                    resolvedAt={drawerReq.resolved_at}
                    cancelledAt={drawerReq.cancelled_at}
                  />
                </div>
              </div>

              {/* Modal Footer (PDF Section 5.4: Assign, Reassign, Unassign, Cancel; Resolved cannot be reopened) */}
              <div className="p-3 border-t border-black/10 flex items-center justify-between gap-2 bg-black/[0.02] shrink-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {drawerReq.status !== 'resolved' && drawerReq.status !== 'cancelled' && (
                    <>
                      {!isRequestAssigned(drawerReq) ? (
                        <button
                          type="button"
                          onClick={() => {
                            const target = drawerReq;
                            setDrawerReq(null);
                            handleOpenAssignModal(target);
                          }}
                          className="px-3.5 py-1.5 text-xs font-normal rounded-xl bg-brand-blue hover:bg-brand-blue-hover text-white shadow-xs transition-colors cursor-pointer"
                        >
                          Assign Staff
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              const target = drawerReq;
                              setDrawerReq(null);
                              handleOpenAssignModal(target);
                            }}
                            className="px-3 py-1.5 text-xs font-normal rounded-xl bg-brand-blue hover:bg-brand-blue-hover text-white shadow-xs transition-colors cursor-pointer"
                          >
                            Reassign
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUnassign(drawerReq.id)}
                            disabled={isUnassigningId === drawerReq.id}
                            className="px-3 py-1.5 text-xs font-normal rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-200 shadow-xs transition-colors cursor-pointer"
                          >
                            {isUnassigningId === drawerReq.id ? 'Unassigning...' : 'Unassign'}
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => handleAdminCancelRequest(drawerReq)}
                        className="px-3 py-1.5 text-xs font-normal rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer"
                      >
                        Cancel Request
                      </button>
                    </>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setDrawerReq(null)}
                  className="px-4 py-1.5 text-xs font-normal rounded-xl bg-black/5 text-black hover:bg-black/10 transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Modal: Customer Record (Step 5a: Selecting an Active customer home icon opens a summary with a button to open the customer's record) */}
      {customerRecordModal &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 bg-black/65 backdrop-blur-md z-[99999] flex items-center justify-center p-4 animate-hero-entrance"
            onClick={(e) => {
              if (e.target === e.currentTarget) setCustomerRecordModal(null);
            }}
          >
            <Card
              className="w-full max-w-md bg-white p-5 rounded-md shadow-2xl border border-black/15 space-y-4 relative z-[100000]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-black/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <img
                    src={getCustomerPhoto(customerRecordModal)}
                    alt="Customer profile"
                    className="w-10 h-10 rounded-full object-cover border border-black/15 shrink-0"
                  />
                  <div>
                    <h3 className="text-sm font-bold text-black">Customer Record</h3>
                    <div className="text-[11px] text-black/55">
                      {customerRecordModal.customer_profile?.account_number || `ACC-${customerRecordModal.id}`}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCustomerRecordModal(null)}
                  className="p-1 text-black/50 hover:text-black cursor-pointer"
                >
                  <IconX size={16} />
                </button>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-black/10 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-black/60">Name:</span>
                  <span className="font-bold text-black">
                    {customerRecordModal.name ||
                      `${customerRecordModal.customer_profile?.first_name || ''} ${
                        customerRecordModal.customer_profile?.last_name || ''
                      }`.trim()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-black/60">Meter Number:</span>
                  <span className="font-bold text-brand-blue">
                    {customerRecordModal.customer_profile?.meter?.meter_number || 'MTR-UNASSIGNED'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-black/60">Address:</span>
                  <span className="font-medium text-black text-right">
                    {customerRecordModal.customer_profile?.address || 'Sinacaban'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-black/60">Barangay:</span>
                  <span className="font-medium text-black">
                    {customerRecordModal.customer_profile?.barangay?.name || 'Poblacion'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-black/60">Mobile Number:</span>
                  <span className="text-black">{customerRecordModal.mobile_number}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-black/60">Account Status:</span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700 capitalize">
                    {customerRecordModal.status}
                  </span>
                </div>
                {customerRecordModal.customer_profile?.latitude &&
                  customerRecordModal.customer_profile?.longitude && (
                    <div className="flex items-center justify-between pt-1.5 border-t border-black/10 text-[11px]">
                      <span className="text-black/55">Registered Home Pin:</span>
                      <span className="font-mono text-black/75">
                        {Number(customerRecordModal.customer_profile.latitude).toFixed(4)},{' '}
                        {Number(customerRecordModal.customer_profile.longitude).toFixed(4)}
                      </span>
                    </div>
                  )}
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-black/10 pt-3">
                <button
                  type="button"
                  onClick={() => setCustomerRecordModal(null)}
                  className="px-3 py-1.5 text-xs font-normal rounded-xl bg-black/5 text-black hover:bg-black/10 transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCustomerRecordModal(null);
                    navigate('/admin/users?role=consumer');
                  }}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-brand-blue text-white hover:bg-brand-blue-hover transition-colors cursor-pointer"
                >
                  Open in User Management
                </button>
              </div>
            </Card>
          </div>,
          document.body
        )}

      {/* Modern System Modal for alerts, confirmations & error messages */}
      <SystemModal
        isOpen={systemModal.isOpen}
        onClose={() => setSystemModal((m) => ({ ...m, isOpen: false }))}
        type={systemModal.type}
        title={systemModal.title}
        message={systemModal.message}
        confirmText={systemModal.confirmText}
        cancelText={systemModal.cancelText}
        onConfirm={systemModal.onConfirm}
        isDestructive={systemModal.isDestructive}
        details={systemModal.details}
      />
    </AdminLayout>
  );
}
