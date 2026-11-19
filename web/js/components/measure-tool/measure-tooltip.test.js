/* eslint-disable react/jsx-props-no-spreading */
import '@testing-library/jest-dom';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { LineString as OlLineString, Polygon as OlGeomPolygon } from 'ol/geom';
import MeasureTooltip from './measure-tooltip';
import { registerProjections } from '../../fixtures';

beforeEach(registerProjections);
afterEach(cleanup);

const GEO = 'EPSG:4326';
const makeLine = (coords) => new OlLineString(coords);
const makePoly = (coords) => new OlGeomPolygon([coords]);

const longLineCoords = [[-74, 40], [0, 51]];   // ~7,500 km
const smallPolyCoords = [[0, 0], [1, 0], [0, 1], [0, 0]];

const geographicProj = {
  selected: { crs: GEO, maxExtent: [-180, -90, 180, 90] },
};

function renderTooltip(overrides = {}) {
  const props = {
    active: true,
    crs: GEO,
    unitOfMeasure: 'km',
    geometry: makeLine(longLineCoords),
    onRemove: jest.fn(),
    proj: geographicProj,
    ...overrides,
  };
  const { container } = render(<MeasureTooltip {...props} />);
  return { container, props };
}

const q = (container, sel) => container.querySelector(sel);

