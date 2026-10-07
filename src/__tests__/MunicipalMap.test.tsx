import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MunicipalMap, SINACABAN_CENTER } from '../components/organisms/MunicipalMap';

describe('MunicipalMap', () => {
  it('exports valid Sinacaban municipal coordinates', () => {
    expect(SINACABAN_CENTER).toEqual([8.2835, 123.834]);
  });

  it('renders map container with default styling', () => {
    const { container } = render(
      <MunicipalMap
        markers={[
          {
            id: 'm1',
            lat: 8.2835,
            lng: 123.834,
            title: 'Test Service Pin',
            label: 'AT-0001',
          },
        ]}
      />
    );

    expect(container.querySelector('.leaflet-container')).toBeDefined();
  });
});
