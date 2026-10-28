import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CustomerRequestsView } from '../pages/customer/CustomerRequestsView';
import { UrgencyDerivation, deriveUrgency } from '../components/molecules/UrgencyDerivation';
import { StatusTimeline } from '../components/organisms/StatusTimeline';
import { validatePhotoFile, MAX_PHOTO_BYTES } from '../utils/imageResize';
import { FIXED_ISSUE_TYPES, maintenanceStore } from '../services/maintenanceStore';
import type { Urgency } from '../types';

const { mockCustomerUser } = vi.hoisted(() => ({
  mockCustomerUser: {
    id: 101,
    name: 'Maria Santos',
    email: 'maria@example.com',
    role: 'customer' as const,
    customer_profile: {
      account_number: 'ACC-2026-0001',
      meter: { meter_number: 'MTR-SIN-0001' },
      barangay: { name: 'Poblacion' },
      address: 'Purok 1, Poblacion',
    },
  },
}));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockCustomerUser,
    logout: vi.fn(),
  }),
}));

// Mock MunicipalMap to avoid leaflet canvas issues in jsdom
vi.mock('../components/organisms/MunicipalMap', () => ({
  MunicipalMap: ({ onSelectCoords }: { onSelectCoords?: (lat: number, lng: number) => void }) => (
    <div data-testid="mock-municipal-map">
      <button
        type="button"
        data-testid="simulate-map-pin"
        onClick={() => onSelectCoords?.(8.2855, 123.8429)}
      >
        Select Map Pin
      </button>
    </div>
  ),
  SINACABAN_CENTER: [8.2855, 123.8429],
  getSinacabanBarangayCoords: () => [8.2855, 123.8429],
  isWithinSinacabanBounds: () => true,
  SINACABAN_BARANGAYS: ['Poblacion', 'Cagay-anon'],
}));

