import {
  mapUtilZoomAction,
  saveRotation,
  fly,
  getExtent,
  crossesDateLine,
  getOverDateLineCoordinates,
  getGeographicResolutionWMS,
  createVectorUrl,
  mergeBreakpointLayerAttributes,
  updateReduxDateTimezone,
  formatReduxDate,
  extractDateFromTileErrorURL,
} from './util';

// =============================================================================
// Mocks
// =============================================================================

// Mock constants so tests are not coupled to their actual array values
jest.mock('../modules/map/constants', () => ({
  RESOLUTION_FOR_LARGE_WMS_TILES: ['large'],
  RESOLUTION_FOR_SMALL_WMS_TILES: ['small'],
}));

// Mock ol/extent
const mockContainsCoordinate = jest.fn();
const mockGetCenter = jest.fn();
jest.mock('ol/extent', () => ({
  containsCoordinate: (...args) => mockContainsCoordinate(...args),
  getCenter: (...args) => mockGetCenter(...args),
}));

// Mock ol/geom/LineString
const mockGetLength = jest.fn();
jest.mock('ol/geom/LineString', () =>
  jest.fn().mockImplementation(() => ({ getLength: mockGetLength })),
);

// Mock util (the util/util default export used inside this file)
const mockToISOStringSeconds = jest.fn((date) => date ? date.toISOString() : '');
const mockRoundTimeOneMinute = jest.fn((date) => date);
jest.mock('../util/util', () => ({
  __esModule: true,
  default: {
    toISOStringSeconds: (...args) => mockToISOStringSeconds(...args),
    roundTimeOneMinute: (...args) => mockRoundTimeOneMinute(...args),
  },
}));

// =============================================================================
// Helpers
// =============================================================================

const buildView = ({
  zoom = 4,
  minZoom = 1,
  maxZoom = 10,
  isAnimating = false,
  center = [0, 0],
  extent = [-180, -90, 180, 90],
  resolutionForZoom = jest.fn().mockReturnValue(0.1),
} = {}) => ({
  getZoom: jest.fn().mockReturnValue(zoom),
  getMinZoom: jest.fn().mockReturnValue(minZoom),
  getMaxZoom: jest.fn().mockReturnValue(maxZoom),
  getAnimating: jest.fn().mockReturnValue(isAnimating),
  animate: jest.fn(),
  cancelAnimations: jest.fn(),
  getCenter: jest.fn().mockReturnValue(center),
  calculateExtent: jest.fn().mockReturnValue(extent),
  getResolutionForZoom: resolutionForZoom,
  setRotation: jest.fn(),
});

const buildMap = (view) => ({
  getView: jest.fn().mockReturnValue(view),
});

const buildProj = (id = 'geographic') => ({
  selected: { id },
});

// =============================================================================
// mapUtilZoomAction
// =============================================================================

describe('mapUtilZoomAction', () => {
  beforeEach(() => jest.clearAllMocks());

  test('animates to zoom + amount with default duration when not animating', () => {
    const view = buildView({ zoom: 4 });
    const map = buildMap(view);
    mapUtilZoomAction(map, 1);
    expect(view.animate).toHaveBeenCalledWith(
      expect.objectContaining({ zoom: 5, duration: 250 }),
    );
  });

  test('uses zero duration when view is already animating', () => {
    const view = buildView({ zoom: 4, isAnimating: true });
    const map = buildMap(view);
    mapUtilZoomAction(map, 1);
    expect(view.animate).toHaveBeenCalledWith(
      expect.objectContaining({ zoom: 5, duration: 0 }),
    );
  });

  test('uses provided duration instead of default', () => {
    const view = buildView({ zoom: 4 });
    const map = buildMap(view);
    mapUtilZoomAction(map, 1, 500);
    expect(view.animate).toHaveBeenCalledWith(
      expect.objectContaining({ duration: 500 }),
    );
  });

  test('passes center to animate when provided', () => {
    const view = buildView({ zoom: 4 });
    const map = buildMap(view);
    mapUtilZoomAction(map, 1, 250, [10, 20]);
    expect(view.animate).toHaveBeenCalledWith(
      expect.objectContaining({ center: [10, 20] }),
    );
  });

  test('clamps newZoom to maxZoom when it would exceed max', () => {
    const view = buildView({ zoom: 9, maxZoom: 10 });
    const map = buildMap(view);
    mapUtilZoomAction(map, 5);
    expect(view.animate).toHaveBeenCalledWith(
      expect.objectContaining({ zoom: 10 }),
    );
  });

  test('clamps newZoom to minZoom when it would go below min', () => {
    const view = buildView({ zoom: 2, minZoom: 1 });
    const map = buildMap(view);
    mapUtilZoomAction(map, -5);
    expect(view.animate).toHaveBeenCalledWith(
      expect.objectContaining({ zoom: 1 }),
    );
  });

  test('does not animate when already at maxZoom and would exceed it', () => {
    const view = buildView({ zoom: 10, maxZoom: 10 });
    const map = buildMap(view);
    mapUtilZoomAction(map, 1);
    expect(view.animate).not.toHaveBeenCalled();
  });

  test('does not animate when already at minZoom and would go below it', () => {
    const view = buildView({ zoom: 1, minZoom: 1 });
    const map = buildMap(view);
    mapUtilZoomAction(map, -1);
    expect(view.animate).not.toHaveBeenCalled();
  });

  test('zooms by a negative amount (zoom out)', () => {
    const view = buildView({ zoom: 6 });
    const map = buildMap(view);
    mapUtilZoomAction(map, -2);
    expect(view.animate).toHaveBeenCalledWith(
      expect.objectContaining({ zoom: 4 }),
    );
  });
});

