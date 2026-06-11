/* eslint-disable new-cap */
import MapRunningData from './runningdata';

// =============================================================================
// Mocks
// =============================================================================

const mockTrigger = jest.fn();
jest.mock('../util/util', () => ({
  __esModule: true,
  default: {
    events: { trigger: (...args) => mockTrigger(...args) },
    rgbaToHex: jest.fn((r, g, b, a) => `#${r}${g}${b}${a}`),
  },
}));

jest.mock('../util/constants', () => ({
  MAP_RUNNING_DATA: 'MAP_RUNNING_DATA',
}));

const mockGetPalette = jest.fn();
jest.mock('../modules/palettes/selectors', () => ({
  getPalette: (...args) => mockGetPalette(...args),
}));

const mockIsFromActiveCompareRegion = jest.fn();
jest.mock('../modules/compare/util', () => ({
  isFromActiveCompareRegion: (...args) => mockIsFromActiveCompareRegion(...args),
}));

const mockContainsCoordinate = jest.fn();
jest.mock('ol/extent', () => ({
  containsCoordinate: (...args) => mockContainsCoordinate(...args),
}));

// =============================================================================
// Shared test helpers
// =============================================================================

const buildStore = (overrides = {}) => ({
  getState: jest.fn().mockReturnValue({
    proj: { id: 'geographic' },
    compare: { active: false },
    sidebar: { isCollapsed: false },
    ...overrides,
  }),
});

const buildMap = ({
  coordinate = [10, 20],
  layers = [],
  features = [],
} = {}) => ({
  getCoordinateFromPixel: jest.fn().mockReturnValue(coordinate),
  getAllLayers: jest.fn().mockReturnValue(layers),
  forEachFeatureAtPixel: jest.fn((pixel, cb) => {
    features.forEach(({ feature, layer }) => cb(feature, layer));
  }),
});

// A minimal valid raster layer
const buildRasterLayer = ({
  id = 'test-layer',
  hasPalette = true,
  type = 'wmts',
  isVector = false,
  data = [255, 0, 0, 255],
  isCollapsed = false,
  granuleGroup = null,
} = {}) => ({
  isVector,
  getData: jest.fn().mockReturnValue(data),
  get: jest.fn((key) => {
    if (key === 'granuleGroup') return granuleGroup;
    if (key === 'extent') return [-180, -90, 180, 90];
    return null;
  }),
  wv: {
    def: {
      id,
      type,
      palette: hasPalette ? { id } : null,
    },
    group: 'active',
  },
});

// A minimal valid vector layer
const buildVectorLayer = ({
  id = 'vector-layer',
  palette = { styleProperty: 'category' },
  colormapType = undefined,
  type = 'vector',
  wrapadjacentdays = false,
  wrapX = false,
  hasPalette = true,
  featureOutside = false,
  inCompareRegion = true,
  isCollapsed = false,
} = {}) => {
  mockContainsCoordinate.mockReturnValue(!featureOutside);
  mockIsFromActiveCompareRegion.mockReturnValue(inCompareRegion);
  return {
    isVector: true,
    get: jest.fn((key) => {
      if (key === 'extent') return [-180, -90, 180, 90];
      return null;
    }),
    wv: {
      def: {
        id,
        type,
        colormapType,
        palette: hasPalette ? palette : {},
        wrapadjacentdays,
        wrapX,
      },
      group: 'active',
    },
  };
};

const buildFeature = (props = {}) => ({
  getProperties: jest.fn().mockReturnValue(props),
});

const buildPaletteLegend = ({
  colors = ['ff0000ff'],
  tooltips = ['category'],
} = {}) => ({
  legend: { colors, tooltips },
});

// =============================================================================
// clearAll
// =============================================================================

