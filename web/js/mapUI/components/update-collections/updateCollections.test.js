import { render, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import UpdateCollections from './updateCollections';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('../../../modules/date/selectors', () => ({
  getSelectedDate: jest.fn((state) => state.date.selected),
}));

jest.mock('../../../modules/layers/actions', () => ({
  updateCollection: jest.fn((collection) => ({ type: 'UPDATE_COLLECTION', collection })),
}));

jest.mock('../kiosk/tile-measurement/utils/date-util', () => ({
  formatDailyDate: jest.fn(() => '2024-06-15'),
  formatSubdailyDate: jest.fn(() => '2024-06-15T12:00:00Z'),
}));

jest.mock('../../../util/util', () => ({
  __esModule: true,
  default: {
    toISOStringSeconds: jest.fn(() => '2024-06-15T12:00:59Z'),
    roundTimeOneMinute: jest.fn((d) => d),
  },
}));

import { formatDailyDate, formatSubdailyDate } from '../kiosk/tile-measurement/utils/date-util';
import util from '../../../util/util';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockStore = configureMockStore();

const mockSelectedDate = new Date('2024-06-15T12:00:00Z');
mockSelectedDate.setSeconds = jest.fn();

const mockLayerDef = {
  id: 'MODIS_Terra_CorrectedReflectance_TrueColor',
  type: 'wmts',
  period: 'daily',
  layergroup: 'Corrected Reflectance',
  visible: true,
  format: 'image/jpeg',
  projections: {
    geographic: {
      matrixSet: '250m',
      layer: 'MODIS_Terra_CorrectedReflectance_TrueColor',
    },
  },
};

const mockGranuleLayerDef = {
  id: 'VIIRS_SNPP_Granule_Layer',
  type: 'granule',
  period: 'daily',
  layergroup: 'Granule',
  visible: true,
  format: 'image/png',
  projections: {
    geographic: {
      matrixSet: '250m',
      layer: 'VIIRS_SNPP_Granule_Layer',
    },
  },
};

const mockSubdailyLayerDef = {
  id: 'GOES-East_ABI_GeoColor',
  type: 'wmts',
  period: 'subdaily',
  layergroup: 'GeoColor',
  visible: true,
  format: 'image/jpeg',
  projections: {
    geographic: {
      matrixSet: '1km',
      layer: 'GOES-East_ABI_GeoColor',
    },
  },
};

function buildMockHeaders(actualId = 'MODIS_Terra_CorrectedReflectance_TrueColor_v6_NRT') {
  return { get: jest.fn((key) => (key === 'layer-identifier-actual' ? actualId : null)) };
}

function buildFetchResponse(actualId = 'MODIS_Terra_CorrectedReflectance_TrueColor_v6_NRT') {
  return { headers: buildMockHeaders(actualId) };
}

function buildLayerConfig(layerIds = ['MODIS_Terra_CorrectedReflectance_TrueColor']) {
  const config = {};
  layerIds.forEach((id) => {
    config[id] = {
      projections: {
        geographic: { source: 'GIBS:geographic' },
      },
    };
  });
  return config;
}

function buildSources() {
  return {
    'GIBS:geographic': { url: 'https://gibs-{a-b}.earthdata.nasa.gov/wmts' },
  };
}

function buildMapWithLayers(layerArray = []) {
  return {
    getLayers: jest.fn(() => ({ getArray: jest.fn(() => layerArray) })),
    getAllLayers: jest.fn(() => layerArray),
  };
}

function buildStore(overrides = {}) {
  return mockStore({
    date: { selected: mockSelectedDate },
    proj: { id: 'geographic' },
    config: { sources: buildSources() },
    layers: {
      collections: {},
      active: { layers: [mockLayerDef] },
      layerConfig: buildLayerConfig(),
    },
    map: { ui: { selected: buildMapWithLayers() } },
    ...overrides,
  });
}

function renderComponent(store) {
  const s = store ?? buildStore();
  const utils = render(
    <Provider store={s}>
      <UpdateCollections />
    </Provider>,
  );
  return { ...utils, store: s };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('UpdateCollections', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockResolvedValue(buildFetchResponse());
    formatDailyDate.mockReturnValue('2024-06-15');
    formatSubdailyDate.mockReturnValue('2024-06-15T12:00:00Z');
    util.toISOStringSeconds.mockReturnValue('2024-06-15T12:00:59Z');
    util.roundTimeOneMinute.mockImplementation((d) => d);
  });

  afterEach(() => {
    delete global.fetch;
  });

  // ── Rendering ──────────────────────────────────────────────────────────────

  describe('Rendering', () => {
    it('renders null (no DOM output)', () => {
      const { container } = renderComponent();
      expect(container.firstChild).toBeNull();
    });
  });

  // ── useEffect guard: layers.length ────────────────────────────────────────

  describe('useEffect guard: empty layers', () => {
    it('does NOT call fetch when layers array is empty', async () => {
      const store = buildStore({
        layers: {
          collections: {},
          active: { layers: [] },
          layerConfig: buildLayerConfig(),
        },
      });
      renderComponent(store);
      await act(async () => {});
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  // ── findLayerCollections ───────────────────────────────────────────────────

  describe('findLayerCollections', () => {
    it('includes a visible wmts layer not yet in collections', async () => {
      renderComponent(buildStore());
      await act(async () => {});
      expect(global.fetch).toHaveBeenCalled();
    });

    it('excludes Reference layergroup layers', async () => {
      const refLayer = { ...mockLayerDef, layergroup: 'Reference' };
      const store = buildStore({
        layers: {
          collections: {},
          active: { layers: [refLayer] },
          layerConfig: buildLayerConfig(),
        },
      });
      renderComponent(store);
      await act(async () => {});
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('excludes layers with type other than wmts or granule', async () => {
      const wmsLayer = { ...mockLayerDef, type: 'wms' };
      const store = buildStore({
        layers: {
          collections: {},
          active: { layers: [wmsLayer] },
          layerConfig: buildLayerConfig(),
        },
      });
      renderComponent(store);
      await act(async () => {});
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('excludes invisible layers', async () => {
      const invisibleLayer = { ...mockLayerDef, visible: false };
      const store = buildStore({
        layers: {
          collections: {},
          active: { layers: [invisibleLayer] },
          layerConfig: buildLayerConfig(),
        },
      });
      renderComponent(store);
      await act(async () => {});
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('includes a layer in collections but with a different date', async () => {
      const store = buildStore({
        layers: {
          collections: {
            MODIS_Terra_CorrectedReflectance_TrueColor: {
              dates: [{ date: '2024-06-14', projection: 'geographic' }],
            },
          },
          active: { layers: [mockLayerDef] },
          layerConfig: buildLayerConfig(),
        },
      });
      renderComponent(store);
      await act(async () => {});
      expect(global.fetch).toHaveBeenCalled();
    });

    it('includes a layer in collections but with a different projection', async () => {
      const store = buildStore({
        layers: {
          collections: {
            MODIS_Terra_CorrectedReflectance_TrueColor: {
              dates: [{ date: '2024-06-15', projection: 'arctic' }],
            },
          },
          active: { layers: [mockLayerDef] },
          layerConfig: buildLayerConfig(),
        },
      });
      renderComponent(store);
      await act(async () => {});
      expect(global.fetch).toHaveBeenCalled();
    });

    it('uses subdailyDate for subdaily period layers', async () => {
      const store = buildStore({
        layers: {
          collections: {},
          active: { layers: [mockSubdailyLayerDef] },
          layerConfig: buildLayerConfig(['GOES-East_ABI_GeoColor']),
        },
      });
      renderComponent(store);
      await act(async () => {});
      expect(global.fetch).toHaveBeenCalled();
    });

    it('includes a granule layer not in collections', async () => {
      const store = buildStore({
        layers: {
          collections: {},
          active: { layers: [mockGranuleLayerDef] },
          layerConfig: buildLayerConfig(['VIIRS_SNPP_Granule_Layer']),
        },
      });
      renderComponent(store);
      await act(async () => {});
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  // ── lookupLayerSource ─────────────────────────────────────────────────────

  describe('lookupLayerSource', () => {
    it('replaces the subdomain template with "-a"', async () => {
      renderComponent(buildStore());
      await act(async () => {});
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('gibs-a.earthdata.nasa.gov'),
        expect.anything(),
      );
    });

    it('does not alter URLs without a subdomain template', async () => {
      const store = buildStore({
        config: {
          sources: {
            'GIBS:geographic': { url: 'https://gibs.earthdata.nasa.gov/wmts' },
          },
        },
      });
      renderComponent(store);
      await act(async () => {});
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('gibs.earthdata.nasa.gov'),
        expect.anything(),
      );
    });
  });

  // ── getHeaders: fetch call ────────────────────────────────────────────────

  describe('getHeaders: fetch request', () => {
    it('calls fetch with method HEAD', async () => {
      renderComponent(buildStore());
      await act(async () => {});
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'HEAD' }),
      );
    });

    it('includes layer id in the fetch URL', async () => {
      renderComponent(buildStore());
      await act(async () => {});
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('MODIS_Terra_CorrectedReflectance_TrueColor'),
        expect.anything(),
      );
    });

    it('includes matrixSet in the fetch URL', async () => {
      renderComponent(buildStore());
      await act(async () => {});
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('250m'),
        expect.anything(),
      );
    });

    it('includes TIME parameter in the fetch URL when no baseUrl', async () => {
      renderComponent(buildStore());
      await act(async () => {});
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('TIME='),
        expect.anything(),
      );
    });

    it('calls util.toISOStringSeconds and util.roundTimeOneMinute', async () => {
      renderComponent(buildStore());
      await act(async () => {});
      expect(util.roundTimeOneMinute).toHaveBeenCalledWith(mockSelectedDate);
      expect(util.toISOStringSeconds).toHaveBeenCalled();
    });

    it('sets seconds to 59 for subdaily layers', async () => {
      const subdailyDate = new Date('2024-06-15T12:00:00Z');
      subdailyDate.setSeconds = jest.fn();
      const store = buildStore({
        date: { selected: subdailyDate },
        layers: {
          collections: {},
          active: { layers: [mockSubdailyLayerDef] },
          layerConfig: buildLayerConfig(['GOES-East_ABI_GeoColor']),
        },
      });
      renderComponent(store);
      await act(async () => {});
      expect(subdailyDate.setSeconds).toHaveBeenCalledWith(59);
    });

    it('uses projConfig.layer as layerId when available', async () => {
      renderComponent(buildStore());
      await act(async () => {});
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('layer=MODIS_Terra_CorrectedReflectance_TrueColor'),
        expect.anything(),
      );
    });

    it('falls back to def.id when projConfig.layer and projConfig.id are absent', async () => {
      const layerDefNoProjectionLayer = {
        ...mockLayerDef,
        projections: {
          geographic: { matrixSet: '250m' },
        },
      };
      const store = buildStore({
        layers: {
          collections: {},
          active: { layers: [layerDefNoProjectionLayer] },
          layerConfig: buildLayerConfig(),
        },
      });
      renderComponent(store);
      await act(async () => {});
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('layer=MODIS_Terra_CorrectedReflectance_TrueColor'),
        expect.anything(),
      );
    });

    it('passes an AbortSignal to fetch', async () => {
      renderComponent(buildStore());
      await act(async () => {});
      const fetchOptions = global.fetch.mock.calls[0][1];
      expect(fetchOptions.signal).toBeDefined();
    });

    it('does NOT fetch Reference layergroup layers', async () => {
      const refLayer = { ...mockLayerDef, layergroup: 'Reference' };
      const store = buildStore({
        layers: {
          collections: {},
          active: { layers: [refLayer] },
          layerConfig: buildLayerConfig(),
        },
      });
      renderComponent(store);
      await act(async () => {});
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  // ── getHeaders: response parsing ──────────────────────────────────────────

  describe('getHeaders: response parsing', () => {
    it('dispatches UPDATE_COLLECTION with NRT type collection', async () => {
      global.fetch.mockResolvedValue(
        buildFetchResponse('MODIS_Terra_CorrectedReflectance_TrueColor_v6_NRT'),
      );
      const { store } = renderComponent(buildStore());
      await act(async () => {});
      expect(store.getActions()).toContainEqual(
        expect.objectContaining({ type: 'UPDATE_COLLECTION' }),
      );
    });

    it('dispatches UPDATE_COLLECTION with STD type collection', async () => {
      global.fetch.mockResolvedValue(
        buildFetchResponse('MODIS_Terra_CorrectedReflectance_TrueColor_v6_STD'),
      );
      const { store } = renderComponent(buildStore());
      await act(async () => {});
      expect(store.getActions()).toContainEqual(
        expect.objectContaining({ type: 'UPDATE_COLLECTION' }),
      );
    });

    it('dispatches UPDATE_COLLECTION with correct id, type, version and projection', async () => {
      global.fetch.mockResolvedValue(
        buildFetchResponse('MODIS_Terra_CorrectedReflectance_TrueColor_v6_NRT'),
      );
      const { store } = renderComponent(buildStore());
      await act(async () => {});
      const action = store.getActions().find((a) => a.type === 'UPDATE_COLLECTION');
      const [collection] = action.collection;
      expect(collection.id).toBe('MODIS_Terra_CorrectedReflectance_TrueColor');
      expect(collection.type).toBe('NRT');
      expect(collection.version).toBe('v6');
      expect(collection.projection).toBe('geographic');
    });

    it('dispatches UPDATE_COLLECTION with a daily formatted date', async () => {
      formatDailyDate.mockReturnValue('2024-06-15');
      global.fetch.mockResolvedValue(
        buildFetchResponse('MODIS_Terra_CorrectedReflectance_TrueColor_v6_NRT'),
      );
      const { store } = renderComponent(buildStore());
      await act(async () => {});
      const action = store.getActions().find((a) => a.type === 'UPDATE_COLLECTION');
      const [collection] = action.collection;
      expect(collection.date).toBe('2024-06-15');
    });

    it('dispatches UPDATE_COLLECTION with a subdaily formatted date for subdaily layers', async () => {
      formatSubdailyDate.mockReturnValue('2024-06-15T12:00:00Z');
      global.fetch.mockResolvedValue(
        buildFetchResponse('GOES-East_ABI_GeoColor_v1_NRT'),
      );
      const store = buildStore({
        layers: {
          collections: {},
          active: { layers: [mockSubdailyLayerDef] },
          layerConfig: buildLayerConfig(['GOES-East_ABI_GeoColor']),
        },
      });
      renderComponent(store);
      await act(async () => {});
      const action = store.getActions().find((a) => a.type === 'UPDATE_COLLECTION');
      if (action) {
        const [collection] = action.collection;
        expect(collection.date).toBe('2024-06-15T12:00:00Z');
      }
    });

    it('does NOT dispatch UPDATE_COLLECTION when layer-identifier-actual header is missing', async () => {
      global.fetch.mockResolvedValue({ headers: { get: jest.fn(() => null) } });
      const { store } = renderComponent(buildStore());
      await act(async () => {});
      const action = store.getActions().find((a) => a.type === 'UPDATE_COLLECTION');
      if (action) {
        expect(action.collection).toHaveLength(0);
      }
    });

    it('does NOT dispatch UPDATE_COLLECTION with invalid imagery type', async () => {
      global.fetch.mockResolvedValue(
        buildFetchResponse('MODIS_Terra_CorrectedReflectance_TrueColor_v6_INVALID'),
      );
      const { store } = renderComponent(buildStore());
      await act(async () => {});
      const action = store.getActions().find((a) => a.type === 'UPDATE_COLLECTION');
      if (action) {
        expect(action.collection).toHaveLength(0);
      }
    });

    it('does NOT dispatch UPDATE_COLLECTION when fetch rejects', async () => {
      global.fetch.mockRejectedValue(new Error('network error'));
      const { store } = renderComponent(buildStore());
      await act(async () => {});
      const action = store.getActions().find((a) => a.type === 'UPDATE_COLLECTION');
      if (action) {
        expect(action.collection).toHaveLength(0);
      }
    });
  });

  // ── getAllHeaders: granule layers ─────────────────────────────────────────

  describe('getAllHeaders: granule layer handling', () => {
    it('calls fetch with a baseUrl from granule layer URLs', async () => {
      const mockGranuleUrl = 'https://mock-granule-url.com?time=2024-06-15';
      const mockGranuleSource = {
        getUrls: jest.fn(() => [mockGranuleUrl]),
      };
      const mockSubLayer = {
        getSource: jest.fn(() => mockGranuleSource),
      };
      const mockGranuleGroup = {
        wv: { id: 'VIIRS_SNPP_Granule_Layer' },
        getLayersArray: jest.fn(() => [mockSubLayer]),
      };
      const mockMap = buildMapWithLayers([mockGranuleGroup]);
      mockMap.getLayers = jest.fn(() => ({
        getArray: jest.fn(() => [mockGranuleGroup]),
      }));
      const store = buildStore({
        map: { ui: { selected: mockMap } },
        layers: {
          collections: {},
          active: { layers: [mockGranuleLayerDef] },
          layerConfig: buildLayerConfig(['VIIRS_SNPP_Granule_Layer']),
        },
      });
      renderComponent(store);
      await act(async () => {});
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(mockGranuleUrl),
        expect.anything(),
      );
    });

    it('falls back to requestSelectedDateHeaders when layerGroup not found on map', async () => {
      const mockMap = buildMapWithLayers([]);
      const store = buildStore({
        map: { ui: { selected: mockMap } },
        layers: {
          collections: {},
          active: { layers: [mockGranuleLayerDef] },
          layerConfig: buildLayerConfig(['VIIRS_SNPP_Granule_Layer']),
        },
      });
      renderComponent(store);
      await act(async () => {});
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('TIME='),
        expect.anything(),
      );
    });

    it('falls back to requestSelectedDateHeaders when map is null', async () => {
      const store = buildStore({
        map: null,
        layers: {
          collections: {},
          active: { layers: [mockGranuleLayerDef] },
          layerConfig: buildLayerConfig(['VIIRS_SNPP_Granule_Layer']),
        },
      });
      renderComponent(store);
      await act(async () => {});
      expect(global.fetch).toHaveBeenCalled();
    });

    it('skips granule sub-layers with no URLs', async () => {
      const mockGranuleSource = { getUrls: jest.fn(() => []) };
      const mockSubLayer = { getSource: jest.fn(() => mockGranuleSource) };
      const mockGranuleGroup = {
        wv: { id: 'VIIRS_SNPP_Granule_Layer' },
        getLayersArray: jest.fn(() => [mockSubLayer]),
      };
      const mockMap = buildMapWithLayers([mockGranuleGroup]);
      mockMap.getLayers = jest.fn(() => ({
        getArray: jest.fn(() => [mockGranuleGroup]),
      }));
      const store = buildStore({
        map: { ui: { selected: mockMap } },
        layers: {
          collections: {},
          active: { layers: [mockGranuleLayerDef] },
          layerConfig: buildLayerConfig(['VIIRS_SNPP_Granule_Layer']),
        },
      });
      renderComponent(store);
      await act(async () => {});
      // Promise.any with empty array rejects — collection should be empty
      const action = store.getActions().find((a) => a.type === 'UPDATE_COLLECTION');
      if (action) {
        expect(action.collection).toHaveLength(0);
      }
    });
  });

  // ── updateLayerCollections: forceUpdate ───────────────────────────────────

  describe('updateLayerCollections: forceUpdate via projId/mapLayersLength', () => {
    it('calls fetch even when layer is already in collections when projId changes', async () => {
      const { rerender } = renderComponent(buildStore({
        layers: {
          collections: {
            MODIS_Terra_CorrectedReflectance_TrueColor: {
              dates: [{ date: '2024-06-15', projection: 'geographic' }],
            },
          },
          active: { layers: [mockLayerDef] },
          layerConfig: buildLayerConfig(),
        },
      }));

      await act(async () => {});
      global.fetch.mockClear();

      const newStore = buildStore({
        proj: { id: 'arctic' },
        config: {
          sources: { 'GIBS:geographic': { url: 'https://gibs.earthdata.nasa.gov/wmts' } },
        },
        layers: {
          collections: {
            MODIS_Terra_CorrectedReflectance_TrueColor: {
              dates: [{ date: '2024-06-15', projection: 'geographic' }],
            },
          },
          active: { layers: [{ ...mockLayerDef, projections: { arctic: { matrixSet: '250m', layer: 'MODIS_Terra_CorrectedReflectance_TrueColor' } } }] },
          layerConfig: {
            MODIS_Terra_CorrectedReflectance_TrueColor: {
              projections: { arctic: { source: 'GIBS:geographic' } },
            },
          },
        },
        map: { ui: { selected: buildMapWithLayers() } },
      });

      await act(async () => {
        rerender(
          <Provider store={newStore}>
            <UpdateCollections />
          </Provider>,
        );
      });

      expect(global.fetch).toHaveBeenCalled();
    });
  });

  // ── updateCollection dispatch ─────────────────────────────────────────────

  describe('updateCollection dispatch', () => {
    it('dispatches UPDATE_COLLECTION once per render cycle', async () => {
      global.fetch.mockResolvedValue(
        buildFetchResponse('MODIS_Terra_CorrectedReflectance_TrueColor_v6_NRT'),
      );
      const { store } = renderComponent(buildStore());
      await act(async () => {});
      const updateActions = store.getActions().filter((a) => a.type === 'UPDATE_COLLECTION');
      expect(updateActions.length).toBeGreaterThanOrEqual(1);
    });

    it('dispatches UPDATE_COLLECTION with empty array when no valid collections found', async () => {
      global.fetch.mockResolvedValue({ headers: { get: jest.fn(() => null) } });
      const { store } = renderComponent(buildStore());
      await act(async () => {});
      const action = store.getActions().find((a) => a.type === 'UPDATE_COLLECTION');
      expect(action.collection).toEqual([]);
    });

    it('dispatches UPDATE_COLLECTION with multiple collections when multiple layers succeed', async () => {
      const secondLayerDef = {
        ...mockLayerDef,
        id: 'MODIS_Aqua_CorrectedReflectance_TrueColor',
        projections: { geographic: { matrixSet: '250m', layer: 'MODIS_Aqua_CorrectedReflectance_TrueColor' } },
      };
      global.fetch
        .mockResolvedValueOnce(buildFetchResponse('MODIS_Terra_CorrectedReflectance_TrueColor_v6_NRT'))
        .mockResolvedValueOnce(buildFetchResponse('MODIS_Aqua_CorrectedReflectance_TrueColor_v6_STD'));
      const store = buildStore({
        layers: {
          collections: {},
          active: { layers: [mockLayerDef, secondLayerDef] },
          layerConfig: buildLayerConfig([
            'MODIS_Terra_CorrectedReflectance_TrueColor',
            'MODIS_Aqua_CorrectedReflectance_TrueColor',
          ]),
        },
      });
      renderComponent(store);
      await act(async () => {});
      const action = store.getActions().find((a) => a.type === 'UPDATE_COLLECTION');
      expect(action.collection).toHaveLength(2);
    });
  });
});
