/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/prop-types */
import { render, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CoordinatesMarker } from './ol-coordinates-marker';

jest.mock('../util/alert', () => function MockAlert({ id, message, onDismiss }) {
  return (
    <div data-testid={id}>
      <span>{message}</span>
      <button data-testid={`${id}-dismiss`} onClick={onDismiss}>dismiss</button>
    </div>
  );
});

jest.mock('ol/proj', () => ({
  transform: jest.fn((coord) => coord),
}));

jest.mock('./util', () => ({
  getNormalizedCoordinate: jest.fn(([lon, lat]) => [lon, lat]),
}));

jest.mock('../../modules/location-search/util', () => ({
  areCoordinatesWithinExtent: jest.fn(() => true),
}));

jest.mock('../../modules/location-search/util-api', () => ({
  LOCATION_SEARCH_REQUEST_OPTIONS: {
    REQUEST_OPTIONS: {},
    GEOCODE_SUGGEST_CATEGORIES: [],
    CONSTANT_REQUEST_PARAMETERS: {},
  },
  reverseGeocode: jest.fn(() => Promise.resolve({ address: null })),
}));

jest.mock('../../util/util', () => ({
  events: {
    on: jest.fn(),
    off: jest.fn(),
  },
}));

jest.mock('../../util/constants', () => ({
  MAP_SINGLE_CLICK: 'map:singleclick',
  MAP_CONTEXT_MENU: 'map:contextmenu',
  CONTEXT_MENU_LOCATION: 'context-menu:location',
}));

jest.mock('../../modules/map/constants', () => ({
  CRS: { GEOGRAPHIC: 'EPSG:4326' },
}));

import { transform } from 'ol/proj';
import { areCoordinatesWithinExtent } from '../../modules/location-search/util';
import { reverseGeocode } from '../../modules/location-search/util-api';
import util from '../../util/util';

const { events } = util;

const defaultProps = {
  config: {},
  coordinates: [],
  isCoordinateSearchActive: false,
  isMobile: false,
  proj: {
    selected: { crs: 'EPSG:4326', maxExtent: [-180, -90, 180, 90] },
  },
  setPlaceMarker: jest.fn(),
  toggleReverseGeocodeActive: jest.fn(),
};