describe('clearAll', () => {
  beforeEach(() => jest.clearAllMocks());

  test('does not trigger an event when dataObj is already empty', () => {
    const rd = MapRunningData(null, buildStore());
    rd.clearAll();
    expect(mockTrigger).not.toHaveBeenCalled();
  });

  test('triggers MAP_RUNNING_DATA with an empty object when dataObj is non-empty', () => {
    const store = buildStore();
    mockGetPalette.mockReturnValue(buildPaletteLegend());
    const rd = MapRunningData(null, store);

    const layer = buildRasterLayer();
    const map = buildMap({ layers: [layer] });
    rd.newPoint([0, 0], map);
    mockTrigger.mockClear();

    rd.clearAll();
    expect(mockTrigger).toHaveBeenCalledWith('MAP_RUNNING_DATA', {});
  });

  test('does not trigger a second time if clearAll is called again on already-empty state', () => {
    const store = buildStore();
    mockGetPalette.mockReturnValue(buildPaletteLegend());
    const rd = MapRunningData(null, store);

    const layer = buildRasterLayer();
    const map = buildMap({ layers: [layer] });
    rd.newPoint([0, 0], map);

    rd.clearAll();
    mockTrigger.mockClear();
    rd.clearAll();
    expect(mockTrigger).not.toHaveBeenCalled();
  });
});

// =============================================================================
// newPoint — swipeOffset / compareUi
// =============================================================================

describe('newPoint — compareUi / swipeOffset', () => {
  beforeEach(() => jest.clearAllMocks());

  test('reads swipeOffset from compareUi when compare is active', () => {
    const compareUi = { getOffset: jest.fn().mockReturnValue(50.7) };
    const store = buildStore({ compare: { active: true } });
    const rd = MapRunningData(compareUi, store);
    const map = buildMap();
    rd.newPoint([0, 0], map);
    expect(compareUi.getOffset).toHaveBeenCalled();
  });

  test('does not call getOffset when compare is inactive', () => {
    const compareUi = { getOffset: jest.fn() };
    const store = buildStore({ compare: { active: false } });
    const rd = MapRunningData(compareUi, store);
    const map = buildMap();
    rd.newPoint([0, 0], map);
    expect(compareUi.getOffset).not.toHaveBeenCalled();
  });

  test('does not throw when compareUi is null and compare is inactive', () => {
    const store = buildStore({ compare: { active: false } });
    const rd = MapRunningData(null, store);
    expect(() => rd.newPoint([0, 0], buildMap())).not.toThrow();
  });
});

// =============================================================================
// newPoint — raster layer processing
// =============================================================================

