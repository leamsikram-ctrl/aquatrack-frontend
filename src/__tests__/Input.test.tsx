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

  it('renders error message and applies error styles when error prop is set', () => {
    render(<Input label="Password" error="Password must be at least 8 characters" />);
    expect(screen.getByText(/\[!\] Password must be at least 8 characters/i)).toBeInTheDocument();
  });

  it('renders helper text when no error is present', () => {
    render(<Input label="Email" helperText="We will never share your email." />);
    expect(screen.getByText('We will never share your email.')).toBeInTheDocument();
  });

  it('supports left icon rendering', () => {
    render(<Input label="Search" leftIcon={<span data-testid="search-icon">🔍</span>} />);
    expect(screen.getByTestId('search-icon')).toBeInTheDocument();
  });
});
