import mapLayerBuilder from './layerbuilder';

jest.mock('ol/tilegrid/WMTS', () => jest.fn().mockImplementation(() => ({})));
jest.mock('ol/source/WMTS', () => jest.fn().mockImplementation(() => ({})));
jest.mock('ol/source/TileWMS', () => jest.fn().mockImplementation(() => ({})));
jest.mock('ol/source/XYZ', () => jest.fn().mockImplementation(() => ({})));
jest.mock('ol/source/ImageTile', () => jest.fn().mockImplementation(() => ({})));
jest.mock('ol/layer/Group', () =>
  jest.fn().mockImplementation(({ layers } = {}) => ({
    wv: null,
    layers,
    getLayers: () => ({ getArray: () => layers || [] }),
    getLayersArray: () => layers || [],
    setOpacity: jest.fn(),
    setVisible: jest.fn(),
  })),
);
jest.mock('ol/layer/Tile', () =>
  jest.fn().mockImplementation(() => ({
    wv: null,
    setOpacity: jest.fn(),
    setVisible: jest.fn(),
    setExtent: jest.fn(),
    getLayersArray: () => [],
    isWMS: false,
  })),
);
jest.mock('ol/proj', () => ({
  get: jest.fn().mockReturnValue({
    getExtent: jest.fn().mockReturnValue([-180, -90, 180, 90]),
  }),
}));
jest.mock('ol/tilegrid', () => ({
  TileGrid: jest.fn().mockImplementation(() => ({})),
  createXYZ: jest.fn().mockReturnValue({
    getResolutions: jest.fn().mockReturnValue([1, 0.5]),
    getTileSize: jest.fn().mockReturnValue([512, 512]),
  }),
}));
jest.mock('ol/format/MVT', () => jest.fn().mockImplementation(() => ({})));
jest.mock('ol/format/GeoJSON', () =>
  jest.fn().mockImplementation(() => ({
    readFeatures: jest.fn().mockReturnValue([]),
  })),
);
jest.mock('ol/source/VectorTile', () => jest.fn().mockImplementation(() => ({})));
jest.mock('ol/layer/Vector', () =>
  jest.fn().mockImplementation(() => ({
    wv: null,
    setOpacity: jest.fn(),
    setVisible: jest.fn(),
    getLayersArray: () => [],
    vectorData: null,
    isVector: false,
  })),
);
jest.mock('ol/source/Vector', () =>
  jest.fn().mockImplementation(() => ({
    getFormat: jest.fn().mockReturnValue({
      readFeatures: jest.fn().mockReturnValue([]),
    }),
    addFeatures: jest.fn(),
  })),
);
jest.mock('ol/layer/VectorTile', () =>
  jest.fn().mockImplementation(() => ({
    wv: null,
    setOpacity: jest.fn(),
    setVisible: jest.fn(),
    getLayersArray: () => [],
  })),
);
jest.mock('ol/style', () => ({
  Circle: jest.fn().mockImplementation(() => ({})),
  Fill: jest.fn().mockImplementation(() => ({})),
  Stroke: jest.fn().mockImplementation(() => ({})),
  Style: jest.fn().mockImplementation(() => ({})),
}));
jest.mock('ol/layer/Image', () =>
  jest.fn().mockImplementation(() => ({
    wv: null,
    setOpacity: jest.fn(),
    setVisible: jest.fn(),
    getLayersArray: () => [],
  })),
);
jest.mock('ol/source/ImageStatic', () => jest.fn().mockImplementation(() => ({})));

jest.mock('lodash/merge', () => jest.requireActual('lodash/merge'));
jest.mock('lodash/each', () => jest.requireActual('lodash/each'));
jest.mock('lodash/get', () => jest.requireActual('lodash/get'));
jest.mock('lodash/cloneDeep', () => jest.requireActual('lodash/cloneDeep'));

jest.mock('ol-mapbox-style', () => ({
  applyBackground: jest.fn().mockResolvedValue(undefined),
  applyStyle: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../util/util', () => ({
  __esModule: true,
  default: {
    toISOStringSeconds: jest.fn((date) => (date ? date.toISOString() : '')),
    roundTimeOneMinute: jest.fn((date) => date),
    clearTimeUTC: jest.fn((date) => {
      if (!date) return date;
      const d = new Date(date);
      d.setUTCHours(0, 0, 0, 0);
      return d;
    }),
    dateAdd: jest.fn((date, unit, amount) => {
      const d = new Date(date);
      if (unit === 'day') d.setDate(d.getDate() + amount);
      if (unit === 'month') d.setMonth(d.getMonth() + amount);
      if (unit === 'year') d.setFullYear(d.getFullYear() + amount);
      return d;
    }),
  },
}));

jest.mock('../util/cmr', () => ({
  buildGranulesUrl: jest.fn().mockReturnValue('http://cmr.example.com/granules'),
  cmrSearchAfterFetch: jest.fn().mockResolvedValue({ entries: [] }),
}));

jest.mock('../ol/lookupimagetile', () => jest.fn().mockReturnValue(jest.fn()));

jest.mock('./granule/granule-layer-builder', () =>
  jest.fn().mockReturnValue({
    getGranuleLayer: jest.fn().mockResolvedValue({
      wv: null,
      setOpacity: jest.fn(),
      setVisible: jest.fn(),
      getLayersArray: () => [],
    }),
  }),
);

jest.mock('./util', () => ({
  createVectorUrl: jest.fn().mockReturnValue('?TIME=2021-01-01'),
  getGeographicResolutionWMS: jest.fn().mockReturnValue([1, 0.5, 0.25]),
  mergeBreakpointLayerAttributes: jest.fn((def) => def),
}));