describe('newPoint — raster layers', () => {
  beforeEach(() => jest.clearAllMocks());

  test('adds a raster layer entry and triggers MAP_RUNNING_DATA', () => {
    const store = buildStore();
    mockGetPalette.mockReturnValue(buildPaletteLegend());
    const rd = MapRunningData(null, store);

    const layer = buildRasterLayer({ id: 'my-layer', data: [255, 128, 0, 255] });
    const map = buildMap({ layers: [layer] });
    rd.newPoint([0, 0], map);

    expect(mockTrigger).toHaveBeenCalledWith(
      'MAP_RUNNING_DATA',
      expect.objectContaining({ 'my-layer': expect.any(Object) }),
    );
  });

  test('stores paletteLegends and paletteHex from rgbaToHex in the layer entry', () => {
    const store = buildStore();
    const paletteLegend = buildPaletteLegend();
    mockGetPalette.mockReturnValue(paletteLegend);
    const util = require('../util/util').default;
    util.rgbaToHex.mockReturnValue('#ff0000ff');
    const rd = MapRunningData(null, store);

    const layer = buildRasterLayer({ id: 'my-layer', data: [255, 0, 0, 255] });
    const map = buildMap({ layers: [layer] });
    rd.newPoint([0, 0], map);

    expect(mockTrigger).toHaveBeenCalledWith(
      'MAP_RUNNING_DATA',
      expect.objectContaining({
        'my-layer': { paletteLegends: paletteLegend, paletteHex: '#ff0000ff' },
      }),
    );
  });

  test('skips a raster layer when sidebar is collapsed', () => {
    const store = buildStore({ sidebar: { isCollapsed: true } });
    const rd = MapRunningData(null, store);
    const layer = buildRasterLayer();
    const map = buildMap({ layers: [layer] });
    rd.newPoint([0, 0], map);
    expect(mockTrigger).not.toHaveBeenCalled();
  });

  test('skips a raster layer when it has no palette', () => {
    const store = buildStore();
    const rd = MapRunningData(null, store);
    const layer = buildRasterLayer({ hasPalette: false });
    const map = buildMap({ layers: [layer] });
    rd.newPoint([0, 0], map);
    expect(mockTrigger).not.toHaveBeenCalled();
  });

  test('skips a raster layer when isVector is true', () => {
    const store = buildStore();
    const rd = MapRunningData(null, store);
    const layer = buildRasterLayer({ isVector: true });
    const map = buildMap({ layers: [layer] });
    rd.newPoint([0, 0], map);
    expect(mockTrigger).not.toHaveBeenCalled();
  });

  test('skips a raster layer of type granule that has no granuleGroup', () => {
    const store = buildStore();
    const rd = MapRunningData(null, store);
    const layer = buildRasterLayer({ type: 'granule', granuleGroup: null });
    const map = buildMap({ layers: [layer] });
    rd.newPoint([0, 0], map);
    expect(mockTrigger).not.toHaveBeenCalled();
  });

  test('does not skip a granule layer that has a granuleGroup', () => {
    const store = buildStore();
    mockGetPalette.mockReturnValue(buildPaletteLegend());
    const rd = MapRunningData(null, store);
    const layer = buildRasterLayer({ type: 'granule', granuleGroup: 'group1' });
    const map = buildMap({ layers: [layer] });
    rd.newPoint([0, 0], map);
    expect(mockTrigger).toHaveBeenCalled();
  });

  test('skips a raster layer when getData returns null', () => {
    const store = buildStore();
    const rd = MapRunningData(null, store);
    const layer = buildRasterLayer({ data: null });
    const map = buildMap({ layers: [layer] });
    rd.newPoint([0, 0], map);
    expect(mockTrigger).not.toHaveBeenCalled();
  });

  test('does not re-trigger when newPoint produces the same data object', () => {
    const store = buildStore();
    mockGetPalette.mockReturnValue(buildPaletteLegend());
    const util = require('../util/util').default;
    util.rgbaToHex.mockReturnValue('#ff0000ff');
    const rd = MapRunningData(null, store);

    const layer = buildRasterLayer({ id: 'same-layer', data: [255, 0, 0, 255] });
    const map = buildMap({ layers: [layer] });

    rd.newPoint([0, 0], map);
    mockTrigger.mockClear();
    rd.newPoint([0, 0], map);
    expect(mockTrigger).not.toHaveBeenCalled();
  });
});

// =============================================================================
// newPoint — vector layer processing: shouldNotProcessVectorLayer guards
// =============================================================================

