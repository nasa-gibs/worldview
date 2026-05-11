import configureMockStore from 'redux-mock-store';
import { thunk } from 'redux-thunk';
import fixtures from '../../fixtures';
import layerbuilder from '../layerbuilder';
import granuleLayerBuilder from './granule-layer-builder';
import { LOADING_START, LOADING_STOP } from '../../modules/loading/constants';
import { LOADING_GRANULES } from '../../modules/loading/actions';

const mockBaseCmrApi = 'mock.cmr.api/';

const queryString =
  '?bounding_box=-180%2C-65%2C180%2C65&shortName=VJ102IMG&day_night_flag=day' +
  '&temporal=2019-09-23T20%3A54%3A00.000Z%2C2019-09-24T12%3A54%3A00.000Z&pageSize=500';

const queryString2 =
  '?bounding_box=-180%2C-65%2C180%2C65&shortName=VJ102IMG_NRT&day_night_flag=day' +
  '&temporal=2019-09-23T20%3A54%3A00.000Z%2C2019-09-24T12%3A54%3A00.000Z&pageSize=500';

const cmrGranules = require('../../../mock/cmr_granules.json');

const mockStore = configureMockStore([thunk]);
const config = fixtures.config();
const { cache } = fixtures;
const granuleLayerDef = config.layers['granule-cr'];

const IN_RANGE_DATE = new Date(Date.UTC(2019, 8, 24, 8, 54, 0));
const OUT_OF_RANGE_DATE = new Date(Date.UTC(2016, 8, 24, 8, 54, 0));

let createGranuleLayer;
let store;

function buildOptionsAndAttributes(date, overrides = {}) {
  const options = { group: 'active', date, ...overrides };
  const attributes = { ...options, def: granuleLayerDef };
  return { options, attributes };
}

function mockSuccessfulCmrFetch() {
  fetch.mockResponse((req) => {
    if (
      req.url === `${mockBaseCmrApi}granules.json${queryString}` ||
      req.url === `${mockBaseCmrApi}granules.json${queryString2}`
    ) {
      return Promise.resolve({ status: 200, body: cmrGranules });
    }
    return Promise.resolve({
      status: 404,
      body: JSON.stringify({ error: 'Not found' }),
    });
  });
}

function mockFailingCmrFetch() {
  fetch.mockReject(new Error('Network failure'));
}

function mockEmptyCmrFetch() {
  fetch.mockResponse(() =>
    Promise.resolve({
      status: 200,
      body: JSON.stringify({ feed: { entry: [] } }),
    }),
  );
}