jest.mock('../modules/layers/util', () => ({
  datesInDateRanges: jest.fn().mockReturnValue([new Date('2021-01-01')]),
  prevDateInDateRange: jest.fn().mockReturnValue({
    next: new Date('2021-01-02'),
    previous: new Date('2020-12-31'),
  }),
  nearestInterval: jest.fn().mockReturnValue(new Date('2021-01-01')),
  fetchSubdailyDateRanges: jest.fn(),
}));

jest.mock('../modules/date/selectors', () => ({
  getSelectedDate: jest.fn().mockReturnValue('2021-01-01T00:00:00.000Z'),
}));

jest.mock('../modules/palettes/selectors', () => ({
  isActive: jest.fn().mockReturnValue(false),
  getKey: jest.fn().mockReturnValue('palette-key'),
  getLookup: jest.fn().mockReturnValue({}),
}));

jest.mock('../modules/vector-styles/selectors', () => ({
  isActive: jest.fn().mockReturnValue(false),
  getKey: jest.fn().mockReturnValue('vector-style-key'),
  applyStyle: jest.fn(),
}));

jest.mock('../modules/map/constants', () => ({
  LEFT_WING_EXTENT: [-250, -90, -180, 90],
  RIGHT_WING_EXTENT: [180, -90, 250, 90],
  LEFT_WING_ORIGIN: [-250, 90],
  RIGHT_WING_ORIGIN: [180, 90],
  CENTER_MAP_ORIGIN: [0, 90],
}));

const buildMockLayer = () => ({
  wv: null,
  setOpacity: jest.fn(),
  setVisible: jest.fn(),
  setExtent: jest.fn(),
  getLayersArray: () => [],
});

const buildMockState = (overrides = {}) => ({
  proj: {
    id: 'geographic',
    selected: {
      id: 'geographic',
      crs: 'EPSG:4326',
      maxExtent: [-180, -90, 180, 90],
      resolutions: [1, 0.5, 0.25],
    },
  },
  date: {
    selected: new Date('2021-01-01T00:00:00.000Z'),
    selectedB: new Date('2021-01-02T00:00:00.000Z'),
    appNow: new Date('2021-01-01T00:00:00.000Z'),
  },
  compare: {
    activeString: 'active',
  },
  ui: {
    isKioskModeActive: false,
    displayStaticMap: false,
  },
  layers: {
    active: { activeTab: 'layers' },
    activeB: { activeTab: 'layers' },
  },
  animation: {
    isPlaying: false,
  },
  palettes: {
    custom: {},
    rendered: {},
  },
  config: {
    features: {
      describeDomains: { url: 'https://gibs.earthdata.nasa.gov' },
      cmr: { url: 'https://cmr.earthdata.nasa.gov' },
    },
  },
  sidebar: {
    activeTab: 'layers',
  },
  ...overrides,
});

const buildConfig = (sourceOverrides = {}) => ({
  sources: {
    'test-source': {
      url: 'https://gibs.example.com',
      matrixSets: {
        EPSG4326_250m: {
          id: 'EPSG4326_250m',
          resolutions: [0.5, 0.25],
          tileSize: [512, 512],
          tileMatrices: [
            { matrixWidth: 2, matrixHeight: 1 },
            { matrixWidth: 4, matrixHeight: 2 },
          ],
        },
      },
    },
    'EUMETSAT:wms': {
      url: 'https://eumetsat.example.com',
      matrixSets: {},
    },
    AERONET: {
      url: 'https://aeronet.example.com',
      matrixSets: {},
    },
    'test-xyz': {
      url: 'https://xyz.example.com',
    },
    'test-esri': {
      url: 'https://esri.example.com',
    },
    'test-vector': {
      url: 'https://vector.example.com',
      matrixSets: {
        testMatrixSet: {
          resolutions: [0.5, 0.25],
          tileSize: [512, 512],
          tileMatrices: [[2, 1], [4, 2]],
        },
      },
    },
    'test-indexed': {
      url: 'https://indexed.example.com',
      matrixSets: {
        testMatrixSet: {
          resolutions: [0.5, 0.25],
          tileSize: [512, 512],
        },
      },
    },
    ...sourceOverrides,
  },
});

const buildCache = () => ({
  getItem: jest.fn().mockReturnValue(null),
  setItem: jest.fn(),
});

const buildStore = (stateOverrides = {}) => ({
  getState: jest.fn().mockReturnValue(buildMockState(stateOverrides)),
});

const buildDef = (overrides = {}) => ({
  id: 'test-layer',
  type: 'wmts',
  source: 'test-source',
  matrixSet: 'EPSG4326_250m',
  format: 'image/jpeg',
  period: 'daily',
  projections: {
    geographic: {},
  },
  opacity: 1,
  wrapadjacentdays: false,
  wrapX: false,
  ...overrides,
});

const buildOptions = (overrides = {}) => ({
  group: 'active',
  date: new Date('2021-01-01T00:00:00.000Z'),
  ...overrides,
});

