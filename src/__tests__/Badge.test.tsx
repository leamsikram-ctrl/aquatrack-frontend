import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Badge } from '../components/atoms/Badge';

describe('Badge Component', () => {
  it('renders default blue variant correctly', () => {
    const { container } = render(<Badge>Active</Badge>);
    expect(container.textContent).toBe('Active');
    expect(container.firstChild).toHaveClass('bg-brand-blue');
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

  it('renders urgency variants (high, medium, low) using tokens', () => {
    const { container: high } = render(<Badge variant="high">High Urgency</Badge>);
    expect(high.firstChild).toHaveClass('text-urgency-high');

    const { container: med } = render(<Badge variant="medium">Medium Urgency</Badge>);
    expect(med.firstChild).toHaveClass('text-urgency-medium');

    const { container: low } = render(<Badge variant="low">Low Urgency</Badge>);
    expect(low.firstChild).toHaveClass('text-urgency-low');
  });

  it('renders request status variants (submitted, assigned, in-progress, resolved, cancelled)', () => {
    const { container: sub } = render(<Badge variant="submitted">Submitted</Badge>);
    expect(sub.firstChild).toHaveClass('text-brand-blue');

    const { container: asg } = render(<Badge variant="assigned">Assigned</Badge>);
    expect(asg.firstChild).toHaveClass('text-assigned');

    const { container: inp } = render(<Badge variant="in-progress">In Progress</Badge>);
    expect(inp.firstChild).toHaveClass('bg-brand-blue');

    const { container: res } = render(<Badge variant="resolved">Resolved</Badge>);
    expect(res.firstChild).toHaveClass('text-urgency-low');

    const { container: can } = render(<Badge variant="cancelled">Cancelled</Badge>);
    expect(can.firstChild).toHaveClass('text-slate-600');
  });

  it('renders account status variants (pending, active, declined, inactive)', () => {
    const { container: pen } = render(<Badge variant="pending">Pending</Badge>);
    expect(pen.firstChild).toHaveClass('text-amber-800');

    const { container: act } = render(<Badge variant="active">Active</Badge>);
    expect(act.firstChild).toHaveClass('bg-emerald-600');

    const { container: dec } = render(<Badge variant="declined">Declined</Badge>);
    expect(dec.firstChild).toHaveClass('text-urgency-high');

    const { container: ina } = render(<Badge variant="inactive">Inactive</Badge>);
    expect(ina.firstChild).toHaveClass('text-slate-700');
  });
});

