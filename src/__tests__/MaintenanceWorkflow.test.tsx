import { describe, it, expect, beforeEach } from 'vitest';
import {
  FIXED_ISSUE_TYPES,
  getAllowedCustomerUrgencies,
  deriveCustomerUrgency,
  maintenanceStore,
  DEFAULT_ACTIVE_STAFF,
  DEFAULT_GIS_CUSTOMERS,
  isCustomerActiveForGisMap,
} from '../services/maintenanceStore';
import { groupNearbyMarkers } from '../components/organisms/MunicipalMap';

describe('AquaTrack Maintenance Request Workflow Rules', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('defines the exact 6 fixed issue types and default urgencies from Section 3', () => {
    expect(FIXED_ISSUE_TYPES).toHaveLength(6);
    expect(FIXED_ISSUE_TYPES.map((t) => [t.name, t.default_urgency])).toEqual([
      ['No water supply', 'high'],
      ['Pipe leak or burst', 'high'],
      ['Water quality problem', 'high'],
      ['Low water pressure', 'medium'],
      ['Meter problem', 'medium'],
      ['Other concern', 'low'],
    ]);
  });

  it('allows customer to raise urgency by at most 1 level and never lower it (Section 3 & 4)', () => {
    // Low -> Low or Medium (cannot jump to High)
    expect(getAllowedCustomerUrgencies('low')).toEqual(['low', 'medium']);
    expect(deriveCustomerUrgency('low', 'high')).toBe('medium');

    // Medium -> Medium or High (cannot lower to Low)
    expect(getAllowedCustomerUrgencies('medium')).toEqual(['medium', 'high']);
    expect(deriveCustomerUrgency('medium', 'low')).toBe('medium');
    expect(deriveCustomerUrgency('medium', 'high')).toBe('high');

    // High -> High only (cannot lower to Medium or Low)
    expect(getAllowedCustomerUrgencies('high')).toEqual(['high']);
    expect(deriveCustomerUrgency('high', 'low')).toBe('high');
  });

  it('enforces strict status order Submitted -> Assigned -> In progress -> Resolved and prevents reopening Resolved (Section 10)', () => {
    const req = maintenanceStore.createRequest({
      issueTypeId: 4, // Low water pressure (medium)
      customerUrgency: 'high', // raised by 1 level
      description: 'Very low pressure at household tap',
      barangay: 'Poblacion',
      latitude: 8.2855,
      longitude: 123.8429,
    });

    expect(req.status).toBe('submitted');
    expect(req.urgency).toBe('high');

    // Cannot skip Assigned and jump straight to In progress or Resolved
    expect(() => maintenanceStore.startWork(req.id)).toThrow();
    expect(() => maintenanceStore.resolveRequest(req.id, 'Fixed early')).toThrow();

    // Assign active staff -> Assigned
    const activeStaff = DEFAULT_ACTIVE_STAFF[0];
    const { request: assigned } = maintenanceStore.assignStaff(req.id, activeStaff, 'Check main valve');
    expect(assigned.status).toBe('assigned');
    expect(assigned.assigned_at).toBeTruthy();

    // Start work -> In progress
    const started = maintenanceStore.startWork(req.id);
    expect(started?.status).toBe('in_progress');
    expect(started?.started_at).toBeTruthy();

    // Customer cannot cancel once In progress (Section 10.4)
    expect(() => maintenanceStore.cancelRequest(req.id, 'customer')).toThrow();

    // Resolve -> Resolved
    const resolved = maintenanceStore.resolveRequest(req.id, 'Replaced valve gasket', '/storage/evidence/proof.jpg');
    expect(resolved?.status).toBe('resolved');
    expect(resolved?.resolved_at).toBeTruthy();
    expect(resolved?.resolution_remarks).toBe('Replaced valve gasket');

    // Resolved request cannot be reopened or cancelled (Section 10.3)
    expect(() => maintenanceStore.unassignStaff(req.id)).toThrow();
    expect(() => maintenanceStore.assignStaff(req.id, activeStaff)).toThrow();
    expect(() => maintenanceStore.cancelRequest(req.id, 'admin')).toThrow();
  });

  it('shows only Active customers on the GIS Customers layer and excludes Pending, Declined, and Inactive customers (Section 8 Step 5a)', () => {
    const activeCustomers = DEFAULT_GIS_CUSTOMERS.filter(isCustomerActiveForGisMap);
    const activeNames = activeCustomers.map((c) => c.name);

    expect(activeNames).toContain('Maria Santos');
    expect(activeNames).toContain('Pedro Santos');
    expect(activeNames).toContain('Juan Dela Cruz');
    expect(activeNames).toContain('Elena Ramos');
    expect(activeNames).toContain('Roberto Tan');

    // Pending, Declined, and Suspended (Inactive) must not appear
    expect(activeNames).not.toContain('Carlos Mendoza'); // Pending
    expect(activeNames).not.toContain('Ricardo Gomez'); // Declined
    expect(activeNames).not.toContain('Lorna Villanueva'); // Suspended / Inactive
  });

  it('groups co-located or shared-address markers into a single grouped marker with a count (Section 8 Step 5c)', () => {
    const groups = groupNearbyMarkers([
      {
        id: 'customer-301',
        markerType: 'customer',
        lat: 8.2861,
        lng: 123.8434,
        title: 'Maria Santos',
        customerName: 'Maria Santos',
        meterNumber: 'MTR-88912',
        address: 'Purok 2, Near Public Market',
        barangay: 'Poblacion',
      },
      {
        id: 'customer-302',
        markerType: 'customer',
        lat: 8.2861,
        lng: 123.8434,
        title: 'Pedro Santos',
        customerName: 'Pedro Santos',
        meterNumber: 'MTR-88913',
        address: 'Purok 2, Near Public Market',
        barangay: 'Poblacion',
      },
      {
        id: 101,
        markerType: 'request',
        lat: 8.2855,
        lng: 123.8429,
        title: 'AT-2026-0101',
        urgency: 'high',
        status: 'submitted',
      },
    ]);

    // Maria Santos and Pedro Santos share [8.2861, 123.8434] -> grouped into 1 cluster with count 2;
    // Request AT-2026-0101 is at [8.2855, 123.8429] (Step 5b: differs from customer home) -> separate marker
    expect(groups).toHaveLength(2);
    const sharedAddressGroup = groups.find((g) => g.items.length === 2);
    expect(sharedAddressGroup).toBeDefined();
    expect(sharedAddressGroup?.items.map((m) => m.title)).toEqual(['Maria Santos', 'Pedro Santos']);
  });
});