describe('Customer Requests Slice - Requirements & Acceptance', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('1. Fixed Issue Types & Defaults', () => {
    it('defines exactly six fixed issue types with exact workflow default urgencies', () => {
      expect(FIXED_ISSUE_TYPES).toHaveLength(6);

      const expectedTypes: [string, Urgency][] = [
        ['No water supply', 'high'],
        ['Pipe leak or burst', 'high'],
        ['Water quality problem', 'high'],
        ['Low water pressure', 'medium'],
        ['Meter problem', 'medium'],
        ['Other concern', 'low'],
      ];

      expect(FIXED_ISSUE_TYPES.map((t) => [t.name, t.default_urgency])).toEqual(expectedTypes);
    });
  });

  describe('2. Urgency Derivation Rules', () => {
    it('never lowers urgency below default', () => {
      // High cannot be lowered
      expect(deriveUrgency('high', 'medium')).toBe('high');
      expect(deriveUrgency('high', 'low')).toBe('high');

      // Medium cannot be lowered to Low
      expect(deriveUrgency('medium', 'low')).toBe('medium');
    });

    it('cannot raise urgency by more than one level above default', () => {
      // Low can be raised to Medium (+1), but not High (+2)
      expect(deriveUrgency('low', 'medium')).toBe('medium');
      expect(deriveUrgency('low', 'high')).toBe('medium');

      // Medium can be raised to High (+1)
      expect(deriveUrgency('medium', 'high')).toBe('high');

      // High is already max
      expect(deriveUrgency('high', 'high')).toBe('high');
    });

    it('renders UrgencyDerivation showing default and final urgency with zero hours', () => {
      const handleUrgencyChange = vi.fn();
      const { container } = render(
        <UrgencyDerivation
          defaultUrgency="medium"
          customerUrgency="medium"
          onCustomerUrgencyChange={handleUrgencyChange}
        />
      );

      // Verify default and final urgency are shown
      expect(screen.getByText('Issue Default')).toBeInTheDocument();
      expect(screen.getByText('Final Urgency')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Medium \(Default\)/i })).toBeInTheDocument();

      // Ensure NO hours or SLA mentions exist
      expect(container.textContent).not.toMatch(/\d+\s*(hours|hrs|hr|countdown)/i);

      // Customer chooses to raise to High (+1 level)
      const highOption = screen.getByRole('button', { name: /High \(\+1 Level\)/i });
      fireEvent.click(highOption);
      expect(handleUrgencyChange).toHaveBeenCalledWith('high');
    });

    it('does not allow choosing Low when default is Medium or High', () => {
      render(
        <UrgencyDerivation
          defaultUrgency="medium"
          customerUrgency="medium"
          onCustomerUrgencyChange={vi.fn()}
        />
      );

      // Low option should not exist when default is medium
      expect(screen.queryByRole('button', { name: /Low/i })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Medium \(Default\)/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /High \(\+1 Level\)/i })).toBeInTheDocument();
    });
  });

  describe('3. Photo Validation & Canvas Resize', () => {
    it('accepts valid JPG and PNG files under 5 MB', () => {
      const validJpg = new File(['dummy-bytes'], 'pipeline_leak.jpg', { type: 'image/jpeg' });
      const validPng = new File(['dummy-bytes'], 'meter_photo.png', { type: 'image/png' });

      expect(validatePhotoFile(validJpg)).toEqual({ valid: true });
      expect(validatePhotoFile(validPng)).toEqual({ valid: true });
    });

    it('rejects files larger than 5 MB', () => {
      const largeBytes = new Uint8Array(MAX_PHOTO_BYTES + 1024);
      const largeFile = new File([largeBytes], 'huge_image.jpg', { type: 'image/jpeg' });

      const result = validatePhotoFile(largeFile);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('5 MB');
    });

    it('rejects unsupported file formats', () => {
      const pdfFile = new File(['dummy-pdf'], 'document.pdf', { type: 'application/pdf' });
      const gifFile = new File(['dummy-gif'], 'animation.gif', { type: 'image/gif' });

      expect(validatePhotoFile(pdfFile).valid).toBe(false);
      expect(validatePhotoFile(gifFile).valid).toBe(false);
    });
  });

  describe('4. StatusTimeline & Logo Droplet Marker', () => {
    it('renders the 4 workflow steps and uses the logo droplet as active step marker', () => {
      const { container } = render(
        <StatusTimeline
          status="assigned"
          submittedAt="2026-10-21T08:00:00"
          assignedAt="2026-10-21T08:30:00"
        />
      );

      // Verify all steps are rendered
      expect(screen.getAllByText('Submitted').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Assigned').length).toBeGreaterThan(0);
      expect(screen.getAllByText('In progress').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Resolved').length).toBeGreaterThan(0);

      // Verify the active marker (Logo Droplet) is present
      const dropletMarkers = screen.getAllByTestId('logo-droplet-marker');
      expect(dropletMarkers.length).toBeGreaterThan(0);

      // Verify mobile vertical and desktop layouts are present
      expect(container.querySelector('.block.sm\\:hidden')).toBeInTheDocument();
      expect(container.querySelector('.hidden.sm\\:grid')).toBeInTheDocument();
    });

    it('renders cancelled state banner when request is cancelled', () => {
      render(
        <StatusTimeline
          status="cancelled"
          submittedAt="2026-10-21T08:00:00"
          cancelledAt="2026-10-21T09:00:00"
          cancelledReason="Customer resolved issue on site"
        />
      );

      expect(screen.getByText('Cancelled')).toBeInTheDocument();
      expect(screen.getByText(/Customer resolved issue on site/i)).toBeInTheDocument();
    });
  });

  describe('5. Customer Request Cancellation Rules', () => {
    it('allows cancel only when status is Submitted or Assigned', () => {
      const req = maintenanceStore.createRequest({
        issueTypeId: 2, // Pipe leak or burst
        customerUrgency: 'high',
        description: 'Water leak outside property',
        barangay: 'Poblacion',
        latitude: 8.2855,
        longitude: 123.8429,
      });

      // Allowed when submitted
      expect(req.status).toBe('submitted');
      const cancelled = maintenanceStore.cancelRequest(req.id, 'customer', 'No longer needed');
      expect(cancelled.status).toBe('cancelled');
    });

    it('disallows cancellation once In progress or Resolved', () => {
      const req = maintenanceStore.createRequest({
        issueTypeId: 1, // No water supply
        customerUrgency: 'high',
        description: 'Entire block has no water',
        barangay: 'Poblacion',
        latitude: 8.2855,
        longitude: 123.8429,
      });

      maintenanceStore.assignStaff(req.id, {
        id: 201,
        name: 'Pedro Cruz',
        role: 'staff',
        status: 'active',
        mobile_number: '09170000002',
        must_change_password: false,
      });
      maintenanceStore.startWork(req.id);

      // Attempting customer cancellation when in_progress must throw
      expect(() => maintenanceStore.cancelRequest(req.id, 'customer')).toThrow();
    });
  });

  describe('6. CustomerRequestsView UI & 414px Mobile Form', () => {
    it('opens Report an Issue modal and displays 6 cards with icon and title only', async () => {
      render(
        <BrowserRouter>
          <CustomerRequestsView />
        </BrowserRouter>
      );

      const reportBtn = screen.getByRole('button', { name: /Report an Issue/i });
      fireEvent.click(reportBtn);

      expect(screen.getByText('Report a Water Service Issue')).toBeInTheDocument();

      // Verify all 6 category cards are displayed
      for (const issueType of FIXED_ISSUE_TYPES) {
        expect(screen.getByRole('button', { name: new RegExp(issueType.name, 'i') })).toBeInTheDocument();
      }

      // Verify UrgencyDerivation and LocationPickerMap are rendered inside the form
      expect(screen.getByText('Incident Location (Pin on Map) *')).toBeInTheDocument();
      expect(screen.getByTestId('mock-municipal-map')).toBeInTheDocument();
    });

    it('updates default urgency and resets customer urgency when changing issue card', () => {
      render(
        <BrowserRouter>
          <CustomerRequestsView />
        </BrowserRouter>
      );

      fireEvent.click(screen.getByRole('button', { name: /Report an Issue/i }));

      // Select "No water supply" (High default)
      const noWaterBtn = screen.getByRole('button', { name: /No water supply/i });
      fireEvent.click(noWaterBtn);

      // Default should now show High option
      expect(screen.getByRole('button', { name: /High \(Maximum\)/i })).toBeInTheDocument();

      // Select "Other concern" (Low default)
      const otherBtn = screen.getByRole('button', { name: /Other concern/i });
      fireEvent.click(otherBtn);

      // Default should now show Low option
      expect(screen.getByRole('button', { name: /Low \(Default\)/i })).toBeInTheDocument();
    });
  });
});