describe('MeasureTooltip', () => {
  describe('rendering', () => {
    it('renders a measurement for a LineString', () => {
      const { container } = renderTooltip();
      expect(q(container, '.tooltip-measure')).toBeInTheDocument();
    });

    it('renders a measurement for a Polygon', () => {
      const { container } = renderTooltip({ geometry: makePoly(smallPolyCoords) });
      expect(q(container, '.tooltip-measure')).toBeInTheDocument();
    });

    it('applies tooltip-active class when active is true', () => {
      const { container } = renderTooltip({ active: true });
      expect(q(container, '.tooltip-active')).toBeInTheDocument();
    });

    it('applies tooltip-static class when active is false', () => {
      const { container } = renderTooltip({ active: false });
      expect(q(container, '.tooltip-static')).toBeInTheDocument();
    });

    it('hides close button when active is true', () => {
      const { container } = renderTooltip({ active: true });
      expect(q(container, '.close-tooltip')).toBeNull();
    });

    it('shows close button when active is false', () => {
      const { container } = renderTooltip({ active: false });
      expect(q(container, '.close-tooltip')).toBeInTheDocument();
    });

    it('calls onRemove when close button is clicked', () => {
      const onRemove = jest.fn();
      const { container } = renderTooltip({ active: false, onRemove });
      fireEvent.click(q(container, '.close-tooltip'));
      expect(onRemove).toHaveBeenCalledTimes(1);
    });

    it('calls onRemove on touch end of close button', () => {
      const onRemove = jest.fn();
      const { container } = renderTooltip({ active: false, onRemove });
      fireEvent.touchEnd(q(container, '.close-tooltip'));
      expect(onRemove).toHaveBeenCalledTimes(1);
    });

    it('returns null for invalid geographic coordinates (NaN)', () => {
      const { container } = renderTooltip({ geometry: makeLine([[NaN, NaN], [NaN, NaN]]) });
      expect(q(container, '.tooltip-measure')).toBeNull();
    });

    it('renders "0.0" tooltip when geometry is null', () => {
      // null geometry → getMeasurementValue returns '0.0' → no NaN → renders
      const { container } = renderTooltip({ geometry: null });
      expect(q(container, '.tooltip-measure')).toBeInTheDocument();
    });

    it('shows close button when active prop is omitted (undefined is falsy)', () => {
      // defaultProps declares active=true but React 18 function components may not apply it;
      // this test documents the actual runtime behaviour: omitting active shows the close button
      const { container } = render(
        <MeasureTooltip
          crs={GEO}
          unitOfMeasure="km"
          geometry={makeLine(longLineCoords)}
          onRemove={jest.fn()}
          proj={geographicProj}
        />,
      );
      expect(q(container, '.close-tooltip')).toBeInTheDocument();
    });
  });

  describe('distance formatting – km', () => {
    it('shows distance in km for a long line', () => {
      const { container } = renderTooltip({ unitOfMeasure: 'km', geometry: makeLine(longLineCoords) });
      expect(q(container, '.tooltip-measure span').innerHTML).toMatch(/km/);
    });

    it('shows distance in m for a line under 100 m', () => {
      const { container } = renderTooltip({
        unitOfMeasure: 'km',
        geometry: makeLine([[0, 0], [0.000009, 0]]),
      });
      const html = q(container, '.tooltip-measure span').innerHTML;
      expect(html).toMatch(/\d+ m$/);
      expect(html).not.toMatch(/km/);
    });
  });

  describe('distance formatting – mi', () => {
    it('shows distance in mi for a long line', () => {
      const { container } = renderTooltip({ unitOfMeasure: 'mi', geometry: makeLine(longLineCoords) });
      expect(q(container, '.tooltip-measure span').innerHTML).toMatch(/mi/);
    });

    it('shows distance in ft for a line under 0.25 miles', () => {
      const { container } = renderTooltip({
        unitOfMeasure: 'mi',
        geometry: makeLine([[0, 0], [0.001, 0]]),
      });
      expect(q(container, '.tooltip-measure span').innerHTML).toMatch(/ft/);
    });
  });

  describe('area formatting – km', () => {
    it('shows area in km² for a large polygon', () => {
      const { container } = renderTooltip({
        unitOfMeasure: 'km',
        geometry: makePoly([[0, 0], [10, 0], [0, 10], [0, 0]]),
      });
      expect(q(container, '.tooltip-measure span').innerHTML).toMatch(/km/);
    });

    it('shows area in m² for a tiny polygon', () => {
      const { container } = renderTooltip({
        unitOfMeasure: 'km',
        geometry: makePoly([[0, 0], [0.0001, 0], [0, 0.0001], [0, 0]]),
      });
      const html = q(container, '.tooltip-measure span').innerHTML;
      expect(html).toMatch(/m/);
      expect(html).not.toMatch(/km/);
    });
  });

  describe('area formatting – mi', () => {
    it('shows area in mi² for a large polygon', () => {
      const { container } = renderTooltip({
        unitOfMeasure: 'mi',
        geometry: makePoly([[0, 0], [10, 0], [0, 10], [0, 0]]),
      });
      expect(q(container, '.tooltip-measure span').innerHTML).toMatch(/mi/);
    });

    it('shows area in ft² for a tiny polygon', () => {
      const { container } = renderTooltip({
        unitOfMeasure: 'mi',
        geometry: makePoly([[0, 0], [0.001, 0], [0, 0.001], [0, 0]]),
      });
      expect(q(container, '.tooltip-measure span').innerHTML).toMatch(/ft/);
    });
  });

  describe('polar projection validity', () => {
    const arcticProj = {
      selected: {
        crs: 'EPSG:3413',
        maxExtent: [-9000000, -9000000, 9000000, 9000000],
      },
    };

    it('does not throw for polar coordinates within extent', () => {
      // Small in-bounds arctic coords — just asserts no crash
      expect(() => {
        renderTooltip({
          crs: 'EPSG:3413',
          geometry: makeLine([[0, 0], [100000, 100000]]),
          proj: arcticProj,
        });
      }).not.toThrow();
    });

    it('returns null when polar coordinates are outside extent', () => {
      const { container } = renderTooltip({
        crs: 'EPSG:3413',
        geometry: makeLine([[99000000, 99000000], [99000001, 99000000]]),
        proj: arcticProj,
      });
      expect(q(container, '.tooltip-measure')).toBeNull();
    });
  });
});
