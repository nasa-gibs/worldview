import {
  animateCoordinates,
  areCoordinatesWithinExtent,
  getCoordinatesMarker,
  getLocalStorageCollapseState,
  isLocationSearchFeatureEnabled,
  mapLocationToLocationSearchState,
  serializeCoordinatesWrapper,
  setLocalStorageCollapseState,
} from './util';

jest.mock('../../util/local-storage', () => ({
  keys: { LOCATION_SEARCH_COLLAPSED: 'locationSearchCollapsed' },
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

jest.mock('../../map/util', () => ({
  fly: jest.fn(),
}));

jest.mock('ol/proj', () => ({
  transform: jest.fn((coords) => coords),
}));

jest.mock('ol/extent', () => ({
  containsCoordinate: jest.fn(),
}));

jest.mock('ol/Overlay', () => jest.fn().mockImplementation((opts) => ({ ...opts })));

jest.mock('react-dom/client', () => ({
  createRoot: jest.fn(() => ({
    render: jest.fn(),
    unmount: jest.fn(),
  })),
}));

jest.mock('../../components/location-search/location-marker', () => 'LocationMarker');

jest.mock('../map/constants', () => ({
  CRS: { GEOGRAPHIC: 'EPSG:4326' },
  FULL_MAP_EXTENT: [-180, -90, 180, 90],
}));

import safeLocalStorage from '../../util/local-storage';
import { fly } from '../../map/util';
import { transform } from 'ol/proj';
import { containsCoordinate } from 'ol/extent';
import { CRS, FULL_MAP_EXTENT } from '../map/constants';

afterEach(() => {
  jest.clearAllMocks();
  transform.mockImplementation((coords) => coords);
});

describe('getLocalStorageCollapseState', () => {
  test('returns true when localStorage value is collapsed [util-get-local-storage-collapse-state-true]', () => {
    safeLocalStorage.getItem.mockReturnValue('collapsed');
    expect(getLocalStorageCollapseState()).toBe(true);
  });

  test('returns false when localStorage value is expanded [util-get-local-storage-collapse-state-false]', () => {
    safeLocalStorage.getItem.mockReturnValue('expanded');
    expect(getLocalStorageCollapseState()).toBe(false);
  });

  test('returns false when localStorage value is null [util-get-local-storage-collapse-state-null]', () => {
    safeLocalStorage.getItem.mockReturnValue(null);
    expect(getLocalStorageCollapseState()).toBe(false);
  });
});

describe('setLocalStorageCollapseState', () => {
  test('calls safeLocalStorage.setItem with collapsed [util-set-local-storage-collapse-state-collapsed]', () => {
    setLocalStorageCollapseState('collapsed');
    expect(safeLocalStorage.setItem).toHaveBeenCalledWith('locationSearchCollapsed', 'collapsed');
  });

  test('calls safeLocalStorage.setItem with expanded [util-set-local-storage-collapse-state-expanded]', () => {
    setLocalStorageCollapseState('expanded');
    expect(safeLocalStorage.setItem).toHaveBeenCalledWith('locationSearchCollapsed', 'expanded');
  });
});

describe('isLocationSearchFeatureEnabled', () => {
  test('returns true when locationSearch feature and url are present [util-is-location-search-enabled-true]', () => {
    const config = { features: { locationSearch: { url: 'https://example.com/' } } };
    expect(isLocationSearchFeatureEnabled(config)).toBe(true);
  });

  test('returns false when locationSearch feature is missing [util-is-location-search-enabled-no-feature]', () => {
    const config = { features: {} };
    expect(isLocationSearchFeatureEnabled(config)).toBe(false);
  });

  test('returns false when locationSearch url is missing [util-is-location-search-enabled-no-url]', () => {
    const config = { features: { locationSearch: {} } };
    expect(isLocationSearchFeatureEnabled(config)).toBe(false);
  });

  test('returns false when locationSearch url is empty string [util-is-location-search-enabled-empty-url]', () => {
    const config = { features: { locationSearch: { url: '' } } };
    expect(isLocationSearchFeatureEnabled(config)).toBe(false);
  });
});

describe('animateCoordinates', () => {
  const map = {};
  const zoom = 5;

  test('calls fly with untransformed coordinates when proj is geographic [util-animate-coordinates-geographic]', () => {
    const proj = { selected: { crs: CRS.GEOGRAPHIC } };
    animateCoordinates(map, proj, [-74, 40], zoom, false);
    expect(fly).toHaveBeenCalledWith(map, proj, [-74, 40], false, zoom);
  });

  test('calls transform and fly when proj is not geographic [util-animate-coordinates-non-geographic]', () => {
    const proj = { selected: { crs: 'EPSG:3413' } };
    transform.mockReturnValue([-300000, 500000]);
    animateCoordinates(map, proj, [-74, 40], zoom, false);
    expect(transform).toHaveBeenCalledWith([-74, 40], CRS.GEOGRAPHIC, 'EPSG:3413');
    expect(fly).toHaveBeenCalledWith(map, proj, [-300000, 500000], false, zoom);
  });

  test('passes isKioskModeActive true to fly [util-animate-coordinates-kiosk-mode]', () => {
    const proj = { selected: { crs: CRS.GEOGRAPHIC } };
    animateCoordinates(map, proj, [10, 20], zoom, true);
    expect(fly).toHaveBeenCalledWith(map, proj, [10, 20], true, zoom);
  });
});

describe('areCoordinatesWithinExtent', () => {
  test('uses FULL_MAP_EXTENT and raw coordinates for geographic CRS [util-are-coordinates-within-extent-geographic]', () => {
    const proj = { selected: { crs: CRS.GEOGRAPHIC, maxExtent: [-180, -90, 180, 90] } };
    containsCoordinate.mockReturnValue(true);
    const result = areCoordinatesWithinExtent(proj, [-74, 40]);
    expect(containsCoordinate).toHaveBeenCalledWith(FULL_MAP_EXTENT, [-74, 40]);
    expect(result).toBe(true);
  });

  test('uses maxExtent and transforms coordinates for non-geographic CRS [util-are-coordinates-within-extent-non-geographic]', () => {
    const maxExtent = [-4000000, -4000000, 4000000, 4000000];
    const proj = { selected: { crs: 'EPSG:3413', maxExtent } };
    transform.mockReturnValue([-300000, 500000]);
    containsCoordinate.mockReturnValue(false);
    const result = areCoordinatesWithinExtent(proj, [-74, 40]);
    expect(transform).toHaveBeenCalledWith([-74, 40], CRS.GEOGRAPHIC, 'EPSG:3413');
    expect(containsCoordinate).toHaveBeenCalledWith(maxExtent, [-300000, 500000]);
    expect(result).toBe(false);
  });

  test('returns false when coordinate is outside extent [util-are-coordinates-within-extent-false]', () => {
    const proj = { selected: { crs: CRS.GEOGRAPHIC, maxExtent: [-180, -90, 180, 90] } };
    containsCoordinate.mockReturnValue(false);
    expect(areCoordinatesWithinExtent(proj, [200, 100])).toBe(false);
  });
});

describe('serializeCoordinatesWrapper', () => {
  const geographicProj = {
    selected: { crs: CRS.GEOGRAPHIC, maxExtent: [-180, -90, 180, 90] },
  };

  const stateWithMap = (selected = true) => ({
    map: { ui: { selected } },
    proj: geographicProj,
  });

  test('returns joined coordinate string for valid single coordinate in array [util-serialize-coordinates-wrapper-single]', () => {
    containsCoordinate.mockReturnValue(true);
    const result = serializeCoordinatesWrapper(
      [{ longitude: -74, latitude: 40 }],
      stateWithMap(),
    );
    expect(result).toBe('-74,40');
  });

  test('returns undefined when map.ui.selected is falsy [util-serialize-coordinates-wrapper-no-map]', () => {
    const result = serializeCoordinatesWrapper(
      [{ longitude: -74, latitude: 40 }],
      stateWithMap(false),
    );
    expect(result).toBeUndefined();
  });

  test('returns undefined when coordinate is outside extent [util-serialize-coordinates-wrapper-outside-extent]', () => {
    containsCoordinate.mockReturnValue(false);
    const result = serializeCoordinatesWrapper(
      [{ longitude: -74, latitude: 40 }],
      stateWithMap(),
    );
    expect(result).toBeUndefined();
  });

  test('returns joined string for valid array of coordinates [util-serialize-coordinates-wrapper-array]', () => {
    containsCoordinate.mockReturnValue(true);
    const result = serializeCoordinatesWrapper(
      [{ longitude: -74, latitude: 40 }, { longitude: -118, latitude: 34 }],
      stateWithMap(),
    );
    expect(result).toBe('-74,40+-118,34');
  });

  test('filters out invalid coordinates from array [util-serialize-coordinates-wrapper-array-filter]', () => {
    containsCoordinate
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(false);
    const result = serializeCoordinatesWrapper(
      [{ longitude: -74, latitude: 40 }, { longitude: 200, latitude: 100 }],
      stateWithMap(),
    );
    expect(result).toBe('-74,40');
  });

  test('returns undefined for empty array of coordinates [util-serialize-coordinates-wrapper-empty-array]', () => {
    const result = serializeCoordinatesWrapper([], stateWithMap());
    expect(result).toBeUndefined();
  });
});

describe('mapLocationToLocationSearchState', () => {
  const baseState = {
    screenSize: { isMobileDevice: false },
  };
  const baseStoreFromLocation = {
    locationSearch: { coordinates: [], isExpanded: true },
  };

  beforeEach(() => {
    safeLocalStorage.getItem.mockReturnValue(null);
  });

  test('parses single coordinate from s parameter [util-map-location-to-state-single]', () => {
    const result = mapLocationToLocationSearchState(
      { s: '-74,40' },
      baseStoreFromLocation,
      baseState,
    );
    expect(result.locationSearch.coordinates).toHaveLength(1);
    expect(result.locationSearch.coordinates[0].longitude).toBe(-74);
    expect(result.locationSearch.coordinates[0].latitude).toBe(40);
  });

  test('parses multiple coordinates from s parameter separated by + [util-map-location-to-state-multiple]', () => {
    const result = mapLocationToLocationSearchState(
      { s: '-74,40+-118,34' },
      baseStoreFromLocation,
      baseState,
    );
    expect(result.locationSearch.coordinates).toHaveLength(2);
    expect(result.locationSearch.coordinates[0].longitude).toBe(-74);
    expect(result.locationSearch.coordinates[1].longitude).toBe(-118);
  });

  test('returns empty coordinates array when s parameter is absent [util-map-location-to-state-no-s]', () => {
    const result = mapLocationToLocationSearchState(
      {},
      baseStoreFromLocation,
      baseState,
    );
    expect(result.locationSearch.coordinates).toEqual([]);
  });

  test('sets isExpanded to true when not mobile and not collapsed in localStorage [util-map-location-to-state-expanded]', () => {
    safeLocalStorage.getItem.mockReturnValue(null);
    const result = mapLocationToLocationSearchState(
      { s: '-74,40' },
      baseStoreFromLocation,
      { screenSize: { isMobileDevice: false } },
    );
    expect(result.locationSearch.isExpanded).toBe(true);
  });

  test('sets isExpanded to false when isMobileDevice is true [util-map-location-to-state-mobile]', () => {
    const result = mapLocationToLocationSearchState(
      { s: '-74,40' },
      baseStoreFromLocation,
      { screenSize: { isMobileDevice: true } },
    );
    expect(result.locationSearch.isExpanded).toBe(false);
  });

  test('sets isExpanded to false when localStorage is collapsed [util-map-location-to-state-collapsed]', () => {
    safeLocalStorage.getItem.mockReturnValue('collapsed');
    const result = mapLocationToLocationSearchState(
      { s: '-74,40' },
      baseStoreFromLocation,
      { screenSize: { isMobileDevice: false } },
    );
    expect(result.locationSearch.isExpanded).toBe(false);
  });

  test('each parsed coordinate has an id property [util-map-location-to-state-coordinate-id]', () => {
    const result = mapLocationToLocationSearchState(
      { s: '-74,40' },
      baseStoreFromLocation,
      baseState,
    );
    expect(result.locationSearch.coordinates[0]).toHaveProperty('id');
  });
});

describe('getCoordinatesMarker', () => {
  const coordinatesObject = { id: 1234, longitude: -74, latitude: 40 };
  const results = { address: { LongLabel: 'New York, NY' } };
  const removeMarker = jest.fn();

  test('returns a marker object for geographic projection [util-get-coordinates-marker-geographic]', () => {
    const proj = { selected: { crs: CRS.GEOGRAPHIC } };
    const marker = getCoordinatesMarker(
      proj, coordinatesObject, results, removeMarker, false, false,
    );
    expect(marker).toBeDefined();
  });

  test('calls transform for non-geographic projection [util-get-coordinates-marker-non-geographic]', () => {
    const proj = { selected: { crs: 'EPSG:3413' } };
    transform.mockReturnValue([-300000, 500000]);
    getCoordinatesMarker(proj, coordinatesObject, results, removeMarker, false, false);
    expect(transform).toHaveBeenCalledWith([-74, 40], CRS.GEOGRAPHIC, 'EPSG:3413');
  });

  test('returns marker with correct id [util-get-coordinates-marker-id]', () => {
    const proj = { selected: { crs: CRS.GEOGRAPHIC } };
    const marker = getCoordinatesMarker(
      proj, coordinatesObject, results, removeMarker, false, false,
    );
    expect(marker.id).toBe(coordinatesObject.id);
  });

  test('passes isMobile and dialogVisible to pin props [util-get-coordinates-marker-props]', () => {
    const { createRoot } = require('react-dom/client');
    const proj = { selected: { crs: CRS.GEOGRAPHIC } };
    getCoordinatesMarker(proj, coordinatesObject, results, removeMarker, true, true);
    expect(createRoot).toHaveBeenCalled();
  });
});