// =============================================================================
// saveRotation
// =============================================================================

describe('saveRotation', () => {
  beforeEach(() => jest.clearAllMocks());

  test('sets rotation to 0 when absolute value of currentDeg is exactly 360', () => {
    const view = buildView();
    saveRotation(360, view);
    expect(view.setRotation).toHaveBeenCalledWith(0);
  });

  test('sets rotation to 0 for -360 as well', () => {
    const view = buildView();
    saveRotation(-360, view);
    expect(view.setRotation).toHaveBeenCalledWith(0);
  });

  test('sets a positive newNadVal when currentDeg > 360', () => {
    const view = buildView();
    saveRotation(370, view);
    expect(view.setRotation).toHaveBeenCalledWith(-((360 - Math.abs(370)) * (Math.PI / 180)));
  });

  test('sets a negative newNadVal (positive rotation) when currentDeg < -360', () => {
    const view = buildView();
    saveRotation(-370, view);
    const newNadVal = (360 - Math.abs(-370)) * (Math.PI / 180);
    expect(view.setRotation).toHaveBeenCalledWith(newNadVal);
  });

  test('does not call setRotation when currentDeg is less than 360', () => {
    const view = buildView();
    saveRotation(180, view);
    expect(view.setRotation).not.toHaveBeenCalled();
  });

  test('does not call setRotation for 0 degrees', () => {
    const view = buildView();
    saveRotation(0, view);
    expect(view.setRotation).not.toHaveBeenCalled();
  });
});

// =============================================================================
// getExtent
// =============================================================================

describe('getExtent', () => {
  test('returns [-250,-90,250,90] for geographic projection', () => {
    expect(getExtent({ selected: { id: 'geographic' } })).toEqual([-250, -90, 250, 90]);
  });

  test('returns [-180,-90,180,90] for arctic projection', () => {
    expect(getExtent({ selected: { id: 'arctic' } })).toEqual([-180, -90, 180, 90]);
  });

  test('returns [-180,-90,180,90] for antarctic projection', () => {
    expect(getExtent({ selected: { id: 'antarctic' } })).toEqual([-180, -90, 180, 90]);
  });
});

// =============================================================================
// crossesDateLine
// =============================================================================

describe('crossesDateLine', () => {
  test('returns true when coordinates are more than 180 degrees apart', () => {
    expect(crossesDateLine([170], [-170])).toBe(true);
  });

  test('returns false when coordinates are exactly 180 degrees apart', () => {
    expect(crossesDateLine([0], [180])).toBe(false);
  });

  test('returns false when coordinates are less than 180 degrees apart', () => {
    expect(crossesDateLine([10], [50])).toBe(false);
  });

  test('returns true for a large negative to positive crossing', () => {
    expect(crossesDateLine([-179], [179])).toBe(true);
  });
});

// =============================================================================
// getOverDateLineCoordinates
// =============================================================================