describe('newPoint — vector layer guards (shouldNotProcessVectorLayer)', () => {
  beforeEach(() => jest.clearAllMocks());

  test('skips vector layer when layer has no wv.def', () => {
    const store = buildStore();
    const rd = MapRunningData(null, store);
    const layer = { isVector: true, get: jest.fn(), wv: {} };
    const map = buildMap({ features: [{ feature: buildFeature(), layer }] });
    rd.newPoint([0, 0], map);
    expect(mockTrigger).not.toHaveBeenCalled();
  });

  test('skips vector layer when sidebar is collapsed', () => {
    const store = buildStore({ sidebar: { isCollapsed: true } });
    const rd = MapRunningData(null, store);
    const layer = buildVectorLayer({ isCollapsed: true });
    const map = buildMap({ features: [{ feature: buildFeature({ category: 'cat1' }), layer }] });
    rd.newPoint([0, 0], map);
    expect(mockTrigger).not.toHaveBeenCalled();
  });

  test('skips vector layer when feature is outside extent', () => {
    const store = buildStore();
    const rd = MapRunningData(null, store);
    const layer = buildVectorLayer({ featureOutside: true });
    const feature = buildFeature({ category: 'cat1' });
    const map = buildMap({ features: [{ feature, layer }] });
    rd.newPoint([0, 0], map);
    expect(mockTrigger).not.toHaveBeenCalled();
  });

  test('skips vector layer when not in active compare region', () => {
    const store = buildStore();
    const rd = MapRunningData(null, store);
    const layer = buildVectorLayer({ inCompareRegion: false });
    const feature = buildFeature({ category: 'cat1' });
    const map = buildMap({ features: [{ feature, layer }] });
    rd.newPoint([0, 0], map);
    expect(mockTrigger).not.toHaveBeenCalled();
  });

  test('skips vector layer when palette is empty', () => {
    const store = buildStore();
    const rd = MapRunningData(null, store);
    const layer = buildVectorLayer({ hasPalette: false });
    const feature = buildFeature({ category: 'cat1' });
    const map = buildMap({ features: [{ feature, layer }] });
    rd.newPoint([0, 0], map);
    expect(mockTrigger).not.toHaveBeenCalled();
  });

  test('does not skip a valid vector layer in geographic projection with wrapadjacentdays', () => {
    const store = buildStore({ proj: { id: 'geographic' } });
    mockGetPalette.mockReturnValue(buildPaletteLegend({ tooltips: ['cat1'] }));
    const rd = MapRunningData(null, store);
    const layer = buildVectorLayer({ wrapadjacentdays: true });
    const feature = buildFeature({ category: 'cat1' });
    const map = buildMap({
      coordinate: [10, 20],
      features: [{ feature, layer }],
    });
    rd.newPoint([0, 0], map);
    expect(mockTrigger).toHaveBeenCalled();
  });

  test('does not skip a valid vector layer in non-geographic projection', () => {
    const store = buildStore({ proj: { id: 'arctic' } });
    mockGetPalette.mockReturnValue(buildPaletteLegend({ tooltips: ['cat1'] }));
    const rd = MapRunningData(null, store);
    const layer = buildVectorLayer();
    const feature = buildFeature({ category: 'cat1' });
    const map = buildMap({ features: [{ feature, layer }] });
    rd.newPoint([0, 0], map);
    expect(mockTrigger).toHaveBeenCalled();
  });
});

// =============================================================================
// newPoint — vector layer processing: color resolution branches
// =============================================================================

