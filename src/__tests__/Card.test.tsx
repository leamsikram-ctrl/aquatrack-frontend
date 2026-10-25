import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card } from '../components/atoms/Card';

describe('Card Component', () => {
  it('renders children correctly', () => {
    render(<Card>Card Content</Card>);
    expect(screen.getByText('Card Content')).toBeInTheDocument();
  });

  it('applies faint gray border and 3D hard shadow when not active', () => {
    const { container } = render(<Card>Normal Card</Card>);
    expect(container.firstChild).toHaveClass('border-black/10');
    expect(container.firstChild).toHaveClass('shadow-[0_4px_0_0_rgba(0,0,0,0.08)]');
  });

  it('applies active highlight border and shadow when active is true', () => {
    const { container } = render(<Card active>Active Card</Card>);
    expect(container.firstChild).toHaveClass('border-brand-blue');
    expect(container.firstChild).toHaveClass('shadow-[0_4px_0_0_var(--color-brand-blue)]');
  });
});