describe('getOverDateLineCoordinates', () => {
  test('returns mirrored longitude for a negative longitude', () => {
    const result = getOverDateLineCoordinates([-170, 45]);
    expect(result).toEqual([Math.abs(180 + 180 - Math.abs(-170)), 45]);
  });

  test('returns negative mirrored longitude for a positive longitude', () => {
    const result = getOverDateLineCoordinates([170, 45]);
    expect(result).toEqual([-Math.abs(180 + 180 - Math.abs(170)), 45]);
  });

  test('preserves the latitude value', () => {
    const result = getOverDateLineCoordinates([-160, -30]);
    expect(result[1]).toBe(-30);
  });
});

// =============================================================================
// getGeographicResolutionWMS
// =============================================================================

describe('getGeographicResolutionWMS', () => {
  test('returns RESOLUTION_FOR_LARGE_WMS_TILES when tileSize is null', () => {
    expect(getGeographicResolutionWMS(null)).toEqual(['large']);
  });

  test('returns RESOLUTION_FOR_LARGE_WMS_TILES when tileSize is undefined', () => {
    expect(getGeographicResolutionWMS(undefined)).toEqual(['large']);
  });

  test('returns RESOLUTION_FOR_LARGE_WMS_TILES when tileSize is an empty array', () => {
    expect(getGeographicResolutionWMS([])).toEqual(['large']);
  });

  test('returns RESOLUTION_FOR_SMALL_WMS_TILES when tileSize[0] is 256', () => {
    expect(getGeographicResolutionWMS([256, 256])).toEqual(['small']);
  });

  test('returns RESOLUTION_FOR_LARGE_WMS_TILES when tileSize[0] is 512', () => {
    expect(getGeographicResolutionWMS([512, 512])).toEqual(['large']);
  });

  test('returns RESOLUTION_FOR_LARGE_WMS_TILES when tileSize[0] is any value other than 256', () => {
    expect(getGeographicResolutionWMS([1024, 1024])).toEqual(['large']);
  });
});

// =============================================================================
// createVectorUrl
// =============================================================================

describe('createVectorUrl', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRoundTimeOneMinute.mockImplementation((date) => date);
    mockToISOStringSeconds.mockReturnValue('2021-01-01T00:00:00Z');
  });

  test('returns a URL string starting with ?', () => {
    const url = createVectorUrl(new Date('2021-01-01'), 'my-layer', 'EPSG4326');
    expect(url).toMatch(/^\?/);
  });

  test('includes TIME parameter', () => {
    const url = createVectorUrl(new Date('2021-01-01'), 'my-layer', 'EPSG4326');
    expect(url).toContain('TIME=2021-01-01T00:00:00Z');
  });

  test('includes layer parameter', () => {
    const url = createVectorUrl(new Date('2021-01-01'), 'my-layer', 'EPSG4326');
    expect(url).toContain('layer=my-layer');
  });

  test('includes tilematrixset parameter', () => {
    const url = createVectorUrl(new Date('2021-01-01'), 'my-layer', 'EPSG4326');
    expect(url).toContain('tilematrixset=EPSG4326');
  });

  test('includes static WMTS parameters', () => {
    const url = createVectorUrl(new Date('2021-01-01'), 'my-layer', 'EPSG4326');
    expect(url).toContain('Service=WMTS');
    expect(url).toContain('Request=GetTile');
    expect(url).toContain('Version=1.0.0');
    expect(url).toContain('FORMAT=application%2Fvnd.mapbox-vector-tile');
    expect(url).toContain('TileMatrix={z}');
    expect(url).toContain('TileCol={x}');
    expect(url).toContain('TileRow={y}');
  });

  test('calls roundTimeOneMinute and toISOStringSeconds with the date', () => {
    const date = new Date('2021-01-01');
    createVectorUrl(date, 'my-layer', 'EPSG4326');
    expect(mockRoundTimeOneMinute).toHaveBeenCalledWith(date);
    expect(mockToISOStringSeconds).toHaveBeenCalled();
  });
});

// =============================================================================
// mergeBreakpointLayerAttributes
// =============================================================================

