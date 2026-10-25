import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Input } from '../components/atoms/Input';

describe('Input Component', () => {
  it('renders input with label and placeholder', () => {
    render(<Input label="Mobile Number" placeholder="0917XXXXXXX" />);
    expect(screen.getByLabelText(/mobile number/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('0917XXXXXXX')).toBeInTheDocument();
  });

  it('renders required indicator when required is true', () => {
    render(<Input label="Account Number" required />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('renders error message and links with aria-invalid and aria-describedby', () => {
    render(<Input label="Password" error="Password must be at least 8 characters" />);
    const input = screen.getByLabelText(/password/i);
    const errorMsg = screen.getByText(/\[!\] Password must be at least 8 characters/i);
    expect(errorMsg).toBeInTheDocument();
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', errorMsg.id);
  });

  it('renders helper text linked with aria-describedby when no error is present', () => {
    render(<Input label="Email" helperText="We will never share your email." />);
    const input = screen.getByLabelText(/email/i);
    const helperMsg = screen.getByText('We will never share your email.');
    expect(helperMsg).toBeInTheDocument();
    expect(input).toHaveAttribute('aria-describedby', helperMsg.id);
  });

  it('uses 16px mobile typography and black/55 placeholder', () => {
    render(<Input label="Test" placeholder="Placeholder" />);
    const input = screen.getByPlaceholderText('Placeholder');
    expect(input).toHaveClass('text-[16px]');
    expect(input).toHaveClass('placeholder:text-black/55');
  });

  it('supports left icon rendering', () => {
    render(<Input label="Search" leftIcon={<span data-testid="search-icon">🔍</span>} />);
    expect(screen.getByTestId('search-icon')).toBeInTheDocument();
  });

  it('supports right icon rendering', () => {
    render(<Input label="Password" rightIcon={<span data-testid="right-eye-icon">👁</span>} />);
    expect(screen.getByTestId('right-eye-icon')).toBeInTheDocument();
  });
});

