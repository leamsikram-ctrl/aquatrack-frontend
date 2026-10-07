import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from '../components/atoms/Button';

describe('Button Component', () => {
  it('renders primary variant by default with text', () => {
    render(<Button>Submit</Button>);
    const button = screen.getByRole('button', { name: /submit/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('bg-[#1E6FD9]');
    expect(button).not.toBeDisabled();
  });

  it('renders secondary variant', () => {
    render(<Button variant="secondary">Cancel</Button>);
    const button = screen.getByRole('button', { name: /cancel/i });
    expect(button).toHaveClass('bg-white');
    expect(button).toHaveClass('text-black');
  });

  it('renders ghost variant', () => {
    render(<Button variant="ghost">Dismiss</Button>);
    const button = screen.getByRole('button', { name: /dismiss/i });
    expect(button).toHaveClass('bg-transparent');
  });

  it('handles disabled state properly', () => {
    render(<Button disabled>Disabled Action</Button>);
    const button = screen.getByRole('button', { name: /disabled action/i });
    expect(button).toBeDisabled();
    expect(button).toHaveClass('disabled:opacity-50');
  });

  it('shows loading spinner and disables button when isLoading is true', () => {
    render(<Button isLoading>Saving...</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders left and right icons', () => {
    render(
      <Button
        leftIcon={<span data-testid="left-icon">←</span>}
        rightIcon={<span data-testid="right-icon">→</span>}
      >
        Navigate
      </Button>
    );
    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
  });
});