describe('newPoint — vector layer color resolution', () => {
  beforeEach(() => jest.clearAllMocks());

  test('early-returns when no identifier, not continuous, and legend has more than one color', () => {
    const store = buildStore();
    const layer = buildVectorLayer({ palette: { styleProperty: null } });
    mockGetPalette.mockReturnValue(
      buildPaletteLegend({ colors: ['ff0000ff', '00ff00ff'], tooltips: ['a', 'b'] }),
    );
    const feature = buildFeature({});
    const map = buildMap({ features: [{ feature, layer }] });
    const rd = MapRunningData(null, store);
    rd.newPoint([0, 0], map);
    expect(mockTrigger).not.toHaveBeenCalled();
  });

  test('resolves color by identifier via tooltips.indexOf for a non-AERONET layer', () => {
    const store = buildStore();
    mockGetPalette.mockReturnValue(
      buildPaletteLegend({ colors: ['ff0000ff', '00ff00ff'], tooltips: ['cat1', 'cat2'] }),
    );
    const rd = MapRunningData(null, store);
    const layer = buildVectorLayer({ palette: { styleProperty: 'category' } });
    const feature = buildFeature({ category: 'cat2' });
    const map = buildMap({ features: [{ feature, layer }] });
    rd.newPoint([0, 0], map);
    expect(mockTrigger).toHaveBeenCalledWith(
      'MAP_RUNNING_DATA',
      expect.objectContaining({
        'vector-layer': expect.objectContaining({ paletteHex: '00ff00ff' }),
      }),
    );
  });

  test('uses palette.unclassified when featureProps value is falsy', () => {
    const store = buildStore();
    mockGetPalette.mockReturnValue(
      buildPaletteLegend({ colors: ['aabbccff'], tooltips: ['unknown'] }),
    );
    const rd = MapRunningData(null, store);
    const layer = buildVectorLayer({
      palette: { styleProperty: 'category', unclassified: 'unknown' },
    });
    const feature = buildFeature({ category: '' });
    const map = buildMap({ features: [{ feature, layer }] });
    rd.newPoint([0, 0], map);
    expect(mockTrigger).toHaveBeenCalled();
  });

  test('early-returns when value is falsy and no unclassified fallback', () => {
    const store = buildStore();
    mockGetPalette.mockReturnValue(buildPaletteLegend());
    const rd = MapRunningData(null, store);
    const layer = buildVectorLayer({
      palette: { styleProperty: 'category', unclassified: null },
    });
    const feature = buildFeature({ category: '' });
    const map = buildMap({ features: [{ feature, layer }] });
    rd.newPoint([0, 0], map);
    expect(mockTrigger).not.toHaveBeenCalled();
  });

  // ── AERONET color resolution ──

  test('resolves AERONET color via tooltips.findIndex when color is found', () => {
    const store = buildStore();
    mockGetPalette.mockReturnValue(
      buildPaletteLegend({ colors: ['aabbccff'], tooltips: ['ab'] }),
    );
    const rd = MapRunningData(null, store);
    const layer = buildVectorLayer({
      id: 'AERONET_layer',
      palette: { styleProperty: 'value' },
    });
    const feature = buildFeature({ value: 'ab' });
    const map = buildMap({ features: [{ feature, layer }] });
    rd.newPoint([0, 0], map);
    expect(mockTrigger).toHaveBeenCalled();
  });

  test('falls back to secondary getPalette call for AERONET when first color lookup misses', () => {
    const store = buildStore();
    const primaryLegend = buildPaletteLegend({ colors: [undefined], tooltips: ['zz'] });
    const secondaryLegend = {
      legend: {
        colors: ['ddeeffff'],
        tooltips: ['0.0 – 0.5', '0.5 – 1.0'],
      },
    };
    mockGetPalette
      .mockReturnValueOnce(primaryLegend)
      .mockReturnValueOnce(secondaryLegend);
    const rd = MapRunningData(null, store);
    const layer = buildVectorLayer({
      id: 'AERONET_layer',
      palette: { styleProperty: 'value' },
    });
    const feature = buildFeature({ value: '0.3' });
    const map = buildMap({ features: [{ feature, layer }] });
    rd.newPoint([0, 0], map);
    expect(mockGetPalette).toHaveBeenCalledTimes(2);
    expect(mockTrigger).toHaveBeenCalled();
  });

  // ── Continuous vector layer color resolution ──

  test('resolves color for continuous vector layer using ≥ tooltip', () => {
    const store = buildStore();
    mockGetPalette.mockReturnValue(
      buildPaletteLegend({ colors: ['ff0000ff'], tooltips: ['≥ 10'] }),
    );
    const rd = MapRunningData(null, store);
    const layer = buildVectorLayer({
      palette: { styleProperty: null },
      colormapType: 'continuous',
      type: 'vector',
    });
    const feature = buildFeature({ Value: '15' });
    const map = buildMap({ features: [{ feature, layer }] });
    rd.newPoint([0, 0], map);
    expect(mockTrigger).toHaveBeenCalledWith(
      'MAP_RUNNING_DATA',
      expect.objectContaining({
        'vector-layer': expect.objectContaining({ paletteHex: 'ff0000ff' }),
      }),
    );
  });

  test('resolves color for continuous vector layer using > tooltip', () => {
    const store = buildStore();
    mockGetPalette.mockReturnValue(
      buildPaletteLegend({ colors: ['00ff00ff'], tooltips: ['> 5'] }),
    );
    const rd = MapRunningData(null, store);
    const layer = buildVectorLayer({
      palette: { styleProperty: null },
      colormapType: 'continuous',
      type: 'vector',
    });
    const feature = buildFeature({ Value: '10' });
    const map = buildMap({ features: [{ feature, layer }] });
    rd.newPoint([0, 0], map);
    expect(mockTrigger).toHaveBeenCalled();
  });

  test('resolves color for continuous vector layer using ≤ tooltip', () => {
    const store = buildStore();
    mockGetPalette.mockReturnValue(
      buildPaletteLegend({ colors: ['0000ffff'], tooltips: ['≤ 20'] }),
    );
    const rd = MapRunningData(null, store);
    const layer = buildVectorLayer({
      palette: { styleProperty: null },
      colormapType: 'continuous',
      type: 'vector',
    });
    const feature = buildFeature({ Value: '10' });
    const map = buildMap({ features: [{ feature, layer }] });
    rd.newPoint([0, 0], map);
    expect(mockTrigger).toHaveBeenCalled();
  });

  test('resolves color for continuous vector layer using < tooltip', () => {
    const store = buildStore();
    mockGetPalette.mockReturnValue(
      buildPaletteLegend({ colors: ['ffff00ff'], tooltips: ['< 50'] }),
    );
    const rd = MapRunningData(null, store);
    const layer = buildVectorLayer({
      palette: { styleProperty: null },
      colormapType: 'continuous',
      type: 'vector',
    });
    const feature = buildFeature({ Value: '25' });
    const map = buildMap({ features: [{ feature, layer }] });
    rd.newPoint([0, 0], map);
    expect(mockTrigger).toHaveBeenCalled();
  });

  test('resolves color for continuous vector layer using range tooltip (n-m)', () => {
    const store = buildStore();
    mockGetPalette.mockReturnValue(
      buildPaletteLegend({ colors: ['112233ff'], tooltips: ['10-20'] }),
    );
    const rd = MapRunningData(null, store);
    const layer = buildVectorLayer({
      palette: { styleProperty: null },
      colormapType: 'continuous',
      type: 'vector',
    });
    const feature = buildFeature({ Value: '15' });
    const map = buildMap({ features: [{ feature, layer }] });
    rd.newPoint([0, 0], map);
    expect(mockTrigger).toHaveBeenCalledWith(
      'MAP_RUNNING_DATA',
      expect.objectContaining({
        'vector-layer': expect.objectContaining({ paletteHex: '112233ff' }),
      }),
    );
  });

  test('early-returns for continuous vector layer when Value is not numeric', () => {
    const store = buildStore();
    mockGetPalette.mockReturnValue(
      buildPaletteLegend({ colors: ['ff0000ff'], tooltips: ['10-20'] }),
    );
    const rd = MapRunningData(null, store);
    const layer = buildVectorLayer({
      palette: { styleProperty: null },
      colormapType: 'continuous',
      type: 'vector',
    });
    const feature = buildFeature({ Value: 'not-a-number' });
    const map = buildMap({ features: [{ feature, layer }] });
    rd.newPoint([0, 0], map);
    expect(mockTrigger).not.toHaveBeenCalled();
  });

  test('uses single color directly when legend has exactly one color and no identifier', () => {
    const store = buildStore();
    mockGetPalette.mockReturnValue(
      buildPaletteLegend({ colors: ['abcdefff'], tooltips: [] }),
    );
    const rd = MapRunningData(null, store);
    const layer = buildVectorLayer({
      palette: { styleProperty: null },
      colormapType: undefined,
      type: 'vector',
    });
    const feature = buildFeature({});
    const map = buildMap({ features: [{ feature, layer }] });
    rd.newPoint([0, 0], map);
    expect(mockTrigger).toHaveBeenCalledWith(
      'MAP_RUNNING_DATA',
      expect.objectContaining({
        'vector-layer': expect.objectContaining({ paletteHex: 'abcdefff' }),
      }),
    );
  });

  test('tooltip with no matching operator returns false (color resolves to undefined)', () => {
    const store = buildStore();
    mockGetPalette.mockReturnValue(
      buildPaletteLegend({ colors: ['ff0000ff'], tooltips: ['no match tooltip'] }),
    );
    const rd = MapRunningData(null, store);
    const layer = buildVectorLayer({
      palette: { styleProperty: null },
      colormapType: 'continuous',
      type: 'vector',
    });
    const feature = buildFeature({ Value: '5' });
    const map = buildMap({ features: [{ feature, layer }] });
    rd.newPoint([0, 0], map);
    expect(mockTrigger).toHaveBeenCalledWith(
      'MAP_RUNNING_DATA',
      expect.objectContaining({
        'vector-layer': expect.objectContaining({ paletteHex: undefined }),
      }),
    );
  });
});
