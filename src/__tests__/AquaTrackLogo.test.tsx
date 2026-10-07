import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AquaTrackLogo } from '../components/atoms/AquaTrackLogo';

describe('AquaTrackLogo Component', () => {
  it('renders mark variant with svg', () => {
    const { container } = render(<AquaTrackLogo size={24} variant="mark" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('width', '24');
    expect(svg).toHaveAttribute('height', '24');
  });

  it('renders full variant with brand text', () => {
    render(<AquaTrackLogo variant="full" />);
    expect(screen.getByText('AquaTrack')).toBeInTheDocument();
    expect(screen.getByText(/Sinacaban Water Works/i)).toBeInTheDocument();
  });

  it('hides subtitle when showSubtitle is false', () => {
    render(<AquaTrackLogo variant="full" showSubtitle={false} />);
    expect(screen.getByText('AquaTrack')).toBeInTheDocument();
    expect(screen.queryByText(/Sinacaban Water Works/i)).not.toBeInTheDocument();
  });
});

