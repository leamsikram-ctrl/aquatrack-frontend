import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card } from '../components/atoms/Card';

describe('Card Component', () => {
  it('renders children correctly', () => {
    render(<Card>Card Content</Card>);
    expect(screen.getByText('Card Content')).toBeInTheDocument();
  });

  it('applies default border style when not active', () => {
    const { container } = render(<Card>Normal Card</Card>);
    expect(container.firstChild).toHaveClass('border-black/20');
  });

  it('applies active highlight style when active is true', () => {
    const { container } = render(<Card active>Active Card</Card>);
    expect(container.firstChild).toHaveClass('border-[#1E6FD9]');
  });
});

