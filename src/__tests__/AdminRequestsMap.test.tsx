import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import {
  SINACABAN_CENTER,
  getUrgencyPinColor,
  createPinIcon,
  createGroupMarkerIcon,
  groupNearbyMarkers,
  type MapMarker,
} from '../components/organisms/MunicipalMap';
import { StaffTasksView } from '../pages/staff/StaffTasksView';
import { AdminRequestsView } from '../pages/admin/AdminRequestsView';
import { requestsApi, adminApi } from '../api';
import { validatePhotoFile } from '../utils/imageResize';
import type { ServiceRequest, User } from '../types';

// Mock AuthContext
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 5,
      role: 'staff',
      name: 'Technician Juan',
      email: 'staff@aquatrack.gov.ph',
      status: 'active',
    },
    logout: vi.fn(),
  }),
}));

// Mock Leaflet and APIs
vi.mock('../api', () => ({
  requestsApi: {
    list: vi.fn(),
    start: vi.fn(),
    resolve: vi.fn(),
    assign: vi.fn(),
    unassign: vi.fn(),
    cancel: vi.fn(),
    adjustUrgency: vi.fn(),
  },
  interruptionsApi: {
    list: vi.fn().mockResolvedValue([]),
  },
  adminApi: {
    staffList: vi.fn(),
  },
  referenceApi: {
    getBarangays: vi.fn().mockResolvedValue([]),
    getIssueTypes: vi.fn().mockResolvedValue([]),
  },
}));