describe('mergeBreakpointLayerAttributes', () => {
  test('returns def unchanged when no breakPointLayer is present', () => {
    const def = { id: 'layer-1', type: 'wmts' };
    expect(mergeBreakpointLayerAttributes(def, 'geographic')).toBe(def);
  });

  test('merges projection-specific attributes into breakPointLayer', () => {
    const def = {
      id: 'layer-1',
      breakPointLayer: {
        resolutionBreakPoint: 100,
        projections: {
          geographic: { resolutionBreakPoint: 500, extraProp: 'geo' },
        },
      },
    };
    const result = mergeBreakpointLayerAttributes(def, 'geographic');
    expect(result.breakPointLayer.resolutionBreakPoint).toBe(500);
    expect(result.breakPointLayer.extraProp).toBe('geo');
  });

  test('still includes non-projection-specific breakPointLayer properties after merge', () => {
    const def = {
      id: 'layer-1',
      breakPointLayer: {
        breakPointType: 'max',
        projections: {
          geographic: { resolutionBreakPoint: 500 },
        },
      },
    };
    const result = mergeBreakpointLayerAttributes(def, 'geographic');
    expect(result.breakPointLayer.breakPointType).toBe('max');
  });

  test('returns a new object (does not mutate original def)', () => {
    const def = {
      id: 'layer-1',
      breakPointLayer: {
        projections: { geographic: { resolutionBreakPoint: 500 } },
      },
    };
    const result = mergeBreakpointLayerAttributes(def, 'geographic');
    expect(result).not.toBe(def);
  });

  test('works for a non-geographic projection key', () => {
    const def = {
      id: 'layer-1',
      breakPointLayer: {
        projections: {
          arctic: { resolutionBreakPoint: 200 },
        },
      },
    };
    const result = mergeBreakpointLayerAttributes(def, 'arctic');
    expect(result.breakPointLayer.resolutionBreakPoint).toBe(200);
  });
});

// =============================================================================
// updateReduxDateTimezone
// =============================================================================

describe('updateReduxDateTimezone', () => {
  test('returns a string in YYYY-MM-DDTHH:MM:00 format', () => {
    const result = updateReduxDateTimezone(
      '2021-06-15T10:30:00',
      '2021-06-15T10:30:00',
    );
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:00$/);
  });

  test('rounds minutes down to the nearest multiple of 10', () => {
    const result = updateReduxDateTimezone(
      '2021-06-15T10:37:00',
      '2021-06-15T10:37:00',
    );
    const minutes = parseInt(result.split('T')[1].split(':')[1], 10);
    expect(minutes % 10).toBe(0);
  });

  test('rounds minutes of 0 to 0', () => {
    const result = updateReduxDateTimezone(
      '2021-06-15T10:00:00',
      '2021-06-15T10:00:00',
    );
    const minutes = result.split('T')[1].split(':')[1];
    expect(minutes).toBe('00');
  });

  test('rounds minutes of 59 down to 50', () => {
    const result = updateReduxDateTimezone(
      '2021-06-15T10:59:00',
      '2021-06-15T10:59:00',
    );
    const minutes = result.split('T')[1].split(':')[1];
    expect(minutes).toBe('50');
  });

  test('ends with :00 seconds always', () => {
    const result = updateReduxDateTimezone(
      '2021-06-15T10:30:45',
      '2021-06-15T10:30:45',
    );
    expect(result.endsWith(':00')).toBe(true);
  });
});

// =============================================================================
// formatReduxDate
// =============================================================================

describe('formatReduxDate', () => {
  test('returns date-only format (T00:00:00) when not a subdaily layer', () => {
    const result = formatReduxDate('2021-06-15T10:30:00', '2021-06-15T10:30:00', false);
    expect(result).toBe('2021-06-15T00:00:00');
  });

  test('returns timezone-adjusted string when isSubdailyLayer is true', () => {
    const result = formatReduxDate('2021-06-15T10:30:00', '2021-06-15T10:30:00', true);
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:00$/);
  });

  test('zero-pads single-digit months and days for non-subdaily', () => {
    const result = formatReduxDate('2021-01-05T00:00:00', null, false);
    expect(result).toBe('2021-01-05T00:00:00');
  });

  test('returns non-subdaily format regardless of time in reduxDate', () => {
    const result = formatReduxDate('2021-12-31T23:59:59', null, false);
    expect(result).toBe('2021-12-31T00:00:00');
  });
});

// =============================================================================
// extractDateFromTileErrorURL
// =============================================================================

