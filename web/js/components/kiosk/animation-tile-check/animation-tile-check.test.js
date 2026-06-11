import { render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useSelector } from 'react-redux';
import AnimationTileCheck from './animation-tile-check';

const mockDateRangeTileCheck = jest.fn((props) => (
  <div
    data-testid="date-range-tile-check"
    data-frame-dates={JSON.stringify(props.frameDates)}
    data-active-layers={JSON.stringify(props.activeLayers)}
    data-config={JSON.stringify(props.config)}
    data-proj={JSON.stringify(props.proj)}
    data-zoom={props.zoom}
  />
));

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
  shallowEqual: jest.fn(),
}));

jest.mock('./date-range-tile-check', () => (props) => mockDateRangeTileCheck(props));

jest.mock('../../../modules/layers/selectors', () => ({
  getActiveLayers: jest.fn((state) => state.activeLayers),
}));

const mockState = {
  config: { kioskMode: true },
  proj: { selected: 'EPSG:4326' },
  map: { ui: { selected: { getView: () => ({ getZoom: () => 3.7 }) } } },
  compare: { activeString: 'compare-1' },
  activeLayers: ['layer-1', 'layer-2'],
};

describe('AnimationTileCheck', () => {
  beforeEach(() => {
    useSelector.mockReset();
    mockDateRangeTileCheck.mockClear();
    useSelector.mockImplementation((selector) => selector(mockState));
  });

  it('renders DateRangeTileCheck with empty frameDates when animation is not playing', () => {
    render(
      <AnimationTileCheck
        startDate={new Date('2024-01-01')}
        endDate={new Date('2024-01-03')}
        interval="day"
        delta={1}
        isPlaying={false}
      />,
    );

    expect(mockDateRangeTileCheck).toHaveBeenCalled();
    const lastCallArgs = mockDateRangeTileCheck.mock.calls.slice(-1)[0][0];
    expect(lastCallArgs).toEqual({
      frameDates: [],
      activeLayers: mockState.activeLayers,
      config: mockState.config,
      proj: 'EPSG:4326',
      zoom: 3,
    });
  });

  it('builds frameDates from startDate to endDate when animation is playing', async () => {
    render(
      <AnimationTileCheck
        startDate={new Date('2024-01-01')}
        endDate={new Date('2024-01-03')}
        interval="day"
        delta={1}
        isPlaying
      />,
    );

    await waitFor(() => {
      expect(mockDateRangeTileCheck).toHaveBeenCalled();
      const callArgs = mockDateRangeTileCheck.mock.calls.slice(-1)[0][0];
      const frameDates = callArgs.frameDates.map((d) => new Date(d).toISOString());
      expect(frameDates).toEqual([
        new Date('2024-01-01').toISOString(),
        new Date('2024-01-02').toISOString(),
        new Date('2024-01-03').toISOString(),
      ]);
      expect(callArgs).toEqual({
        frameDates: [
          new Date('2024-01-01'),
          new Date('2024-01-02'),
          new Date('2024-01-03'),
        ],
        activeLayers: mockState.activeLayers,
        config: mockState.config,
        proj: 'EPSG:4326',
        zoom: 3,
      });
    });
  });
});
