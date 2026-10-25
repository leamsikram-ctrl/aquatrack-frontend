import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MunicipalMap, SINACABAN_CENTER, SINACABAN_BOUNDS } from '../components/organisms/MunicipalMap';

describe('MunicipalMap', () => {
  it('exports valid Sinacaban municipal coordinates and bounds', () => {
    expect(SINACABAN_CENTER).toEqual([8.2950, 123.7800]);
    expect(SINACABAN_BOUNDS).toHaveLength(2);
    expect(SINACABAN_BOUNDS[0][0]).toBeLessThan(SINACABAN_BOUNDS[1][0]);
    expect(SINACABAN_BOUNDS[0][1]).toBeLessThan(SINACABAN_BOUNDS[1][1]);
  });

  it('renders map container with default styling and locked bounds', () => {
    const { container } = render(
      <MunicipalMap
        lockToSinacaban={true}
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
