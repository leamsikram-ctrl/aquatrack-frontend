import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MeterTagModal } from '../components/organisms/MeterTagModal';
import { adminApi } from '../api';
import type { User } from '../types';

vi.mock('qrcode', () => ({
  default: {
    toCanvas: vi.fn((_canvas, _text, _opts, cb) => {
      if (cb) cb(null);
    }),
  },
}));

const mockCustomer: User = {
  id: 101,
  role: 'customer',
  status: 'active',
  name: 'Maria Santos',
  mobile_number: '09171234567',
  email: 'maria@example.com',
  is_verified: true,
  must_change_password: false,
  customer_profile: {
    id: 1,
    user_id: 101,
    account_number: 'ACC-2026-0001',
    first_name: 'Maria',
    last_name: 'Santos',
    barangay_id: 1,
    address: 'Purok 2, Near Public Market',
    meter: {
      id: 201,
      meter_number: 'MTR-SIN-0001',
      qr_token: 'qr-demo-token-0001',
      status: 'assigned',
    },
  },
};

describe('MeterTagModal Component', () => {
  it('loads and renders meter tag metadata with QR code frame and print actions', async () => {
    vi.spyOn(adminApi, 'meterTag').mockResolvedValueOnce({
      user_id: 101,
      customer_name: 'Maria Santos',
      account_number: 'ACC-2026-0001',
      meter_id: 201,
      meter_number: 'MTR-SIN-0001',
      meter_status: 'assigned',
      qr_token: 'qr-demo-token-0001',
      barangay: 'Poblacion',
      address: 'Purok 2, Near Public Market',
      verified_at: '2026-10-07',
      issued_by: 'SIWASS LGU Sinacaban',
    });

    render(<MeterTagModal customer={mockCustomer} onClose={vi.fn()} />);

    expect(screen.getByText(/Meter Tag & QR Code Generator/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('SIWASS Meter Tag')).toBeInTheDocument();
      expect(screen.getByText('Maria Santos')).toBeInTheDocument();
      expect(screen.getByText('ACC-2026-0001')).toBeInTheDocument();
      expect(screen.getByText('MTR-SIN-0001')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /Print Tag/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Save QR/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Copy Token/i })).toBeInTheDocument();
  });
});