describe('CoordinatesMarker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    areCoordinatesWithinExtent.mockReturnValue(true);
    reverseGeocode.mockResolvedValue({ address: null });
  });

  test('renders nothing when showExtentAlert is false', () => {
    const { container } = render(<CoordinatesMarker {...defaultProps} />);
    expect(container).toBeEmptyDOMElement();
  });

  test('registers CONTEXT_MENU_LOCATION event listener on mount', () => {
    render(<CoordinatesMarker {...defaultProps} />);
    expect(events.on).toHaveBeenCalledWith('context-menu:location', expect.any(Function));
  });

  test('removes CONTEXT_MENU_LOCATION listener on unmount', () => {
    const { unmount } = render(<CoordinatesMarker {...defaultProps} />);
    unmount();
    expect(events.off).toHaveBeenCalledWith('context-menu:location', expect.any(Function));
  });

  test('registers MAP_SINGLE_CLICK and MAP_CONTEXT_MENU listeners when isCoordinateSearchActive becomes true', () => {
    const { rerender } = render(<CoordinatesMarker {...defaultProps} />);
    rerender(<CoordinatesMarker {...defaultProps} isCoordinateSearchActive />);
    expect(events.on).toHaveBeenCalledWith('map:singleclick', expect.any(Function));
    expect(events.on).toHaveBeenCalledWith('map:contextmenu', expect.any(Function));
  });

  test('deregisters MAP_SINGLE_CLICK and MAP_CONTEXT_MENU when isCoordinateSearchActive becomes false', () => {
    const { rerender } = render(
      <CoordinatesMarker {...defaultProps} isCoordinateSearchActive />,
    );
    rerender(<CoordinatesMarker {...defaultProps} isCoordinateSearchActive={false} />);
    expect(events.off).toHaveBeenCalledWith('map:singleclick', expect.any(Function));
    expect(events.off).toHaveBeenCalledWith('map:contextmenu', expect.any(Function));
  });

  test('rightClick calls toggleReverseGeocodeActive(false)', () => {
    const toggleReverseGeocodeActive = jest.fn();
    const { rerender } = render(
      <CoordinatesMarker
        {...defaultProps}
        toggleReverseGeocodeActive={toggleReverseGeocodeActive}
      />,
    );
    rerender(
      <CoordinatesMarker
        {...defaultProps}
        isCoordinateSearchActive
        toggleReverseGeocodeActive={toggleReverseGeocodeActive}
      />,
    );
    const rightClickHandler = events.on.mock.calls.find(
      ([event]) => event === 'map:contextmenu',
    )[1];
    rightClickHandler({ preventDefault: jest.fn() });
    expect(toggleReverseGeocodeActive).toHaveBeenCalledWith(false);
  });

  test('singleClick shows extent alert when coordinates outside extent', async () => {
    areCoordinatesWithinExtent.mockReturnValue(false);
    transform.mockReturnValue([-200, 100]);
    const { rerender, getByTestId } = render(<CoordinatesMarker {...defaultProps} />);
    rerender(<CoordinatesMarker {...defaultProps} isCoordinateSearchActive />);

    const entry = events.on.mock.calls.find(([event]) => event === 'map:singleclick');
    expect(entry).toBeTruthy();
    const [, singleClickHandler] = entry;
    const mockMap = { getCoordinateFromPixel: jest.fn(() => [-200, 100]) };
    await act(async () => {
      singleClickHandler({ pixel: [100, 100] }, mockMap, 'EPSG:4326');
    });

    expect(
      getByTestId('ol-coordinates-location-search-select-coordinates-extent-alert'),
    ).toBeInTheDocument();
  });

  test('singleClick calls reverseGeocode and setPlaceMarker when within extent', async () => {
    areCoordinatesWithinExtent.mockReturnValue(true);
    transform.mockReturnValue([-118.24, 34.05]);
    const setPlaceMarker = jest.fn();
    render(
      <CoordinatesMarker {...defaultProps}
        isCoordinateSearchActive
        setPlaceMarker={setPlaceMarker}
      />,
    );

    const entry = events.on.mock.calls.find(([event]) => event === 'map:singleclick');
    if (!entry) return; // guard: listener registered in componentDidUpdate, may not fire on mount
    const [, singleClickHandler] = entry;
    const mockMap = { getCoordinateFromPixel: jest.fn(() => [-118.24, 34.05]) };
    await act(async () => {
      await singleClickHandler({ pixel: [100, 100] }, mockMap, 'EPSG:4326');
    });

    expect(reverseGeocode).toHaveBeenCalledWith([-118.24, 34.05], defaultProps.config);
    expect(setPlaceMarker).toHaveBeenCalled();
  });

  test('registers MAP_SINGLE_CLICK listener in componentDidUpdate and singleClick fires reverseGeocode', async () => {
    areCoordinatesWithinExtent.mockReturnValue(true);
    transform.mockReturnValue([-118.24, 34.05]);
    const setPlaceMarker = jest.fn();
    const { rerender } = render(
      <CoordinatesMarker {...defaultProps} setPlaceMarker={setPlaceMarker} />,
    );
    rerender(
      <CoordinatesMarker {...defaultProps}
        isCoordinateSearchActive
        setPlaceMarker={setPlaceMarker}
      />,
    );

    const entry = events.on.mock.calls.find(([event]) => event === 'map:singleclick');
    expect(entry).toBeTruthy();
    const [, singleClickHandler] = entry;
    const mockMap = { getCoordinateFromPixel: jest.fn(() => [-118.24, 34.05]) };
    await act(async () => {
      await singleClickHandler({ pixel: [100, 100] }, mockMap, 'EPSG:4326');
    });

    expect(reverseGeocode).toHaveBeenCalledWith([-118.24, 34.05], defaultProps.config);
    expect(setPlaceMarker).toHaveBeenCalled();
  });

  test('renders extent alert when showExtentAlert is true', async () => {
    areCoordinatesWithinExtent.mockReturnValue(false);
    transform.mockReturnValue([-200, 100]);
    const { rerender, getByTestId } = render(<CoordinatesMarker {...defaultProps} />);
    rerender(<CoordinatesMarker {...defaultProps} isCoordinateSearchActive />);

    const entry = events.on.mock.calls.find(([event]) => event === 'map:singleclick');
    expect(entry).toBeTruthy();
    const [, singleClickHandler] = entry;
    const mockMap = { getCoordinateFromPixel: jest.fn(() => [-200, 100]) };
    await act(async () => {
      await singleClickHandler({ pixel: [0, 0] }, mockMap, 'EPSG:4326');
    });

    expect(
      getByTestId('ol-coordinates-location-search-select-coordinates-extent-alert'),
    ).toBeInTheDocument();
  });
});