describe('Admin Requests and GIS Map Slice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GIS Map Coordinates and First View', () => {
    it('centers on Sinacaban by default [8.2950, 123.7800]', () => {
      expect(SINACABAN_CENTER[0]).toBeCloseTo(8.295, 3);
      expect(SINACABAN_CENTER[1]).toBeCloseTo(123.78, 2);
    });
  });

  describe('Legend and Pin Colours', () => {
    it('matches pin colors: High is Red, Medium is Orange, Low is Green, Closed is Grey', () => {
      // High urgency -> Red token
      expect(getUrgencyPinColor('high')).toBe('var(--color-urgency-high)');
      expect(getUrgencyPinColor('critical')).toBe('var(--color-urgency-high)');

      // Medium urgency -> Orange token
      expect(getUrgencyPinColor('medium')).toBe('var(--color-urgency-medium)');

      // Low urgency -> Green token (#43A047)
      expect(getUrgencyPinColor('low')).toBe('var(--color-urgency-low)');

      // Resolved / Cancelled -> Grey token (#64748B)
      expect(getUrgencyPinColor('high', undefined, 'resolved')).toBe('var(--color-assigned)');
      expect(getUrgencyPinColor('medium', undefined, 'cancelled')).toBe('var(--color-assigned)');
      expect(getUrgencyPinColor('low', undefined, 'resolved')).toBe('var(--color-assigned)');
    });
  });

  describe('Marker Grouping (Acceptance: 3 requests at one address show one marker with the number 3)', () => {
    it('groups 3 requests at the same address into 1 marker displaying the number 3', () => {
      const coLocatedMarkers: MapMarker[] = [
        {
          id: 101,
          lat: 8.2855,
          lng: 123.8429,
          title: 'AT-0101',
          urgency: 'high',
          status: 'submitted',
        },
        {
          id: 102,
          lat: 8.2855,
          lng: 123.8429,
          title: 'AT-0102',
          urgency: 'medium',
          status: 'submitted',
        },
        {
          id: 103,
          lat: 8.2855,
          lng: 123.8429,
          title: 'AT-0103',
          urgency: 'low',
          status: 'assigned',
        },
      ];

      const groups = groupNearbyMarkers(coLocatedMarkers);
      expect(groups).toHaveLength(1);
      expect(groups[0].items).toHaveLength(3);

      const groupIcon = createGroupMarkerIcon(groups[0].items);
      const iconHtml = (groupIcon.options as { html: string }).html;

      // Acceptance: The marker shows the number 3
      expect(iconHtml).toMatch(/3/);
      expect(groupIcon.options.className).toContain('grouped-marker');
    });
  });

  describe('Submitted Radar Pulse Ring', () => {
    it('adds pulsing radar ring on submitted requests only', () => {
      const submittedIcon = createPinIcon({ status: 'submitted', urgency: 'high' });
      const assignedIcon = createPinIcon({ status: 'assigned', urgency: 'high' });
      const inProgressIcon = createPinIcon({ status: 'in_progress', urgency: 'high' });
      const resolvedIcon = createPinIcon({ status: 'resolved', urgency: 'high' });

      const submittedHtml = (submittedIcon.options as { html: string }).html;
      const assignedHtml = (assignedIcon.options as { html: string }).html;
      const inProgressHtml = (inProgressIcon.options as { html: string }).html;
      const resolvedHtml = (resolvedIcon.options as { html: string }).html;

      expect(submittedHtml).toContain('pin-radar-pulse');
      expect(assignedHtml).not.toContain('pin-radar-pulse');
      expect(inProgressHtml).not.toContain('pin-radar-pulse');
      expect(resolvedHtml).not.toContain('pin-radar-pulse');
    });
  });

  describe('Photo Validation (Up to 5 MB, JPG/PNG only)', () => {
    it('validates photo files against format and size rules', () => {
      const validJpg = new File(['dummy content'], 'repair.jpg', { type: 'image/jpeg' });
      const validPng = new File(['dummy content'], 'leak.png', { type: 'image/png' });
      const invalidPdf = new File(['dummy content'], 'bill.pdf', { type: 'application/pdf' });
      const hugeFile = new File([new ArrayBuffer(6 * 1024 * 1024)], 'huge.jpg', { type: 'image/jpeg' });

      expect(validatePhotoFile(validJpg).valid).toBe(true);
      expect(validatePhotoFile(validPng).valid).toBe(true);

      const pdfResult = validatePhotoFile(invalidPdf);
      expect(pdfResult.valid).toBe(false);
      expect(pdfResult.error).toContain('Only JPG and PNG');

      const sizeResult = validatePhotoFile(hugeFile);
      expect(sizeResult.valid).toBe(false);
      expect(sizeResult.error).toContain('5 MB');
    });
  });

  describe('Staff Resolve Modal (Acceptance: resolving without a photo works)', () => {
    it('successfully resolves an in-progress task with remarks and NO photo', async () => {
      const mockTask = {
        id: 42,
        reference: 'AT-0042',
        reference_no: 'AT-0042',
        description: 'Main distribution valve leak',
        status: 'in_progress' as const,
        urgency: 'high' as const,
        customer_urgency: 'high' as const,
        issue_type: { id: 2, name: 'Pipe leak or burst', default_urgency: 'high' as const },
        customer: { id: 10, full_name: 'Maria Santos', barangay: 'Poblacion', account_number: 'ACC-10' },
        assigned_staff_id: 5,
        created_at: '2026-10-28T00:00:00Z',
      };

      vi.mocked(requestsApi.list).mockResolvedValue({
        data: [mockTask as unknown as ServiceRequest],
        pagination: { total: 1 },
      });

      vi.mocked(requestsApi.resolve).mockResolvedValue({
        ...mockTask,
        status: 'resolved' as const,
        resolution_remarks: 'Replaced rubber gasket and sealed joint.',
        evidence_photo_path: undefined,
      } as unknown as ServiceRequest);

      render(
        <MemoryRouter>
          <StaffTasksView />
        </MemoryRouter>
      );

      // Open task details drawer
      const taskCard = await screen.findByText('AT-0042');
      fireEvent.click(taskCard);

      // Verify "Complete Repair" section is visible
      expect(await screen.findByRole('heading', { name: /Complete Repair/i })).toBeInTheDocument();

      // Attempt resolve with empty remarks -> must display required validation
      const resolveButton = screen.getAllByRole('button', { name: /Complete Repair/i }).pop()!;
      fireEvent.click(resolveButton);
      expect(await screen.findByText(/Resolution remarks are required/i)).toBeInTheDocument();

      // Enter remarks and resolve WITHOUT selecting any photo
      const remarksTextarea = screen.getByPlaceholderText(/e\.g\. Replaced 1-inch pipe fitting/i);
      fireEvent.change(remarksTextarea, {
        target: { value: 'Replaced rubber gasket and sealed joint.' },
      });

      fireEvent.click(resolveButton);

      // Acceptance: requestsApi.resolve is called with undefined photoPath and succeeds
      await waitFor(() => {
        expect(requestsApi.resolve).toHaveBeenCalledWith(
          42,
          'Replaced rubber gasket and sealed joint.',
          undefined
        );
      });
    });
  });

  describe('Admin Dispatch Modal and Active Staff Filtering', () => {
    it('filters staff assignment to active staff only and supports unassign', async () => {
      const mockAssignedRequest = {
        id: 77,
        reference: 'AT-0077',
        reference_no: 'AT-0077',
        description: 'Low water pressure on 2nd floor',
        status: 'assigned' as const,
        urgency: 'medium' as const,
        customer_urgency: 'can_wait' as const,
        issue_type: { id: 4, name: 'Low water pressure', default_urgency: 'medium' as const },
        customer: { id: 12, full_name: 'Jose Rizal', barangay: 'Poblacion', account_number: 'ACC-12' },
        assigned_staff_id: 2,
        assigned_staff: { id: 2, name: 'Technician Jose', email: 'jose@aquatrack.gov.ph', role: 'staff', status: 'active' },
        created_at: '2026-10-28T00:00:00Z',
      };

      vi.mocked(requestsApi.list).mockResolvedValue({
        data: [mockAssignedRequest as unknown as ServiceRequest],
        pagination: { total: 1 },
      });

      vi.mocked(adminApi.staffList).mockResolvedValue([
        { id: 2, name: 'Technician Jose', email: 'jose@aquatrack.gov.ph', role: 'staff', status: 'active' },
        { id: 3, name: 'Technician Deactivated', email: 'deact@aquatrack.gov.ph', role: 'staff', status: 'inactive' },
      ] as unknown as User[]);

      vi.mocked(requestsApi.unassign).mockResolvedValue({
        ...mockAssignedRequest,
        status: 'submitted' as const,
        assigned_staff_id: undefined,
        assigned_staff: undefined,
      } as unknown as ServiceRequest);

      render(
        <MemoryRouter>
          <AdminRequestsView />
        </MemoryRouter>
      );

      // Open assigned request drawer
      const reqRow = await screen.findByText('AT-0077');
      fireEvent.click(reqRow);

      // Verify Unassign and Reassign buttons are present
      const unassignButton = await screen.findByRole('button', { name: /Unassign/i });
      expect(unassignButton).toBeInTheDocument();

      const reassignButton = screen.getByRole('button', { name: /Reassign Staff/i });
      expect(reassignButton).toBeInTheDocument();

      // Click Unassign -> triggers requestsApi.unassign
      fireEvent.click(unassignButton);
      await waitFor(() => {
        expect(requestsApi.unassign).toHaveBeenCalledWith(77);
      });
    });

    it('allows admin to adjust urgency with reason', async () => {
      const mockSubmittedRequest = {
        id: 88,
        reference: 'AT-0088',
        reference_no: 'AT-0088',
        description: 'Water quality problem - murky water',
        status: 'submitted' as const,
        urgency: 'high' as const,
        customer_urgency: 'urgent' as const,
        issue_type: { id: 3, name: 'Water quality problem', default_urgency: 'high' as const },
        customer: { id: 14, full_name: 'Andres Bonifacio', barangay: 'Cagay-anon', account_number: 'ACC-14' },
        created_at: '2026-10-28T00:00:00Z',
      };

      vi.mocked(requestsApi.list).mockResolvedValue({
        data: [mockSubmittedRequest as unknown as ServiceRequest],
        pagination: { total: 1 },
      });

      vi.mocked(requestsApi.adjustUrgency).mockResolvedValue({
        ...mockSubmittedRequest,
        urgency: 'medium' as const,
        urgency_adjustment_reason: 'Sediment flush in progress nearby',
      } as unknown as ServiceRequest);

      render(
        <MemoryRouter>
          <AdminRequestsView />
        </MemoryRouter>
      );

      const reqRow = await screen.findByText('AT-0088');
      fireEvent.click(reqRow);

      // Change urgency dropdown
      const urgencySelect = screen.getByDisplayValue(/High Urgency/i);
      fireEvent.change(urgencySelect, { target: { value: 'medium' } });

      // Enter reason
      const reasonInput = screen.getByPlaceholderText(/Reason for change \(optional\)/i);
      fireEvent.change(reasonInput, { target: { value: 'Sediment flush in progress nearby' } });

      // Click Apply Urgency Override
      const applyButton = screen.getByRole('button', { name: /Apply Urgency Override/i });
      fireEvent.click(applyButton);

      await waitFor(() => {
        expect(requestsApi.adjustUrgency).toHaveBeenCalledWith(
          88,
          'medium',
          'Sediment flush in progress nearby'
        );
      });
    });
  });
});