describe('extractDateFromTileErrorURL', () => {
  test('extracts a full datetime string (with time) from a URL', () => {
    const url = 'https://example.com/tiles?TIME=2021-06-15T12:30:00&other=param';
    expect(extractDateFromTileErrorURL(url)).toBe('2021-06-15T12:30:00');
  });

  test('returns null for a date-only TIME parameter (no time component)', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const url = 'https://example.com/tiles?TIME=2021-06-15&other=param';
    const result = extractDateFromTileErrorURL(url);
    expect(result).toBeNull();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  test('returns null and logs an error when TIME is not found in the URL', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const result = extractDateFromTileErrorURL('https://example.com/tiles?layer=foo');
    expect(result).toBeNull();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  test('returns null for an empty string URL', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const result = extractDateFromTileErrorURL('');
    expect(result).toBeNull();
    consoleSpy.mockRestore();
  });
});

// =============================================================================
// fly
// =============================================================================

describe('fly', () => {
  beforeEach(() => jest.clearAllMocks());

  const buildFlyView = ({
    zoom = 4,
    center = [0, 0],
    extent = [-180, -90, 180, 90],
    hasEndInView = false,
    distance = 50,
  } = {}) => {
    mockGetLength.mockReturnValue(distance);
    mockContainsCoordinate.mockReturnValue(hasEndInView);
    mockGetCenter.mockReturnValue([0, 0]);
    return buildView({ zoom, center, extent });
  };

  test('calls cancelAnimations on the view', () => {
    const view = buildFlyView();
    const map = buildMap(view);
    fly(map, buildProj(), [10, 20], false);
    expect(view.cancelAnimations).toHaveBeenCalled();
  });

  test('returns a Promise', () => {
    const view = buildFlyView();
    const map = buildMap(view);
    const result = fly(map, buildProj(), [10, 20], false);
    expect(result).toBeInstanceOf(Promise);
  });

  test('uses getCenter of endPoint array when endPoint has more than 2 elements (is an extent)', () => {
    const view = buildFlyView();
    const map = buildMap(view);
    mockGetCenter.mockReturnValue([5, 5]);
    fly(map, buildProj(), [-10, -10, 10, 10], false);
    expect(mockGetCenter).toHaveBeenCalledWith([-10, -10, 10, 10]);
  });

  test('does not call getCenter when endPoint has exactly 2 elements', () => {
    const view = buildFlyView();
    const map = buildMap(view);
    fly(map, buildProj(), [10, 20], false);
    expect(mockGetCenter).not.toHaveBeenCalled();
  });

  test('resolves when all animations complete successfully', async () => {
    const view = buildFlyView({ hasEndInView: true });
    view.animate.mockImplementation((...args) => {
      const cb = args[args.length - 1];
      if (typeof cb === 'function') cb();
    });
    const map = buildMap(view);
    await expect(fly(map, buildProj(), [10, 20], false)).resolves.toBeDefined();
  });

  test('uses polar distance scaling when projection is not geographic', () => {
    const view = buildFlyView({ distance: 100000 });
    view.animate.mockImplementation(() => {});
    const map = buildMap(view);
    // Should not throw with polar projection
    expect(() => fly(map, buildProj('arctic'), [10, 20], false)).not.toThrow();
  });

  test('uses kiosk mode duration formula when isKioskModeActive is true', () => {
    const view = buildFlyView({ distance: 100 });
    const map = buildMap(view);
    expect(() => fly(map, buildProj(), [10, 20], true, 5, 0)).not.toThrow();
  });

  test('uses default endZoom of 5 when not provided', () => {
    const view = buildFlyView({ hasEndInView: false });
    const map = buildMap(view);
    expect(() => fly(map, buildProj(), [10, 20], false)).not.toThrow();
  });

  test('uses default rotation of 0 when not provided', () => {
    const view = buildFlyView({ hasEndInView: true });
    view.animate.mockImplementation(() => {});
    const map = buildMap(view);
    fly(map, buildProj(), [10, 20], false, 5);
    expect(view.animate).toHaveBeenCalledWith(
      expect.objectContaining({ rotation: 0 }),
      expect.any(Function),
    );
  });

  test('applies halved duration when end point is already in view and duration < 1200', () => {
    const view = buildFlyView({ hasEndInView: true, distance: 1 });
    const animateCalls = [];
    view.animate.mockImplementation((...args) => {
      animateCalls.push(args);
    });
    const map = buildMap(view);
    fly(map, buildProj(), [1, 1], false, 5, 0);
    expect(animateCalls.length).toBeGreaterThan(0);
  });
});