describe('mapLayerBuilder', () => {
  let config;
  let cache;
  let store;
  let builder;

  beforeEach(() => {
    jest.clearAllMocks();
    config = buildConfig();
    cache = buildCache();
    store = buildStore();
    builder = mapLayerBuilder(config, cache, store);
  });

  describe('createLayer - wmts type', () => {
    it('returns a layer for a wmts def', async () => {
      const layer = await builder.createLayer(buildDef(), buildOptions());
      expect(layer).toBeDefined();
    });

    it('sets layer visibility to false after creation', async () => {
      const layer = await builder.createLayer(buildDef(), buildOptions());
      expect(layer.setVisible).toHaveBeenCalledWith(false);
    });

    it('sets item in cache after creation', async () => {
      await builder.createLayer(buildDef(), buildOptions());
      expect(cache.setItem).toHaveBeenCalled();
    });

    it('returns cached layer when available', async () => {
      const cached = buildMockLayer();
      cache.getItem.mockReturnValue(cached);
      const layer = await builder.createLayer(buildDef(), buildOptions());
      expect(layer).toBe(cached);
      expect(cache.setItem).not.toHaveBeenCalled();
    });

    it('sets opacity from cached layer', async () => {
      const cached = buildMockLayer();
      cache.getItem.mockReturnValue(cached);
      await builder.createLayer(buildDef({ opacity: 0.5 }), buildOptions());
      expect(cached.setOpacity).toHaveBeenCalledWith(0.5);
    });

    it('defaults opacity to 1.0 when opacity is undefined', async () => {
      const cached = buildMockLayer();
      cache.getItem.mockReturnValue(cached);
      await builder.createLayer(buildDef({ opacity: undefined }), buildOptions());
      expect(cached.setOpacity).toHaveBeenCalledWith(1.0);
    });

    it('sets opacity on breakPointLayer sublayers when using cache', async () => {
      const sublayer = buildMockLayer();
      const cached = { ...buildMockLayer(), getLayersArray: () => [sublayer] };
      cache.getItem.mockReturnValue(cached);
      const def = buildDef({
        opacity: 0.7,
        breakPointLayer: { projections: { geographic: {} }, breakPointType: 'max' },
      });
      await builder.createLayer(def, buildOptions());
      expect(sublayer.setOpacity).toHaveBeenCalledWith(0.7);
    });

    it('uses options.group activeB', async () => {
      const layer = await builder.createLayer(buildDef(), buildOptions({ group: 'activeB' }));
      expect(layer).toBeDefined();
    });

    it('falls back to activeString when options.group is not set', async () => {
      const layer = await builder.createLayer(buildDef(), buildOptions({ group: undefined }));
      expect(layer).toBeDefined();
    });

    it('creates wrapped layer group for geographic proj with wrapadjacentdays', async () => {
      const OlLayerGroup = require('ol/layer/Group');
      await builder.createLayer(buildDef({ wrapadjacentdays: true }), buildOptions());
      expect(OlLayerGroup).toHaveBeenCalled();
    });

    it('does not wrap in non-geographic projection', async () => {
      const OlLayerGroup = require('ol/layer/Group');
      store = buildStore({
        proj: {
          id: 'arctic',
          selected: { id: 'arctic', crs: 'EPSG:3413', maxExtent: [-4194304, -4194304, 4194304, 4194304], resolutions: [1, 0.5] },
        },
        layers: { active: { activeTab: 'layers' }, activeB: { activeTab: 'layers' } },
      });
      builder = mapLayerBuilder(config, cache, store);
      OlLayerGroup.mockClear();
      const def = buildDef({ wrapadjacentdays: true, projections: { arctic: {} } });
      await builder.createLayer(def, buildOptions());
      expect(OlLayerGroup).not.toHaveBeenCalled();
    });

    it('handles wrapX flag on def', async () => {
      const layer = await builder.createLayer(buildDef({ wrapX: true }), buildOptions());
      expect(layer).toBeDefined();
    });
  });

  describe('createLayer - wms type', () => {
    it('returns a layer for a wms def', async () => {
      const layer = await builder.createLayer(
        buildDef({ type: 'wms', format: 'image/png', tileSize: [512, 512] }),
        buildOptions(),
      );
      expect(layer).toBeDefined();
    });

    it('throws error when wms source is invalid', async () => {
      await expect(
        builder.createLayer(buildDef({ type: 'wms', source: 'nonexistent-source' }), buildOptions()),
      ).rejects.toThrow('Invalid source');
    });

    it('handles geographic proj resolution override for WMS', async () => {
      const { getGeographicResolutionWMS } = require('./util');
      await builder.createLayer(
        buildDef({ type: 'wms', format: 'image/png', tileSize: [512, 512] }),
        buildOptions(),
      );
      expect(getGeographicResolutionWMS).toHaveBeenCalled();
    });

    it('handles EUMETSAT wms source with version 1.3.0', async () => {
      const layer = await builder.createLayer(
        buildDef({ type: 'wms', source: 'EUMETSAT:wms', format: 'image/png', tileSize: [512, 512] }),
        buildOptions(),
      );
      expect(layer).toBeDefined();
    });

    it('handles wms with styles property', async () => {
      const layer = await builder.createLayer(
        buildDef({ type: 'wms', format: 'image/png', styles: 'my-style' }),
        buildOptions(),
      );
      expect(layer).toBeDefined();
    });

    it('handles wms with wrapadjacentdays (covers day=1 and day=-1 branches)', async () => {
      const OlLayerGroup = require('ol/layer/Group');
      await builder.createLayer(
        buildDef({ type: 'wms', format: 'image/png', wrapadjacentdays: true }),
        buildOptions(),
      );
      expect(OlLayerGroup).toHaveBeenCalled();
    });

    it('handles wms with palette active', async () => {
      const { isActive, getLookup } = require('../modules/palettes/selectors');
      isActive.mockReturnValue(true);
      getLookup.mockReturnValue({ 0: { r: 255, g: 0, b: 0 } });
      const layer = await builder.createLayer(
        buildDef({ type: 'wms', format: 'image/png' }),
        buildOptions(),
      );
      expect(layer).toBeDefined();
    });

    it('handles wms with resolutionBreakPoint', async () => {
      const layer = await builder.createLayer(
        buildDef({
          type: 'wms',
          format: 'image/png',
          breakPointLayer: { projections: { geographic: { resolutionBreakPoint: 500 } } },
        }),
        buildOptions(),
      );
      expect(layer).toBeDefined();
    });

    it('handles non-geographic proj for WMS', async () => {
      store = buildStore({
        proj: {
          id: 'arctic',
          selected: { id: 'arctic', crs: 'EPSG:3413', maxExtent: [-4194304, -4194304, 4194304, 4194304], resolutions: [1, 0.5] },
        },
        layers: { active: { activeTab: 'layers' }, activeB: { activeTab: 'layers' } },
      });
      builder = mapLayerBuilder(config, cache, store);
      const layer = await builder.createLayer(
        buildDef({ type: 'wms', source: 'test-source', format: 'image/png', projections: { arctic: {} } }),
        buildOptions(),
      );
      expect(layer).toBeDefined();
    });

    it('handles wms with subdaily period', async () => {
      const layer = await builder.createLayer(
        buildDef({ type: 'wms', format: 'image/png', period: 'subdaily' }),
        buildOptions({ date: new Date('2021-01-01T12:00:00.000Z') }),
      );
      expect(layer).toBeDefined();
    });
  });

  describe('createLayer - xyz type', () => {
    it('returns a layer for xyz def with active group', async () => {
      const layer = await builder.createLayer(
        buildDef({ type: 'xyz', source: 'test-xyz', layerName: 'test-xyz-layer', maxZoom: 10 }),
        buildOptions(),
      );
      expect(layer).toBeDefined();
    });

    it('returns a layer for xyz def with activeB group', async () => {
      const layer = await builder.createLayer(
        buildDef({ type: 'xyz', source: 'test-xyz', layerName: 'test-xyz-layer', maxZoom: 10 }),
        buildOptions({ group: 'activeB' }),
      );
      expect(layer).toBeDefined();
    });
  });

  describe('createLayer - esriMapServer type', () => {
    it('returns a layer for esriMapServer def', async () => {
      const layer = await builder.createLayer(
        buildDef({ type: 'esriMapServer', source: 'test-esri' }),
        buildOptions(),
      );
      expect(layer).toBeDefined();
    });
  });

  describe('createLayer - vector type', () => {
    it('returns a layer for vector def (non-AERONET)', async () => {
      const layer = await builder.createLayer(
        buildDef({ type: 'vector', source: 'test-vector', matrixSet: 'testMatrixSet', projections: { geographic: {} } }),
        buildOptions(),
      );
      expect(layer).toBeDefined();
    });

    it('throws error for vector layer with invalid source', async () => {
      await expect(
        builder.createLayer(
          buildDef({ type: 'vector', source: 'nonexistent', matrixSet: 'testMatrixSet', projections: { geographic: {} } }),
          buildOptions(),
        ),
      ).rejects.toThrow('Invalid source');
    });

    it('throws error for vector layer with missing matrixSet', async () => {
      await expect(
        builder.createLayer(
          buildDef({ type: 'vector', source: 'test-vector', matrixSet: 'missingMatrixSet', projections: { geographic: {} } }),
          buildOptions(),
        ),
      ).rejects.toThrow('Undefined matrix set');
    });

    it('returns vector layer for AERONET source', async () => {
      builder = mapLayerBuilder(
        buildConfig({ AERONET: { url: 'https://aeronet.example.com', matrixSets: {} } }),
        cache,
        store,
      );
      const layer = await builder.createLayer(
        buildDef({ type: 'vector', source: 'AERONET', projections: { geographic: {} } }),
        buildOptions(),
      );
      expect(layer).toBeDefined();
    });

    it('throws error for AERONET with missing source config', async () => {
      const noAeronetConfig = buildConfig();
      delete noAeronetConfig.sources.AERONET;
      builder = mapLayerBuilder(noAeronetConfig, cache, store);
      await expect(
        builder.createLayer(
          buildDef({ type: 'vector', source: 'AERONET', projections: { geographic: {} } }),
          buildOptions(),
        ),
      ).rejects.toThrow('Invalid source');
    });

    it('handles vector layer with def.matrixIds explicitly defined', async () => {
      const layer = await builder.createLayer(
        buildDef({ type: 'vector', source: 'test-vector', matrixSet: 'testMatrixSet', matrixIds: [0, 1], projections: { geographic: {} } }),
        buildOptions(),
      );
      expect(layer).toBeDefined();
    });

    it('handles vector layer with wrapadjacentdays', async () => {
      const layer = await builder.createLayer(
        buildDef({ type: 'vector', source: 'test-vector', matrixSet: 'testMatrixSet', wrapadjacentdays: true, projections: { geographic: {} } }),
        buildOptions(),
      );
      expect(layer).toBeDefined();
    });

    it('handles vector layer with max breakPointLayer and animation not playing', async () => {
      const layer = await builder.createLayer(
        buildDef({
          type: 'vector',
          source: 'test-vector',
          matrixSet: 'testMatrixSet',
          projections: { geographic: {} },
          breakPointLayer: { projections: { geographic: { resolutionBreakPoint: 1000 } }, breakPointType: 'max' },
        }),
        buildOptions(),
      );
      expect(layer).toBeDefined();
    });

    it('handles vector layer with min breakPointLayer', async () => {
      const layer = await builder.createLayer(
        buildDef({
          type: 'vector',
          source: 'test-vector',
          matrixSet: 'testMatrixSet',
          projections: { geographic: {} },
          breakPointLayer: { projections: { geographic: { resolutionBreakPoint: 1000 } }, breakPointType: 'min' },
        }),
        buildOptions(),
      );
      expect(layer).toBeDefined();
    });

    it('handles vector layer with breakPointLayer and animation playing', async () => {
      store = buildStore({
        animation: { isPlaying: true },
        layers: { active: { activeTab: 'layers' }, activeB: { activeTab: 'layers' } },
      });
      builder = mapLayerBuilder(config, cache, store);
      const layer = await builder.createLayer(
        buildDef({
          type: 'vector',
          source: 'test-vector',
          matrixSet: 'testMatrixSet',
          projections: { geographic: {} },
          breakPointLayer: { projections: { geographic: { resolutionBreakPoint: 1000 } }, breakPointType: 'max' },
        }),
        buildOptions(),
      );
      expect(layer).toBeDefined();
    });
  });

  describe('createLayer - indexedVector type', () => {
    const baseIndexedDef = () =>
      buildDef({
        type: 'indexedVector',
        source: 'test-indexed',
        layerName: 'test-indexed-layer',
        serviceName: 'testService',
        tiles: ['tile1'],
        vectorStyle: {},
        matrixSet: 'testMatrixSet',
        matrixSetLimits: null,
        projections: { geographic: {} },
      });

    it('returns a layer for indexedVector def without vectorStyle.url', async () => {
      const layer = await builder.createLayer(baseIndexedDef(), buildOptions());
      expect(layer).toBeDefined();
    });

    it('returns a layer for indexedVector def with vectorStyle.url', async () => {
      const { applyStyle: olmsApplyStyle, applyBackground } = require('ol-mapbox-style');
      const def = { ...baseIndexedDef(), vectorStyle: { url: 'https://style.example.com/style.json' } };
      await builder.createLayer(def, buildOptions());
      expect(olmsApplyStyle).toHaveBeenCalled();
      expect(applyBackground).toHaveBeenCalled();
    });

    it('uses configMatrixSet fallback when matrixSet missing from source', async () => {
      const def = { ...baseIndexedDef(), matrixSet: 'nonexistentMatrixSet' };
      const layer = await builder.createLayer(def, buildOptions());
      expect(layer).toBeDefined();
    });

    it('handles shifted option for indexedVector', async () => {
      const layer = await builder.createLayer(baseIndexedDef(), buildOptions({ shifted: true }));
      expect(layer).toBeDefined();
    });

    it('handles transformRequest with Source type returning modified Request', async () => {
      const { applyStyle: olmsApplyStyle } = require('ol-mapbox-style');
      let capturedTransformRequest;
      olmsApplyStyle.mockImplementationOnce((layer, url, opts) => {
        capturedTransformRequest = opts.transformRequest;
        return Promise.resolve();
      });
      const def = { ...baseIndexedDef(), vectorStyle: { url: 'https://style.example.com/style.json' } };
      await builder.createLayer(def, buildOptions());
      expect(capturedTransformRequest).toBeDefined();
      const result = capturedTransformRequest('https://example.com/VectorTileServer/layer', 'Source');
      expect(result).toBeDefined();
    });

    it('handles transformRequest with non-Source type returning undefined', async () => {
      const { applyStyle: olmsApplyStyle } = require('ol-mapbox-style');
      let capturedTransformRequest;
      olmsApplyStyle.mockImplementationOnce((layer, url, opts) => {
        capturedTransformRequest = opts.transformRequest;
        return Promise.resolve();
      });
      const def = { ...baseIndexedDef(), vectorStyle: { url: 'https://style.example.com/style.json' } };
      await builder.createLayer(def, buildOptions());
      const result = capturedTransformRequest('https://example.com/something', 'Tiles');
      expect(result).toBeUndefined();
    });
  });

  describe('createLayer - composite:wmts type', () => {
    it('returns a layer for composite:wmts with matching date', async () => {
      const def = buildDef({
        type: 'composite:wmts',
        source: 'test-source',
        matrixSet: 'EPSG4326_250m',
        format: 'image/jpeg',
        matrixSetLimits: null,
        layers: ['layer_20210101', 'layer_20210102'],
        projections: { geographic: {} },
      });
      const layer = await builder.createLayer(def, buildOptions({ date: new Date('2021-01-01T00:00:00.000Z') }));
      expect(layer).toBeDefined();
    });

    it('handles composite wmts where no layers match date', async () => {
      const def = buildDef({
        type: 'composite:wmts',
        source: 'test-source',
        matrixSet: 'EPSG4326_250m',
        format: 'image/jpeg',
        matrixSetLimits: null,
        layers: ['layer_20210102'],
        projections: { geographic: {} },
      });
      const layer = await builder.createLayer(def, buildOptions({ date: new Date('2021-01-01T00:00:00.000Z') }));
      expect(layer).toBeDefined();
    });

    it('handles composite wmts with MAXAR source', async () => {
      const maxarConfig = buildConfig({
        'MAXAR:wmts': {
          url: 'https://maxar.example.com',
          matrixSets: {
            EPSG4326_250m: {
              id: 'EPSG4326_250m',
              resolutions: [0.5, 0.25],
              tileSize: [512, 512],
              tileMatrices: [],
            },
          },
        },
      });
      builder = mapLayerBuilder(maxarConfig, cache, store);
      const def = buildDef({
        type: 'composite:wmts',
        source: 'MAXAR:wmts',
        matrixSet: 'EPSG4326_250m',
        format: 'image/jpeg',
        matrixSetLimits: null,
        layers: ['layer_20210101'],
        projections: { geographic: {} },
      });
      const layer = await builder.createLayer(def, buildOptions({ date: new Date('2021-01-01T00:00:00.000Z') }));
      expect(layer).toBeDefined();
    });

    it('uses getSelectedDate when options.date is not available for composite', async () => {
      const def = buildDef({
        type: 'composite:wmts',
        source: 'test-source',
        matrixSet: 'EPSG4326_250m',
        format: 'image/jpeg',
        matrixSetLimits: null,
        layers: ['layer_20210101'],
        projections: { geographic: {} },
      });
      const layer = await builder.createLayer(def, buildOptions({ date: undefined }));
      expect(layer).toBeDefined();
    });
  });

  describe('createLayer - granule type', () => {
    it('returns a layer for granule def', async () => {
      const layer = await builder.createLayer(
        buildDef({ type: 'granule', projections: { geographic: {} } }),
        buildOptions(),
      );
      expect(layer).toBeDefined();
    });

    it('does not call cache.setItem for granule type', async () => {
      await builder.createLayer(
        buildDef({ type: 'granule', projections: { geographic: {} } }),
        buildOptions(),
      );
      expect(cache.setItem).not.toHaveBeenCalled();
    });
  });

  describe('createLayer - titiler type', () => {
    const baseTitilerDef = () =>
      buildDef({
        type: 'titiler',
        source: 'test-source',
        bandCombo: {
          r: 'B4',
          g: 'B3',
          b: 'B2',
          assets: [],
          expression: 'B4/B3',
          rescale: '0,1',
          colormap_name: 'viridis',
          asset_as_band: true,
          bands_regex: '.*',
          color_formula: null,
        },
        collectionConceptID: 'C1234-PODAAC',
        minZoom: 3,
        projections: { geographic: {} },
      });

    it('returns a layer group for titiler def with active group', async () => {
      const layer = await builder.createLayer(baseTitilerDef(), buildOptions());
      expect(layer).toBeDefined();
    });

    it('does not call setVisible for titiler layer', async () => {
      const layer = await builder.createLayer(baseTitilerDef(), buildOptions());
      expect(layer.setVisible).not.toHaveBeenCalled();
    });

    it('returns a layer for titiler def with activeB group', async () => {
      const layer = await builder.createLayer(baseTitilerDef(), buildOptions({ group: 'activeB' }));
      expect(layer).toBeDefined();
    });

    it('uses conceptIds array when collectionConceptID is not set', async () => {
      const def = { ...baseTitilerDef(), collectionConceptID: undefined, conceptIds: [{ value: 'C9999-NSIDC' }] };
      const layer = await builder.createLayer(def, buildOptions());
      expect(layer).toBeDefined();
    });
  });

  describe('createLayer - unknown type', () => {
    it('throws for unknown layer type', async () => {
      await expect(
        builder.createLayer(buildDef({ type: 'unknown-type', projections: { geographic: {} } }), buildOptions()),
      ).rejects.toThrow('Unknown layer type');
    });
  });

  describe('createLayer - static image (kiosk mode)', () => {
    it('returns a static image layer in kiosk mode', async () => {
      store = buildStore({ ui: { isKioskModeActive: true, displayStaticMap: true } });
      builder = mapLayerBuilder(config, cache, store);
      const layer = await builder.createLayer(buildDef(), buildOptions());
      expect(layer).toBeDefined();
    });
  });

  describe('createLayer - TEMPO layer handling', () => {
    let mockWorker;

    beforeEach(() => {
      mockWorker = { postMessage: jest.fn(), terminate: jest.fn(), onmessage: null, onerror: null };
      global.Worker = jest.fn().mockImplementation(() => mockWorker);
      global.DOMParser = jest.fn().mockImplementation(() => ({
        parseFromString: jest.fn().mockReturnValue({
          querySelector: jest.fn().mockReturnValue(null),
        }),
      }));
    });

    it('calls tempoCallback immediately for TEMPO layers without tempoDateRanges', () => {
      const tempoCallback = jest.fn();
      const def = buildDef({ id: 'TEMPO_NO2_Hourly', projections: { geographic: {} } });
      builder.createLayer(def, buildOptions({ tempoCallback }));
      expect(tempoCallback).toHaveBeenCalledWith(def, [], 'active');
    });

    it('does not call tempoCallback when tempoDateRanges is already set', async () => {
      const tempoCallback = jest.fn();
      const def = buildDef({
        id: 'TEMPO_NO2_Hourly',
        tempoDateRanges: [{ startDate: '2021-01-01', endDate: '2021-01-02', dateInterval: '60' }],
        projections: { geographic: {} },
      });
      await builder.createLayer(def, buildOptions({ tempoCallback }));
      expect(tempoCallback).not.toHaveBeenCalled();
    });

    it('does not call tempoCallback when not a TEMPO layer', async () => {
      const tempoCallback = jest.fn();
      await builder.createLayer(buildDef({ id: 'regular-layer' }), buildOptions({ tempoCallback }));
      expect(tempoCallback).not.toHaveBeenCalled();
    });

    it('does not call tempoCallback when tempoCallback is not provided', async () => {
      const def = buildDef({ id: 'TEMPO_NO2_Hourly', projections: { geographic: {} } });
      const layer = await builder.createLayer(def, buildOptions({ tempoCallback: undefined }));
      expect(layer).toBeDefined();
    });
  });

  describe('getRequestDates', () => {
    it('uses options.date when provided', async () => {
      const layer = await builder.createLayer(buildDef(), buildOptions({ date: new Date('2020-06-15T00:00:00.000Z') }));
      expect(layer).toBeDefined();
    });

    it('falls back to stateCurrentDate when options.date is not set', async () => {
      const layer = await builder.createLayer(buildDef(), buildOptions({ date: undefined }));
      expect(layer).toBeDefined();
    });

    it('uses cached previousDate/nextDate range when current date is within it', async () => {
      const now = new Date('2021-01-01T12:00:00.000Z');
      const prev = new Date('2021-01-01T00:00:00.000Z');
      const next = new Date('2021-01-02T00:00:00.000Z');
      const layer = await builder.createLayer(
        buildDef(),
        buildOptions({ date: now, previousLayer: { previousDate: prev, nextDate: next } }),
      );
      expect(layer).toBeDefined();
    });

    it('handles ongoing daily period with multiple dateRange intervals', async () => {
      const layer = await builder.createLayer(
        buildDef({
          ongoing: true,
          period: 'daily',
          dateRanges: [
            { startDate: '2020-01-01', endDate: '2020-06-01', dateInterval: '1' },
            { startDate: '2020-06-01', endDate: '2021-01-01', dateInterval: '3' },
          ],
        }),
        buildOptions(),
      );
      expect(layer).toBeDefined();
    });

    it('handles ongoing monthly period', async () => {
      const layer = await builder.createLayer(
        buildDef({ ongoing: true, period: 'monthly', dateRanges: [] }),
        buildOptions(),
      );
      expect(layer).toBeDefined();
    });

    it('handles ongoing yearly period', async () => {
      const layer = await builder.createLayer(
        buildDef({ ongoing: true, period: 'yearly', dateRanges: [] }),
        buildOptions(),
      );
      expect(layer).toBeDefined();
    });

    it('handles ongoing subdaily period (else branch)', async () => {
      const layer = await builder.createLayer(
        buildDef({ ongoing: true, period: 'subdaily', dateRanges: [] }),
        buildOptions(),
      );
      expect(layer).toBeDefined();
    });

    it('handles non-ongoing with no dateRanges', async () => {
      const layer = await builder.createLayer(
        buildDef({ ongoing: false, period: 'daily' }),
        buildOptions(),
      );
      expect(layer).toBeDefined();
    });
  });

  describe('layerKey', () => {
    it('cache key is a string for periodic layers', async () => {
      await builder.createLayer(buildDef({ period: 'daily' }), buildOptions());
      expect(typeof cache.setItem.mock.calls[0][0]).toBe('string');
    });

    it('does not include date in key for static layers (no period)', async () => {
      const layer = await builder.createLayer(buildDef({ period: undefined }), buildOptions());
      expect(layer).toBeDefined();
    });

    it('includes palette key when palette is active', async () => {
      const { isActive } = require('../modules/palettes/selectors');
      isActive.mockReturnValue(true);
      const layer = await builder.createLayer(buildDef(), buildOptions());
      expect(layer).toBeDefined();
    });

    it('includes vector style key when vector style is active', async () => {
      const { isActive } = require('../modules/vector-styles/selectors');
      isActive.mockReturnValue(true);
      const layer = await builder.createLayer(buildDef(), buildOptions());
      expect(layer).toBeDefined();
    });

    it('uses subdaily date format in key for subdaily period', async () => {
      await builder.createLayer(buildDef({ period: 'subdaily' }), buildOptions());
      expect(cache.setItem).toHaveBeenCalled();
    });
  });

  describe('getCacheOptions', () => {
    it('returns empty object for non-subdaily period', async () => {
      await builder.createLayer(buildDef({ period: 'daily' }), buildOptions());
      expect(cache.setItem.mock.calls[0][2]).toEqual({});
    });

    it('returns empty object for subdaily layer older than 30 minutes', async () => {
      await builder.createLayer(
        buildDef({ period: 'subdaily' }),
        buildOptions({ date: new Date('2000-01-01T00:00:00.000Z') }),
      );
      expect(cache.setItem.mock.calls[0][2]).toEqual({});
    });
  });

  describe('createLayerWMTS - internal branches', () => {
    it('handles palette active (tileClass lookup)', async () => {
      const { isActive, getLookup } = require('../modules/palettes/selectors');
      const lookupFactory = require('../ol/lookupimagetile');
      isActive.mockReturnValue(true);
      getLookup.mockReturnValue({ 0: { r: 255, g: 0, b: 0 } });
      await builder.createLayer(buildDef(), buildOptions());
      expect(lookupFactory).toHaveBeenCalled();
    });

    it('handles subdaily wmts layer', async () => {
      const layer = await builder.createLayer(
        buildDef({ period: 'subdaily' }),
        buildOptions({ date: new Date('2021-01-01T10:00:00.000Z') }),
      );
      expect(layer).toBeDefined();
    });

    it('handles subdaily wmts with null date', async () => {
      const layer = await builder.createLayer(
        buildDef({ period: 'subdaily' }),
        buildOptions({ date: null }),
      );
      expect(layer).toBeDefined();
    });

    it('uses sourceOverride url for wmts layer', async () => {
      const layer = await builder.createLayer(
        buildDef({ sourceOverride: 'https://override.example.com' }),
        buildOptions(),
      );
      expect(layer).toBeDefined();
    });

    it('handles matching matrixSetLimits length (calcExtentsFromLimits full path)', async () => {
      const configWithLimits = buildConfig({
        'test-source': {
          url: 'https://gibs.example.com',
          matrixSets: {
            EPSG4326_250m: {
              id: 'EPSG4326_250m',
              resolutions: [0.5, 0.25],
              tileSize: [512, 512],
              tileMatrices: [{
                matrixWidth: 2,
                matrixHeight: 1,
              }, { matrixWidth: 4, matrixHeight: 2 }],
              origin: [-180, 90],
              extent: [-180, -90, 180, 90],
            },
          },
        },
      });
      builder = mapLayerBuilder(configWithLimits, cache, store);
      const layer = await builder.createLayer(
        buildDef({
          matrixSetLimits: [
            { minTileCol: 0, maxTileCol: 1, minTileRow: 0, maxTileRow: 0 },
            { minTileCol: 0, maxTileCol: 3, minTileRow: 0, maxTileRow: 1 },
          ],
        }),
        buildOptions(),
      );
      expect(layer).toBeDefined();
    });

    it('handles wmts with explicit style defined', async () => {
      const layer = await builder.createLayer(buildDef({ style: 'my-style' }), buildOptions());
      expect(layer).toBeDefined();
    });

    it('throws error when wmts matrixSet is invalid', async () => {
      await expect(
        builder.createLayer(buildDef({ matrixSet: 'nonexistentMatrixSet' }), buildOptions()),
      ).rejects.toThrow('Undefined matrix set');
    });

    it('handles shifted option using RIGHT_WING_ORIGIN and RIGHT_WING_EXTENT', async () => {
      const layer = await builder.createLayer(buildDef(), buildOptions({ shifted: true }));
      expect(layer).toBeDefined();
    });

    it('handles tileMatrices undefined (produces empty sizes array)', async () => {
      const configNoMatrices = buildConfig({
        'test-source': {
          url: 'https://gibs.example.com',
          matrixSets: {
            EPSG4326_250m: {
              id: 'EPSG4326_250m',
              resolutions: [0.5, 0.25],
              tileSize: [512, 512],
              tileMatrices: undefined,
            },
          },
        },
      });
      builder = mapLayerBuilder(configNoMatrices, cache, store);
      const layer = await builder.createLayer(buildDef(), buildOptions());
      expect(layer).toBeDefined();
    });
  });

  describe('createLayerVectorAeronet - internal branches', () => {
    it('handles subdaily AERONET with null date (uses getRequestDates)', async () => {
      builder = mapLayerBuilder(
        buildConfig({ AERONET: { url: 'https://aeronet.example.com', matrixSets: {} } }),
        cache,
        store,
      );
      const layer = await builder.createLayer(
        buildDef({ type: 'vector', source: 'AERONET', period: 'subdaily', projections: { geographic: {} } }),
        buildOptions({ date: null }),
      );
      expect(layer).toBeDefined();
    });
  });

  describe('cmrRebuildAttempts attribute spread', () => {
    it('includes cmrRebuildAttempts in attributes when provided as non-null', async () => {
      await builder.createLayer(buildDef(), buildOptions({ cmrRebuildAttempts: 3 }));
      expect(cache.setItem).toHaveBeenCalled();
    });

    it('excludes cmrRebuildAttempts from attributes when null', async () => {
      await builder.createLayer(buildDef(), buildOptions({ cmrRebuildAttempts: null }));
      expect(cache.setItem).toHaveBeenCalled();
    });
  });

  describe('getUpdatedDateRanges worker messaging', () => {
    let mockWorker;

    beforeEach(() => {
      mockWorker = { postMessage: jest.fn(), terminate: jest.fn(), onmessage: null, onerror: null };
      global.Worker = jest.fn().mockImplementation(() => mockWorker);
      global.DOMParser = jest.fn().mockImplementation(() => ({
        parseFromString: jest.fn().mockReturnValue({
          querySelector: jest.fn().mockReturnValue(null),
        }),
      }));
    });

    it('handles worker onmessage with final array data format', async () => {
      const tempoCallback = jest.fn();
      const def = buildDef({
        id: 'TEMPO_NO2_Hourly',
        projections: { geographic: {} },
        dateRanges: [{ startDate: '2021-01-01', endDate: '2021-01-02', dateInterval: '60' }],
      });
      await builder.createLayer(def, buildOptions({ tempoCallback }));
      mockWorker.onmessage({ data: [['2021-01-01T00:00:00Z', '2021-01-02T00:00:00Z', '60']] });
      expect(mockWorker.terminate).toHaveBeenCalled();
      expect(tempoCallback).toHaveBeenCalledTimes(2);
    });

    it('handles worker onmessage with xml string and valid Domain element', async () => {
      global.DOMParser = jest.fn().mockImplementation(() => ({
        parseFromString: jest.fn().mockReturnValue({
          querySelector: jest.fn().mockReturnValue({ textContent: 'domain1 domain2' }),
        }),
      }));
      const tempoCallback = jest.fn();
      await builder.createLayer(
        buildDef({ id: 'TEMPO_NO2_Hourly', projections: { geographic: {} } }),
        buildOptions({ tempoCallback }),
      );
      mockWorker.onmessage({ data: '<xml>some xml</xml>' });
      expect(mockWorker.postMessage).toHaveBeenCalledTimes(2);
    });

    it('handles worker onmessage with xml string and null Domain element', async () => {
      global.DOMParser = jest.fn().mockImplementation(() => ({
        parseFromString: jest.fn().mockReturnValue({
          querySelector: jest.fn().mockReturnValue(null),
        }),
      }));
      const tempoCallback = jest.fn();
      await builder.createLayer(
        buildDef({ id: 'TEMPO_NO2_Hourly', projections: { geographic: {} } }),
        buildOptions({ tempoCallback }),
      );
      mockWorker.onmessage({ data: '<xml>empty</xml>' });
      expect(mockWorker.terminate).toHaveBeenCalled();
      expect(tempoCallback).toHaveBeenCalledTimes(2);
    });

    it('handles worker onerror by terminating and calling callback', async () => {
      const tempoCallback = jest.fn();
      await builder.createLayer(
        buildDef({ id: 'TEMPO_NO2_Hourly', projections: { geographic: {} } }),
        buildOptions({ tempoCallback }),
      );
      mockWorker.onerror();
      expect(mockWorker.terminate).toHaveBeenCalled();
      expect(tempoCallback).toHaveBeenCalledTimes(2);
    });

    it('formats existing dateRanges where startDate equals endDate', async () => {
      const tempoCallback = jest.fn();
      const sameDate = '2021-01-01T00:00:00.000Z';
      const def = buildDef({
        id: 'TEMPO_NO2_Hourly',
        projections: { geographic: {} },
        dateRanges: [{ startDate: sameDate, endDate: sameDate, dateInterval: '60' }],
      });
      await builder.createLayer(def, buildOptions({ tempoCallback }));
      mockWorker.onmessage({ data: [['2021-01-01T00:00:00Z', '2021-01-02T00:00:00Z', '60']] });
      expect(tempoCallback).toHaveBeenCalledTimes(2);
    });
  });
});