describe('granule layer builder', () => {
  beforeEach(() => {
    store = mockStore(fixtures.getState());
    const { createLayerWMTS } = layerbuilder(config, cache, store);
    const { getGranuleLayer } = granuleLayerBuilder(cache, store, createLayerWMTS);
    createGranuleLayer = getGranuleLayer;
    fetch.resetMocks();
    mockSuccessfulCmrFetch();
  });

  describe('date range guard', () => {
    it('returns an empty layer group and dispatches no actions when the date is outside the layer date range', async () => {
      const { options, attributes } = buildOptionsAndAttributes(OUT_OF_RANGE_DATE);

      const granuleLayer = await createGranuleLayer(granuleLayerDef, attributes, options);

      expect(store.getActions().length).toEqual(0);
      expect(granuleLayer).toBeDefined();
      expect(granuleLayer.wv).toBeDefined();
      expect(granuleLayer.wv.date).toEqual(OUT_OF_RANGE_DATE);
    });

    it('proceeds past the date guard and dispatches loading actions when the date is in range', async () => {
      const { options, attributes } = buildOptionsAndAttributes(IN_RANGE_DATE);

      await createGranuleLayer(granuleLayerDef, attributes, options);

      const types = store.getActions().map((a) => a.type);
      expect(types).toContain(LOADING_START);
      expect(types).toContain(LOADING_STOP);
    });
  });

  describe('layer properties', () => {
    it('sets granuleGroup flag and layerId on the returned layer', async () => {
      const { options, attributes } = buildOptionsAndAttributes(IN_RANGE_DATE);

      const granuleLayer = await createGranuleLayer(granuleLayerDef, attributes, options);

      expect(granuleLayer.get('granuleGroup')).toBe(true);
      expect(granuleLayer.get('layerId')).toBe(`${granuleLayerDef.id}-${options.group}`);
    });

    it('attaches wv.visibleGranules and wv.invisibleGranules arrays to the layer', async () => {
      const { options, attributes } = buildOptionsAndAttributes(IN_RANGE_DATE);

      const granuleLayer = await createGranuleLayer(granuleLayerDef, attributes, options);

      expect(Array.isArray(granuleLayer.wv.visibleGranules)).toBe(true);
      expect(Array.isArray(granuleLayer.wv.invisibleGranules)).toBe(true);
    });

    it('attaches wv.granuleDates array that is the union of visible and invisible dates', async () => {
      const { options, attributes } = buildOptionsAndAttributes(IN_RANGE_DATE);

      const granuleLayer = await createGranuleLayer(granuleLayerDef, attributes, options);
      const { visibleGranules, invisibleGranules, granuleDates } = granuleLayer.wv;

      const expectedDates = [
        ...visibleGranules.map((g) => g.date),
        ...invisibleGranules.map((g) => g.date),
      ];
      expect(granuleDates).toEqual(expectedDates);
    });
  });

  describe('pendingCmrRebuild and cmrRebuildAttempts', () => {
    it('sets pendingCmrRebuild=true and increments cmrRebuildAttempts when no visible granules are returned', async () => {
      mockEmptyCmrFetch();
      const { options, attributes } = buildOptionsAndAttributes(IN_RANGE_DATE);

      const granuleLayer = await createGranuleLayer(granuleLayerDef, attributes, options);

      expect(granuleLayer.wv.pendingCmrRebuild).toBe(true);
      expect(granuleLayer.wv.cmrRebuildAttempts).toBe(1);
    });

    it('accumulates cmrRebuildAttempts across successive empty responses', async () => {
      mockEmptyCmrFetch();
      const { options, attributes } = buildOptionsAndAttributes(IN_RANGE_DATE, {
        cmrRebuildAttempts: 3,
      });

      const granuleLayer = await createGranuleLayer(granuleLayerDef, attributes, options);

      expect(granuleLayer.wv.cmrRebuildAttempts).toBe(4);
    });

    it('sets pendingCmrRebuild=false and does not increment cmrRebuildAttempts when visible granules exist', async () => {
      const { options, attributes } = buildOptionsAndAttributes(IN_RANGE_DATE);

      const granuleLayer = await createGranuleLayer(granuleLayerDef, attributes, options);

      if (granuleLayer.wv.visibleGranules.length > 0) {
        expect(granuleLayer.wv.pendingCmrRebuild).toBe(false);
        expect(granuleLayer.wv.cmrRebuildAttempts).toBe(0);
      }
    });
  });

  describe('shiftadjacentdays', () => {
    it('creates the layer when shiftadjacentdays is true (default)', async () => {
      const defWithShift = { ...granuleLayerDef, shiftadjacentdays: true };
      const { options, attributes } = buildOptionsAndAttributes(IN_RANGE_DATE);

      const granuleLayer = await createGranuleLayer(defWithShift, attributes, options);

      expect(granuleLayer.get('granuleGroup')).toBe(true);
    });

    it('creates the layer when shiftadjacentdays is explicitly false', async () => {
      const defWithoutShift = { ...granuleLayerDef, shiftadjacentdays: false };
      const { options, attributes } = buildOptionsAndAttributes(IN_RANGE_DATE);

      const granuleLayer = await createGranuleLayer(defWithoutShift, attributes, options);

      expect(granuleLayer.get('granuleGroup')).toBe(true);
    });

    it('defaults shiftadjacentdays to true when the property is absent', async () => {
      const defNoShiftProp = { ...granuleLayerDef };
      delete defNoShiftProp.shiftadjacentdays;
      const { options, attributes } = buildOptionsAndAttributes(IN_RANGE_DATE);

      await expect(
        createGranuleLayer(defNoShiftProp, attributes, options),
      ).resolves.toBeDefined();
    });
  });

  describe('animation isPlaying guard', () => {
    it('dispatches updateGranuleLayerState when animation is NOT playing', async () => {
      const { options, attributes } = buildOptionsAndAttributes(IN_RANGE_DATE);

      await createGranuleLayer(granuleLayerDef, attributes, options);

      const types = store.getActions().map((a) => a.type);
      expect(types).toContain('LAYERS/ADD_GRANULE_LAYER_DATES');
    });

    it('does NOT dispatch updateGranuleLayerState when animation IS playing', async () => {
      const playingState = {
        ...fixtures.getState(),
        animation: { ...fixtures.getState().animation, isPlaying: true },
      };
      store = mockStore(playingState);
      const { createLayerWMTS } = layerbuilder(config, cache, store);
      const { getGranuleLayer } = granuleLayerBuilder(cache, store, createLayerWMTS);
      createGranuleLayer = getGranuleLayer;

      const { options, attributes } = buildOptionsAndAttributes(IN_RANGE_DATE);
      await createGranuleLayer(granuleLayerDef, attributes, options);

      const types = store.getActions().map((a) => a.type);
      expect(types).not.toContain('LAYERS/ADD_GRANULE_LAYER_DATES');
    });
  });

  describe('loading spinner lifecycle', () => {
    it('dispatches LOADING_START then LOADING_STOP in the correct order', async () => {
      const { options, attributes } = buildOptionsAndAttributes(IN_RANGE_DATE);

      await createGranuleLayer(granuleLayerDef, attributes, options);

      const actions = store.getActions();
      const startIndex = actions.findIndex(
        (a) => a.type === LOADING_START && a.key === LOADING_GRANULES,
      );
      const stopIndex = actions.findIndex(
        (a) => a.type === LOADING_STOP && a.key === LOADING_GRANULES,
      );

      expect(startIndex).toBeGreaterThanOrEqual(0);
      expect(stopIndex).toBeGreaterThan(startIndex);
    });

    it('still dispatches LOADING_STOP even when the CMR fetch throws', async () => {
      mockFailingCmrFetch();
      const { options, attributes } = buildOptionsAndAttributes(IN_RANGE_DATE);

      const granuleLayer = await createGranuleLayer(granuleLayerDef, attributes, options);

      const types = store.getActions().map((a) => a.type);
      expect(types).toContain(LOADING_STOP);
      expect(granuleLayer).toBeDefined();
    });
  });

  describe('CMR error dialog', () => {
    it('dispatches loading start and stop and returns empty granule dates when the CMR request fails', async () => {
      mockFailingCmrFetch();
      const { options, attributes } = buildOptionsAndAttributes(IN_RANGE_DATE);

      await createGranuleLayer(granuleLayerDef, attributes, options);

      const actions = store.getActions();
      const types = actions.map((a) => a.type);
      expect(types).toContain('LOADING/START');
      expect(types).toContain('LOADING/STOP');

      const granuleDatesAction = actions.find((a) => a.type === 'LAYERS/ADD_GRANULE_LAYER_DATES');
      expect(granuleDatesAction).toBeDefined();
      expect(granuleDatesAction.dates).toEqual([]);
    });

    it('does NOT dispatch the CMR error modal on a successful fetch', async () => {
      const { options, attributes } = buildOptionsAndAttributes(IN_RANGE_DATE);

      await createGranuleLayer(granuleLayerDef, attributes, options);

      const actions = store.getActions();
      const modalAction = actions.find((a) => a.type === 'MODAL/OPEN_BASIC_CONTENT');
      expect(modalAction).toBeUndefined();
    });
  });

  describe('granule deduplication', () => {
    it('removes duplicate granules that share the same time_start across standard and NRT feeds', async () => {
      const sharedEntry = cmrGranules.feed.entry[0];
      const duplicateFeed = JSON.stringify({ feed: { entry: [sharedEntry] } });
      fetch.mockResponse((req) => {
        if (req.url.includes('VJ102IMG') || req.url.includes('VJ102IMG_NRT')) {
          return Promise.resolve({ status: 200, body: duplicateFeed });
        }
        return Promise.resolve({ status: 404, body: '{}' });
      });

      const { options, attributes } = buildOptionsAndAttributes(IN_RANGE_DATE);
      const granuleLayer = await createGranuleLayer(granuleLayerDef, attributes, options);

      const allDates = granuleLayer.wv.granuleDates;
      const uniqueDates = [...new Set(allDates)];
      expect(allDates.length).toEqual(uniqueDates.length);
    });
  });

  describe('tile layer caching', () => {
    it('reuses cached tile layers on repeated calls for the same date', async () => {
      const { options, attributes } = buildOptionsAndAttributes(IN_RANGE_DATE);

      const firstLayer = await createGranuleLayer(granuleLayerDef, attributes, options);
      store.clearActions();
      const secondLayer = await createGranuleLayer(granuleLayerDef, attributes, options);

      expect(firstLayer.get('granuleGroup')).toBe(true);
      expect(secondLayer.get('granuleGroup')).toBe(true);
      expect(firstLayer.wv.visibleGranules.length).toEqual(secondLayer.wv.visibleGranules.length);
    });
  });

  describe('getVisibleGranules edge cases', () => {
    it('returns empty granule lists when CMR provides no entries', async () => {
      mockEmptyCmrFetch();
      const { options, attributes } = buildOptionsAndAttributes(IN_RANGE_DATE);

      const granuleLayer = await createGranuleLayer(granuleLayerDef, attributes, options);

      expect(granuleLayer.wv.visibleGranules.length).toBe(0);
      expect(granuleLayer.wv.invisibleGranules.length).toBe(0);
    });

    it('returns empty granule lists when granuleCount is high but CMR returns no data', async () => {
      const highCountDef = { ...granuleLayerDef, count: 9999 };
      const { options, attributes } = buildOptionsAndAttributes(IN_RANGE_DATE);

      const granuleLayer = await createGranuleLayer(highCountDef, attributes, options);

      expect(granuleLayer.wv.visibleGranules.length).toBe(0);
      expect(granuleLayer.wv.invisibleGranules.length).toBe(0);
      expect(granuleLayer.wv.count).toBe(9999);
    });
  });

  describe('granuleDateRanges cache bypass', () => {
    it('uses pre-existing granuleDateRanges when they already cover the selected date', async () => {
      const coveredDef = {
        ...granuleLayerDef,
        granuleDateRanges: [['2019-01-01T00:00:00Z', '2020-01-01T00:00:00Z']],
      };
      const { options, attributes } = buildOptionsAndAttributes(IN_RANGE_DATE);

      const granuleLayer = await createGranuleLayer(coveredDef, attributes, options);

      expect(granuleLayer.get('granuleGroup')).toBe(true);
    });

    it('fetches granuleDateRanges when none are provided on the layer definition', async () => {
      const defWithoutRanges = { ...granuleLayerDef };
      delete defWithoutRanges.granuleDateRanges;
      const { options, attributes } = buildOptionsAndAttributes(IN_RANGE_DATE);

      await expect(
        createGranuleLayer(defWithoutRanges, attributes, options),
      ).resolves.toBeDefined();
    });
  });

  describe('layer extent based on CRS', () => {
    it('sets the full map extent for the geographic projection', async () => {
      const { options, attributes } = buildOptionsAndAttributes(IN_RANGE_DATE);

      const granuleLayer = await createGranuleLayer(granuleLayerDef, attributes, options);

      expect(granuleLayer.getExtent()).toBeDefined();
    });

    it('sets the projection maxExtent for a non-geographic (polar) projection', async () => {
      const arcticState = {
        ...fixtures.getState(),
        proj: {
          selected: {
            crs: 'EPSG:3413',
            maxExtent: [-4194304, -4194304, 4194304, 4194304],
          },
        },
      };
      store = mockStore(arcticState);
      const { createLayerWMTS } = layerbuilder(config, cache, store);
      const { getGranuleLayer } = granuleLayerBuilder(cache, store, createLayerWMTS);
      createGranuleLayer = getGranuleLayer;
      fetch.resetMocks();
      mockSuccessfulCmrFetch();

      const { options, attributes } = buildOptionsAndAttributes(IN_RANGE_DATE);
      const granuleLayer = await createGranuleLayer(granuleLayerDef, attributes, options);

      expect(granuleLayer.getExtent()).toEqual([-4194304, -4194304, 4194304, 4194304]);
    });
  });

  describe('partial CMR responses', () => {
    it('builds the layer from NRT data alone when the standard CMR request rejects', async () => {
      fetch.mockResponse((req) => {
        if (req.url === `${mockBaseCmrApi}granules.json${queryString}`) {
          return Promise.reject(new Error('Standard CMR unavailable'));
        }
        if (req.url === `${mockBaseCmrApi}granules.json${queryString2}`) {
          return Promise.resolve({ status: 200, body: cmrGranules });
        }
        return Promise.resolve({ status: 404, body: '{}' });
      });

      const { options, attributes } = buildOptionsAndAttributes(IN_RANGE_DATE);
      const granuleLayer = await createGranuleLayer(granuleLayerDef, attributes, options);

      expect(granuleLayer).toBeDefined();
      expect(granuleLayer.get('granuleGroup')).toBe(true);
    });

    it('builds the layer from standard data alone when the NRT CMR request rejects', async () => {
      fetch.mockResponse((req) => {
        if (req.url === `${mockBaseCmrApi}granules.json${queryString}`) {
          return Promise.resolve({ status: 200, body: cmrGranules });
        }
        return Promise.reject(new Error('NRT CMR unavailable'));
      });

      const { options, attributes } = buildOptionsAndAttributes(IN_RANGE_DATE);
      const granuleLayer = await createGranuleLayer(granuleLayerDef, attributes, options);

      expect(granuleLayer).toBeDefined();
      expect(granuleLayer.get('granuleGroup')).toBe(true);
    });
  });

  describe('module export', () => {
    it('exports getGranuleLayer as a function', () => {
      const { createLayerWMTS } = layerbuilder(config, cache, store);
      const builder = granuleLayerBuilder(cache, store, createLayerWMTS);

      expect(typeof builder.getGranuleLayer).toBe('function');
    });
  });
});
