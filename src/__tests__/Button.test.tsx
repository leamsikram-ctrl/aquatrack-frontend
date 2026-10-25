import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from '../components/atoms/Button';

describe('Button Component', () => {
  it('renders primary variant by default with text', () => {
    render(<Button>Submit</Button>);
    const button = screen.getByRole('button', { name: /submit/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('bg-[#0F172A]');
    expect(button).not.toBeDisabled();
  });

  it('renders secondary variant', () => {
    render(<Button variant="secondary">Cancel</Button>);
    const button = screen.getByRole('button', { name: /cancel/i });
    expect(button).toHaveClass('bg-white');
    expect(button).toHaveClass('text-black');
  });

  it('aliases ghost variant to secondary for 2-variant design rule', () => {
    render(<Button variant="ghost">Dismiss</Button>);
    const button = screen.getByRole('button', { name: /dismiss/i });
    expect(button).toHaveClass('bg-white');
    expect(button).toHaveClass('text-black');
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

  it('renders left and right icons horizontally next to text', () => {
    render(
      <Button
        leftIcon={<span data-testid="left-icon">←</span>}
        rightIcon={<span data-testid="right-icon">→</span>}
      >
        Navigate
      </Button>
    );
    const button = screen.getByRole('button');
    expect(button).toHaveClass('flex-row');
    expect(button).toHaveClass('items-center');
    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
  });

  it('renders inline icon and text inside children side-by-side without vertical stacking', () => {
    render(
      <Button>
        <span data-testid="inline-icon">★</span>
        <span>Action Text</span>
      </Button>
    );
    const textWrapper = screen.getByText('Action Text').parentElement;
    expect(textWrapper).toHaveClass('flex-row');
    expect(textWrapper).toHaveClass('items-center');
    expect(textWrapper).toHaveClass('gap-1.5');
  });
});

