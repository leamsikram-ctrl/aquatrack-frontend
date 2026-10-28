import { useState } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { OtpInput } from '../components/molecules/OtpInput';

describe('OtpInput Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders 6 boxes by default', () => {
    render(<OtpInput value="" onChange={() => {}} />);
    for (let i = 0; i < 6; i++) {
      expect(screen.getByTestId(`otp-box-${i}`)).toBeInTheDocument();
    }
  });

  it('displays the entered digits in the corresponding boxes', () => {
    render(<OtpInput value="123" onChange={() => {}} />);
    expect(screen.getByTestId('otp-box-0')).toHaveTextContent('1');
    expect(screen.getByTestId('otp-box-1')).toHaveTextContent('2');
    expect(screen.getByTestId('otp-box-2')).toHaveTextContent('3');
    expect(screen.getByTestId('otp-box-3')).toHaveTextContent('·');
  });

  it('filters non-numeric characters on change', () => {
    const handleChange = vi.fn();
    render(<OtpInput value="" onChange={handleChange} />);

    const input = screen.getByLabelText('6-digit verification code');
    fireEvent.change(input, { target: { value: '12a3b4' } });

    expect(handleChange).toHaveBeenCalledWith('1234');
  });

  it('handles paste events with non-numeric filtering and slicing', () => {
    const handleChange = vi.fn();
    render(<OtpInput value="" onChange={handleChange} />);

    const input = screen.getByLabelText('6-digit verification code');
    fireEvent.paste(input, {
      clipboardData: {
        getData: () => '98-76-54-32',
      },
    });

    expect(handleChange).toHaveBeenCalledWith('987654');
  });

  it('displays error without clearing the entered value', () => {
    function ControlledWrapper() {
      const [val, setVal] = useState('123456');
      return (
        <OtpInput
          value={val}
          onChange={setVal}
          error="Incorrect PIN. You have 4 attempt(s) remaining."
        />
      );
    }

    render(<ControlledWrapper />);

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Incorrect PIN. You have 4 attempt(s) remaining.'
    );
    // Value remains in boxes
    expect(screen.getByTestId('otp-box-0')).toHaveTextContent('1');
    expect(screen.getByTestId('otp-box-5')).toHaveTextContent('6');
  });

  it('supports 30-second countdown before resend button is active', () => {
    const handleResend = vi.fn();
    render(
      <OtpInput
        value=""
        onChange={() => {}}
        onResend={handleResend}
        resendCooldown={30}
      />
    );

    // Initial state: countdown active
    expect(screen.getByText(/Resend in/i)).toBeInTheDocument();
    expect(screen.getByText('30s')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Resend PIN/i })).not.toBeInTheDocument();

    // Advance 15 seconds
    act(() => {
      vi.advanceTimersByTime(15000);
    });
    expect(screen.getByText('15s')).toBeInTheDocument();

    // Advance remaining 15 seconds
    act(() => {
      vi.advanceTimersByTime(15000);
    });

    // Resend button should now appear
    const resendBtn = screen.getByRole('button', { name: /Resend PIN/i });
    expect(resendBtn).toBeInTheDocument();

    // Click resend
    fireEvent.click(resendBtn);
    expect(handleResend).toHaveBeenCalledTimes(1);

    // Countdown restarts at 30s
    expect(screen.getByText('30s')).toBeInTheDocument();
  });
});

