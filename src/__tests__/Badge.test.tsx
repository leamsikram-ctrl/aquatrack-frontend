import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Badge } from '../components/atoms/Badge';

describe('Badge Component', () => {
  it('renders default blue variant correctly', () => {
    const { container } = render(<Badge>Active</Badge>);
    expect(container.textContent).toBe('Active');
    expect(container.firstChild).toHaveClass('bg-[#1E6FD9]');
  });

  it('aliases black variant to outline for 2-variant design rule', () => {
    const { container } = render(<Badge variant="black">Offline</Badge>);
    expect(container.textContent).toBe('Offline');
    expect(container.firstChild).toHaveClass('bg-white');
    expect(container.firstChild).toHaveClass('text-black');
  });

  it('renders outline variant correctly', () => {
    const { container } = render(<Badge variant="outline">Pending</Badge>);
    expect(container.textContent).toBe('Pending');
    expect(container.firstChild).toHaveClass('bg-white');
  });
});

