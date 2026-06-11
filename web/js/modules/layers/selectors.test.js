import update from 'immutability-helper';
import util from '../../util/util';
import fixtures from '../../fixtures';
import {
  addLayer,
  getLayers,
  resetLayers,
  dateRange,
  pushToBottom,
  moveBefore,
  getFutureLayerEndDate,
  hasSubDaily,
  getSubDaily,
  hasMeasurementSetting,
  hasMeasurementSource,
  getTitles,
  getFilteredOverlayGroups,
  getActiveLayers,
  getActiveOverlayGroups,
  getActiveVisibleLayersAtDate,
  getCollections,
  findEventLayers,
  replaceSubGroup,
  makeGetDescription,
  getSmallestIntervalValue,
  activateLayersForEventCategory,
  getZotsForActiveLayers,
  getMaxZoomLevelLayerCollection,
} from './selectors';

const config = fixtures.config();
function getState(layers) {
  return {
    config,
    proj: { id: 'geographic', selected: config.projections.geographic },
    layers: {
      active: {
        layers,
      },
    },
    compare: { isCompareA: true, activeString: 'active' },
    date: { selected: new Date(Date.UTC(2014, 0, 1)) },
  };
}
function getDescriptionState(layerOverrides = {}, measurementOverrides = {}) {
  return {
    config: {
      layers: {
        'terra-aod': {
          id: 'terra-aod',
          layergroup: 'AOD',
          ...layerOverrides,
        },
        'orbital-track': {
          id: 'orbital-track',
          layergroup: 'Orbital Track',
        },
      },
      measurements: {
        'Aerosol Optical Depth': {
          sources: {
            MODIS_Terra: {
              description: 'aerosol-optical-depth/v3',
              settings: ['terra-aod'],
              ...measurementOverrides,
            },
          },
        },
        'Featured Aerosol': {
          sources: {
            MODIS_Terra: {
              description: 'featured/aerosol',
              settings: ['terra-aod'],
            },
          },
        },
      },
    },
  };
}

function getIntervalState(layers) {
  return {
    layers: {
      active: { layers },
    },
    compare: { activeString: 'active' },
  };
}

function getEventState(activeLayers, categoryLayers) {
  return {
    config: {
      ...config,
      naturalEvents: {
        layers: {
          geographic: {
            fires: categoryLayers,
          },
        },
      },
    },
    proj: { id: 'geographic', selected: config.projections.geographic },
    layers: {
      active: { layers: activeLayers },
      layerConfig: config.layers,
    },
    compare: { isCompareA: true, activeString: 'active' },
    date: { selected: new Date(Date.UTC(2014, 0, 1)) },
  };
}

function makeView(zoom) {
  return { getView: () => ({ getZoom: () => zoom }) };
}

const emptyNotifications = { object: { layerNotices: [] } };

function getZotState({ activeLayers, zoom, notifications = emptyNotifications, sources = {} }) {
  return {
    config: {
      ...config,
      sources,
    },
    proj: { id: 'geographic', selected: config.projections.geographic },
    layers: {
      active: { layers: activeLayers },
    },
    compare: { isCompareA: true, activeString: 'active' },
    date: { selected: new Date(Date.UTC(2014, 0, 1)) },
    map: { ui: { selected: makeView(zoom) } },
    notifications,
  };
}
// A layer with no matrixSet so getZoomLevel always returns null,
// and minZoom at or below the current zoom so underZoom is not triggered.
function makeSimpleLayer(id, projection = 'geographic', minZoom = 0) {
  return {
    id,
    group: 'overlays',
    visible: true,
    opacity: 1,
    minZoom,
    projections: {
      [projection]: { matrixSet: undefined, source: 'GIBS:geographic' },
    },
  };
}

// A layer with a matrixSet backed by a resolutions array so overZoom can trigger.
function makeZoomableLayer(id, resolutionCount, minZoom = 0) {
  return {
    id,
    group: 'overlays',
    visible: true,
    opacity: 1,
    type: 'wmts',
    minZoom,
    projections: {
      geographic: { matrixSet: 'EPSG4326_2km', source: 'GIBS:geographic' },
    },
  };
}

function makeZoomableSources(resolutionCount) {
  return {
    'GIBS:geographic': {
      matrixSets: {
        EPSG4326_2km: {
          resolutions: Array(resolutionCount).fill(0.5),
        },
      },
    },
  };
}

function makeLayer(id, proj, matrixSet, source, type = 'wmts') {
  return {
    id,
    type,
    projections: {
      [proj]: { matrixSet, source },
    },
  };
}

function makeSources(sourceName, matrixSetName, resolutionCount) {
  return {
    [sourceName]: {
      matrixSets: {
        [matrixSetName]: {
          resolutions: Array(resolutionCount).fill(0.5),
        },
      },
    },
  };
}

const realNow = util.now.bind(util);

beforeAll(() => {
  util.now = realNow;
});

afterEach(() => {
  util.now = realNow;
});

test('adds base layer', () => {
  let layers = addLayer('terra-cr', [], config.layers, {}, 0);
  layers = addLayer('terra-aod', layers, config.layers, {}, 0);
  layers = addLayer('mask', layers, config.layers, {}, 1);

  const layerList = getLayers(getState(layers), {}).map((x) => x.id);

  expect(layerList).toEqual(['mask', 'terra-cr', 'terra-aod']);
});

test('adds overlay layer', () => {
  let layers = addLayer('terra-cr', [], config.layers, {}, 0);
  layers = addLayer('terra-aod', layers, config.layers, {}, 0);
  layers = addLayer('combo-aod', layers, config.layers, {}, 1);

  const layerList = getLayers(getState(layers), {}).map((x) => x.id);
  expect(layerList).toEqual(['terra-cr', 'combo-aod', 'terra-aod']);
});

test('does not add duplicate layer', () => {
  let layers = addLayer('terra-cr', [], config.layers, {}, 0);
  layers = addLayer('terra-aod', layers, config.layers, {}, 0);
  layers = addLayer('terra-cr', layers, config.layers, {}, 1);

  const layerList = getLayers(getState(layers)).map((x) => x.id);
  expect(layerList).toEqual(['terra-cr', 'terra-aod']);
});

test('resets to default layers', () => {
  const layers = resetLayers(config);
  const layerList = getLayers(getState(layers)).map((x) => x.id);
  expect(layerList).toEqual(['aqua-cr', 'terra-cr', 'terra-aod']);
});

test('gets layers in reverse', () => {
  let layers = addLayer('terra-cr', [], config.layers);
  layers = addLayer('aqua-cr', layers, config.layers);
  layers = addLayer('terra-aod', layers, config.layers);
  layers = addLayer('aqua-aod', layers, config.layers);

  const layerList = getLayers(getState(layers), { reverse: true }).map(
    (x) => x.id,
  );
  expect(layerList).toEqual(['terra-cr', 'aqua-cr', 'terra-aod', 'aqua-aod']);
});

test('gets base layers', () => {
  let layers = addLayer('terra-cr', [], config.layers);
  layers = addLayer('aqua-cr', layers, config.layers);
  layers = addLayer('terra-aod', layers, config.layers);
  layers = addLayer('aqua-aod', layers, config.layers);
  const layerList = getLayers(
    getState(layers),
    { group: 'baselayers' },
  ).map((x) => x.id);
  expect(layerList).toEqual(['aqua-cr', 'terra-cr']);
});

test('gets overlay layers', () => {
  let layers = addLayer('terra-cr', [], config.layers);
  layers = addLayer('aqua-cr', layers, config.layers);
  layers = addLayer('terra-aod', layers, config.layers);
  layers = addLayer('aqua-aod', layers, config.layers);
  const layerList = getLayers(
    getState(layers),
    { group: 'overlays' },
  ).map((x) => x.id);
  expect(layerList).toEqual(['aqua-aod', 'terra-aod']);
});

test('gets all groups', () => {
  let layers = addLayer('terra-cr', [], config.layers);
  layers = addLayer('aqua-cr', layers, config.layers);
  layers = addLayer('terra-aod', layers, config.layers);
  layers = addLayer('aqua-aod', layers, config.layers);

  const layerList = getLayers(getState(layers), { group: 'all' });
  expect(layerList.baselayers[0].id).toBe('aqua-cr');
  expect(layerList.baselayers[1].id).toBe('terra-cr');
  expect(layerList.overlays[0].id).toBe('aqua-aod');
  expect(layerList.overlays[1].id).toBe('terra-aod');
});

// NOTE: Not currently using getLayers to get layers from any
// projection other than the currently active proj

// test('gets layers for other projection', () => {
//   let layers = addLayer('terra-cr', {}, [], config.layers);
//   layers = addLayer('aqua-cr', {}, layers, config.layers);
//   layers = addLayer('terra-aod', {}, layers, config.layers);
//   layers = addLayer('aqua-aod', {}, layers, config.layers);
//   const layerList = getLayers(getState(layers), { proj: 'arctic' }).map(
//     (x) => x.id,
//   );
//   expect(layerList).toEqual(['aqua-cr', 'terra-cr']);
// });

test('obscured base layer is not renderable', () => {
  let layers = addLayer('terra-cr', [], config.layers);
  layers = addLayer('aqua-cr', layers, config.layers);
  layers = addLayer('terra-aod', layers, config.layers);
  layers = addLayer('aqua-aod', layers, config.layers);
  const layerList = getLayers(getState(layers), { renderable: true }).map(
    (x) => x.id,
  );
  expect(layerList).toEqual(['aqua-cr', 'aqua-aod', 'terra-aod']);
});

test('base layer is not obscured by a hidden layer', () => {
  let layers = addLayer('terra-cr', [], config.layers);
  layers = addLayer('aqua-cr', layers, config.layers, { visible: false });
  layers = addLayer('terra-aod', layers, config.layers);
  layers = addLayer('aqua-aod', layers, config.layers);

  const layerList = getLayers(getState(layers), { renderable: true }).map(
    (x) => x.id,
  );
  expect(layerList).toEqual(['terra-cr', 'aqua-aod', 'terra-aod']);
});

test('layer with zero opacity is not renderable', () => {
  let layers = addLayer('terra-cr', [], config.layers);
  layers = addLayer('aqua-cr', layers, config.layers);
  layers = addLayer('terra-aod', layers, config.layers);
  layers = addLayer('aqua-aod', layers, config.layers, { opacity: 0 });

  const layerList = getLayers(getState(layers), { renderable: true }).map(
    (x) => x.id,
  );
  expect(layerList).toEqual(['aqua-cr', 'terra-aod']);
});

test('layer outside date range is not renderable', () => {
  let layers = addLayer('terra-cr', [], config.layers);
  layers = addLayer('aqua-cr', layers, config.layers);
  layers = addLayer('terra-aod', layers, config.layers);
  layers = addLayer('aqua-aod', layers, config.layers);
  let state = getState(layers);
  state = update(state, {
    date: { selected: { $set: new Date(Date.UTC(2001, 0, 1)) } },
  });

  const layerList = getLayers(state, { renderable: true }).map((x) => x.id);
  expect(layerList).toEqual(['terra-cr', 'terra-aod']);
});

test('all layers are visible', () => {
  let layers = addLayer('terra-cr', [], config.layers);
  layers = addLayer('aqua-cr', layers, config.layers);
  layers = addLayer('terra-aod', layers, config.layers);
  layers = addLayer('aqua-aod', layers, config.layers);

  const layerList = getLayers(getState(layers)).map(
    (x) => x.id,
  );
  expect(layerList).toEqual(['aqua-cr', 'terra-cr', 'aqua-aod', 'terra-aod']);
});

// NOTE: Not currently using getLayers to retrieve layers that are
// specifically either visible or not visible

// test('only visible layers', () => {
//   let layers = addLayer('terra-cr', { visible: false }, [], config.layers);
//   layers = addLayer('aqua-cr', {}, layers, config.layers);
//   layers = addLayer('terra-aod', { visible: false }, layers, config.layers);
//   layers = addLayer('aqua-aod', {}, layers, config.layers);

//   const layerList = getLayers(getState(layers), { visible: true }).map(
//     (x) => x.id,
//   );
//   expect(layerList).toEqual(['aqua-cr', 'aqua-aod']);
// });

test('push overlay to bottom', () => {
  let layers = addLayer('terra-cr', [], config.layers);
  layers = addLayer('aqua-cr', layers, config.layers);
  layers = addLayer('terra-aod', layers, config.layers);
  layers = addLayer('aqua-aod', layers, config.layers);
  layers = pushToBottom('aqua-cr', layers);
  const layerList = getLayers(getState(layers)).map((x) => x.id);
  expect(layerList).toEqual(['terra-cr', 'aqua-cr', 'aqua-aod', 'terra-aod']);
});

test('move base layer before', () => {
  let layers = addLayer('terra-cr', [], config.layers);
  layers = addLayer('aqua-cr', layers, config.layers);
  layers = addLayer('terra-aod', layers, config.layers);
  layers = addLayer('aqua-aod', layers, config.layers);
  moveBefore('terra-cr', 'aqua-cr', layers);

  const layerList = getLayers(getState(layers), {}).map((x) => x.id);
  expect(layerList).toEqual(['terra-cr', 'aqua-cr', 'aqua-aod', 'terra-aod']);
});

test('move overlay before', () => {
  let layers = addLayer('terra-cr', [], config.layers);
  layers = addLayer('aqua-cr', layers, config.layers);
  layers = addLayer('terra-aod', layers, config.layers);
  layers = addLayer('aqua-aod', layers, config.layers);
  moveBefore('terra-aod', 'aqua-aod', layers);

  const layerList = getLayers(getState(layers)).map((x) => x.id);
  expect(layerList).toEqual(['aqua-cr', 'terra-cr', 'terra-aod', 'aqua-aod']);
});

// Date Ranges
function getDateRangesTestState(stateObj) {
  let state = stateObj;
  const today = new Date(Date.UTC(2010, 0, 1));
  util.now = () => today;
  const layers = {
    historical_1: {
      id: 'historical_1',
      startDate: '2000-01-01',
      endDate: '2002-01-01',
      group: 'baselayers',
      ongoing: true,
      projections: {
        geographic: {},
      },
    },
    historical_2: {
      id: 'historical_2',
      startDate: '2001-01-01',
      endDate: '2003-01-01',
      group: 'overlays',
      ongoing: true,
      projections: {
        geographic: {},
      },
    },
    active_1: {
      id: 'active_1',
      startDate: '2005-01-01',
      group: 'overlays',
      projections: {
        geographic: {},
      },
    },
    static: {
      id: 'static',
      group: 'overlays',
      projections: {
        geographic: {},
      },
    },
  };
  state = update(state, {
    date: { selected: { $set: today } },
  });
  state = update(state, {
    config: { defaults: { projection: { $set: 'geographic' } } },
  });
  state = update(state, {
    config: { projections: { geographic: { id: { $set: 'geographic' } } } },
  });
  state = update(state, {
    config: { layers: { $set: layers } },
  });
  return state;
}

test('date range for ongoing layers', () => {
  let layers = addLayer('terra-cr', [], config.layers);
  layers = addLayer('aqua-cr', layers, config.layers);
  layers = addLayer('terra-aod', layers, config.layers);
  layers = addLayer('aqua-aod', layers, config.layers);
  const range = dateRange({}, layers, config);

  expect(range.start).toEqual(new Date(Date.UTC(2000, 0, 1)));
  expect(range.start).toEqual(new Date(Date.UTC(2000, 0, 1)));
});

test('date range for ended layers', () => {
  const layersConfig = {};
  layersConfig.end1 = {
    id: 'end1',
    group: 'overlays',
    projections: {
      geographic: {},
    },
    startDate: '1990-01-01',
    endDate: '2005-01-01',
    ongoing: false,
  };
  layersConfig.end2 = {
    id: 'end1',
    group: 'overlays',
    projections: {
      geographic: {},
    },
    startDate: '1992-01-01',
    endDate: '2007-01-01',
    ongoing: false,
  };
  const adjustedConfig = update(config, { layers: { $set: layersConfig } });
  let layers = addLayer('end1', [], layersConfig);
  layers = addLayer('end2', layers, layersConfig);
  const range = dateRange({}, layers, adjustedConfig);

  expect(range.start).toEqual(new Date(Date.UTC(1990, 0, 1)));
  expect(range.end).toEqual(new Date(Date.UTC(2007, 0, 1)));
});

test('date range with one layer', () => {
  let state = getState([]);
  state = getDateRangesTestState(state);
  const layers = addLayer('historical_1', [], state.config.layers);
  const range = dateRange({}, layers, state.config);
  const expectedStartTime = new Date(Date.UTC(2000, 0, 1)).getTime();
  const expectedEndTime = new Date(Date.UTC(2010, 0, 1, 0, 0, 59)).getTime();
  expect(range.start.getTime()).toEqual(expectedStartTime);
  expect(range.end.getTime()).toEqual(expectedEndTime);
});

test('date range with two layers', () => {
  let state = getState([]);
  state = getDateRangesTestState(state);
  let layers = addLayer('historical_1', [], state.config.layers);
  layers = addLayer('historical_2', layers, state.config.layers);
  const range = dateRange({}, layers, state.config);
  const expectedStartTime = new Date(Date.UTC(2000, 0, 1)).getTime();
  const expectedEndTime = new Date(Date.UTC(2010, 0, 1, 0, 0, 59)).getTime();
  expect(range.start.getTime()).toEqual(expectedStartTime);
  expect(range.end.getTime()).toEqual(expectedEndTime);
});

test('end of date range is today if no end date', () => {
  let state = getState([]);
  state = getDateRangesTestState(state);
  const layers = addLayer('active_1', [], state.config.layers);
  const range = dateRange({}, layers, state.config);
  const expectedStartTime = new Date(Date.UTC(2005, 0, 1)).getTime();
  const expectedEndTime = new Date(Date.UTC(2010, 0, 1, 0, 0, 59)).getTime();
  expect(range.start.getTime()).toEqual(expectedStartTime);
  expect(range.end.getTime()).toEqual(expectedEndTime);
});

test('no date range with static', () => {
  let state = getState([]);
  state = getDateRangesTestState(state);
  const layers = addLayer('static', [], state.config.layers);
  const range = dateRange({}, layers, state.config);

  expect(range).toBeFalsy();
});

test('get future layer end date is 5 days after mock current date', () => {
  const testLayer = { futureTime: '5D' };
  // current date floored to quarter hour
  const currentDate = util.roundTimeQuarterHour(util.now());
  // test date to compare is floored to quarter hour and added 5 days using util
  const testDate = util.dateAdd(util.roundTimeQuarterHour(util.now()), 'day', 5);
  const futureEndDate = getFutureLayerEndDate(testLayer);

  const testDateMinutes = testDate.getUTCMinutes();
  const testDateHours = testDate.getUTCHours();
  const testDateDays = testDate.getUTCDate();

  const minutesCompareFuture = futureEndDate.getUTCMinutes();
  const hoursCompareFuture = futureEndDate.getUTCHours();
  const daysCompareFuture = futureEndDate.getUTCDate();

  // check that future date time is greater than current time (ms)
  expect(futureEndDate.getTime()).toBeGreaterThan(currentDate.getTime());
  // check for equality of unchanged date units (minutes/hours) and changed (days)
  expect(testDateMinutes).toEqual(minutesCompareFuture);
  expect(testDateHours).toEqual(hoursCompareFuture);
  expect(testDateDays).toEqual(daysCompareFuture);
});

// ─── hasSubDaily ─────────────────────────────────────────────────────────────
test('hasSubDaily returns true when a subdaily layer is present', () => {
  const layers = [{ period: 'daily' }, { period: 'subdaily' }];
  expect(hasSubDaily(layers)).toBe(true);
});

test('hasSubDaily returns false when no subdaily layer is present', () => {
  const layers = [{ period: 'daily' }, { period: 'monthly' }];
  expect(hasSubDaily(layers)).toBe(false);
});

test('hasSubDaily returns false for empty array', () => {
  expect(hasSubDaily([])).toBe(false);
});

test('hasSubDaily returns false for null/undefined', () => {
  expect(hasSubDaily(null)).toBe(false);
  expect(hasSubDaily(undefined)).toBe(false);
});

// ─── getSubDaily ─────────────────────────────────────────────────────────────
test('getSubDaily returns only subdaily layers', () => {
  const layers = [{ id: 'a', period: 'daily' }, { id: 'b', period: 'subdaily' }];
  const result = getSubDaily(layers);
  expect(result).toHaveLength(1);
  expect(result[0].id).toBe('b');
});

test('getSubDaily returns empty array when no subdaily layers', () => {
  const layers = [{ id: 'a', period: 'daily' }];
  expect(getSubDaily(layers)).toEqual([]);
});

test('getSubDaily returns empty array for null input', () => {
  expect(getSubDaily(null)).toEqual([]);
});

// ─── getFutureLayerEndDate – month and year intervals ────────────────────────
test('getFutureLayerEndDate adds months correctly', () => {
  const now = util.now();
  const expected = new Date(now);
  expected.setUTCMonth(expected.getUTCMonth() + 3);
  const result = getFutureLayerEndDate({ futureTime: '3M' });
  expect(result.getUTCMonth()).toBe(util.roundTimeQuarterHour(expected).getUTCMonth());
});

test('getFutureLayerEndDate adds years correctly', () => {
  const now = util.now();
  const expected = new Date(now);
  expected.setUTCFullYear(expected.getUTCFullYear() + 1);
  const result = getFutureLayerEndDate({ futureTime: '1Y' });
  expect(result.getUTCFullYear()).toBe(util.roundTimeQuarterHour(expected).getUTCFullYear());
});

// ─── dateRange – debugGIBS / ignoreDateRange shortcuts ───────────────────────
test('dateRange returns epoch-to-now when debugGIBS is true', () => {
  const layers = addLayer('terra-cr', [], config.layers);
  const result = dateRange({}, layers, { debugGIBS: true });
  expect(result.start).toEqual(new Date(Date.UTC(1970, 0, 1)));
});

test('dateRange returns epoch-to-now when ignoreDateRange is true', () => {
  const layers = addLayer('terra-cr', [], config.layers);
  const result = dateRange({}, layers, { ignoreDateRange: true });
  expect(result.start).toEqual(new Date(Date.UTC(1970, 0, 1)));
});

// ─── dateRange – specific layer id lookup ────────────────────────────────────
test('dateRange with specific layer id returns range for that layer only', () => {
  let layers = addLayer('terra-cr', [], config.layers);
  layers = addLayer('terra-aod', layers, config.layers);
  const result = dateRange({ layer: 'terra-cr' }, layers);
  expect(result).toBeTruthy();
  expect(result.start).toBeDefined();
});

test('dateRange returns undefined when specific layer id not found in active list', () => {
  const layers = addLayer('terra-cr', [], config.layers);
  const result = dateRange({ layer: 'nonexistent-layer' }, layers);
  expect(result).toBeUndefined();
});

// ─── dateRange – futureTime with endDate branch ──────────────────────────────
test('dateRange handles layer with futureTime and endDate', () => {
  const layersConfig = {
    future_with_end: {
      id: 'future_with_end',
      group: 'overlays',
      projections: { geographic: {} },
      startDate: '2020-01-01',
      endDate: '2030-01-01',
      futureTime: '10D',
      ongoing: true,
    },
  };
  const layers = addLayer('future_with_end', [], layersConfig);
  const result = dateRange({}, layers);
  expect(result).toBeTruthy();
  expect(result.end).toEqual(new Date(Date.UTC(2030, 0, 1)));
});

test('dateRange handles layer with futureTime and no endDate', () => {
  const layersConfig = {
    future_no_end: {
      id: 'future_no_end',
      group: 'overlays',
      projections: { geographic: {} },
      startDate: '2020-01-01',
      futureTime: '7D',
    },
  };
  const layers = addLayer('future_no_end', [], layersConfig);
  const result = dateRange({}, layers);
  console.log(result.end.getTime(), Date.now());
  expect(result).toBeTruthy();
  expect(result.end.getTime()).toBeGreaterThan(Date.now());
});

// ─── pushToBottom – error on inactive layer ───────────────────────────────────
test('pushToBottom throws when layer is not active', () => {
  const layers = addLayer('terra-cr', [], config.layers);
  expect(() => pushToBottom('non-existent', layers)).toThrow();
});

// ─── pushToBottom – overlay uses layerSplit ───────────────────────────────────
test('pushToBottom moves overlay to correct position using layerSplit', () => {
  let layers = addLayer('terra-cr', [], config.layers);
  layers = addLayer('aqua-cr', layers, config.layers);
  layers = addLayer('terra-aod', layers, config.layers);
  layers = addLayer('aqua-aod', layers, config.layers);
  const overlayCount = layers.filter((l) => l.group === 'overlays').length;
  layers = pushToBottom('terra-aod', layers, overlayCount + 1);
  const ids = getLayers(getState(layers)).map((x) => x.id);
  expect(ids).toContain('terra-aod');
});

// ─── moveBefore – error cases ─────────────────────────────────────────────────
test('moveBefore throws when source layer is not active', () => {
  const layers = addLayer('terra-cr', [], config.layers);
  layers.push({ id: 'aqua-cr', group: 'baselayers' });
  expect(() => moveBefore('non-existent', 'aqua-cr', layers)).toThrow();
});

test('moveBefore throws when target layer is not active', () => {
  let layers = addLayer('terra-cr', [], config.layers);
  layers = addLayer('aqua-cr', layers, config.layers);
  expect(() => moveBefore('terra-cr', 'non-existent', layers)).toThrow();
});

test('moveBefore moves source after target when source comes after target', () => {
  let layers = addLayer('terra-cr', [], config.layers);
  layers = addLayer('aqua-cr', layers, config.layers);
  layers = addLayer('terra-aod', layers, config.layers);
  layers = addLayer('aqua-aod', layers, config.layers);
  moveBefore('aqua-aod', 'terra-aod', layers);
  const ids = getLayers(getState(layers)).map((x) => x.id);
  expect(ids.indexOf('aqua-aod')).toBeLessThan(ids.indexOf('terra-aod'));
});

// ─── replaceSubGroup ──────────────────────────────────────────────────────────
test('replaceSubGroup calls moveBefore when nextLayerId is provided', () => {
  let layers = addLayer('terra-cr', [], config.layers);
  layers = addLayer('aqua-cr', layers, config.layers);
  layers = addLayer('terra-aod', layers, config.layers);
  layers = addLayer('aqua-aod', layers, config.layers);
  const result = replaceSubGroup('aqua-cr', 'terra-cr', layers, 2);
  const ids = getLayers(getState(result)).map((x) => x.id);
  expect(ids.indexOf('aqua-cr')).toBeLessThan(ids.indexOf('terra-cr'));
});

test('replaceSubGroup calls pushToBottom when nextLayerId is null', () => {
  let layers = addLayer('terra-cr', [], config.layers);
  layers = addLayer('aqua-cr', layers, config.layers);
  const result = replaceSubGroup('aqua-cr', null, layers, 1);
  expect(result.map((l) => l.id)).toContain('aqua-cr');
});

// ─── getActiveLayers – embed mode filters hidden layers ───────────────────────
test('getActiveLayers in embed mode returns only visible layers', () => {
  let layers = addLayer('terra-cr', [], config.layers);
  layers = addLayer('aqua-cr', layers, config.layers, { visible: false });
  const state = {
    ...getState(layers),
    embed: { isEmbedModeActive: true },
  };
  const result = getActiveLayers(state);
  expect(result.every((l) => l.visible)).toBe(true);
  expect(result.find((l) => l.id === 'aqua-cr')).toBeUndefined();
});

test('getActiveLayers in embed mode returns all layers when all are visible', () => {
  let layers = addLayer('terra-cr', [], config.layers);
  layers = addLayer('aqua-cr', layers, config.layers);
  const state = {
    ...getState(layers),
    embed: { isEmbedModeActive: true },
  };
  const result = getActiveLayers(state);
  expect(result).toHaveLength(2);
});

// ─── getActiveVisibleLayersAtDate ─────────────────────────────────────────────
test('getActiveVisibleLayersAtDate returns renderable layers at date', () => {
  let layers = addLayer('terra-cr', [], config.layers);
  layers = addLayer('aqua-cr', layers, config.layers);
  layers = addLayer('terra-aod', layers, config.layers);
  const state = getState(layers);
  const result = getActiveVisibleLayersAtDate(state, new Date(Date.UTC(2014, 0, 1)));
  expect(Array.isArray(result)).toBe(true);
  expect(result.length).toBeGreaterThan(0);
});

// ─── getCollections ───────────────────────────────────────────────────────────
test('getCollections returns undefined when layer id not in collections', () => {
  const layersState = { collections: {} };
  const result = getCollections(layersState, '2021-01-01', null, { id: 'terra-cr' }, 'geographic');
  expect(result).toBeUndefined();
});

test('getCollections returns matching entry by dailyDate and projection', () => {
  const layersState = {
    collections: {
      'terra-cr': {
        dates: [
          { date: '2021-01-01', projection: 'geographic', type: 'cmr', version: '006' },
          { date: '2021-01-02', projection: 'geographic', type: 'cmr', version: '006' },
        ],
      },
    },
  };
  const result = getCollections(layersState, '2021-01-01', null, { id: 'terra-cr' }, 'geographic');
  expect(result).toBeDefined();
  expect(result.date).toBe('2021-01-01');
});

test('getCollections returns matching entry by subdailyDate', () => {
  const layersState = {
    collections: {
      'terra-cr': {
        dates: [
          { date: '2021-01-01T12:00:00Z', projection: 'geographic', type: 'cmr', version: '006' },
        ],
      },
    },
  };
  const result = getCollections(layersState, null, '2021-01-01T12:00:00Z', { id: 'terra-cr' }, 'geographic');
  expect(result).toBeDefined();
});

test('getCollections returns undefined when date does not match', () => {
  const layersState = {
    collections: {
      'terra-cr': {
        dates: [
          { date: '2021-01-01', projection: 'geographic', type: 'cmr', version: '006' },
        ],
      },
    },
  };
  const result = getCollections(layersState, '2022-06-01', null, { id: 'terra-cr' }, 'geographic');
  expect(result).toBeUndefined();
});

// ─── getFilteredOverlayGroups ─────────────────────────────────────────────────
test('getFilteredOverlayGroups removes Reference group', () => {
  const overlayGroups = [
    { groupName: 'AOD', layers: ['terra-aod'] },
    { groupName: 'Reference', layers: ['mask'] },
  ];
  const overlays = [{ id: 'terra-aod' }];
  const result = getFilteredOverlayGroups(overlayGroups, overlays);
  expect(result.find((g) => g.groupName === 'Reference')).toBeUndefined();
  expect(result.find((g) => g.groupName === 'AOD')).toBeDefined();
});

test('getFilteredOverlayGroups filters out layers not in active overlays', () => {
  const overlayGroups = [
    { groupName: 'AOD', layers: ['terra-aod', 'aqua-aod'] },
  ];
  const overlays = [{ id: 'terra-aod' }];
  const result = getFilteredOverlayGroups(overlayGroups, overlays);
  expect(result[0].layers).toEqual(['terra-aod']);
});

// ─── getActiveOverlayGroups ───────────────────────────────────────────────────
test('getActiveOverlayGroups returns groups with layers valid for projection', () => {
  let layers = addLayer('terra-cr', [], config.layers);
  layers = addLayer('terra-aod', layers, config.layers);
  const state = {
    ...getState(layers),
    layers: {
      active: {
        layers,
        overlayGroups: [{ groupName: 'AOD', layers: ['terra-aod'] }],
      },
    },
  };
  const result = getActiveOverlayGroups(state);
  expect(result).toHaveLength(1);
  expect(result[0].groupName).toBe('AOD');
});

test('getActiveOverlayGroups in embed mode filters Reference groups and hidden layers', () => {
  let layers = addLayer('terra-aod', [], config.layers);
  layers = addLayer('terra-cr', layers, config.layers, { visible: false });
  const state = {
    ...getState(layers),
    embed: { isEmbedModeActive: true },
    layers: {
      active: {
        layers,
        overlayGroups: [
          { groupName: 'AOD', layers: ['terra-aod'] },
          { groupName: 'Reference', layers: ['terra-cr'] },
        ],
      },
    },
  };
  const result = getActiveOverlayGroups(state);
  expect(result.find((g) => g.groupName === 'Reference')).toBeUndefined();
});

// ─── hasMeasurementSetting ────────────────────────────────────────────────────
test('hasMeasurementSetting returns true for valid non-orbital-track layer in projection', () => {
  const mockConfig = {
    layers: {
      'terra-aod': {
        id: 'terra-aod',
        layergroup: 'AOD',
        projections: { geographic: {} },
      },
    },
  };
  const source = { settings: ['terra-aod'] };
  const current = { id: 'some-measurement' };
  const result = hasMeasurementSetting(current, source, mockConfig, 'geographic');
  expect(result).toBe(true);
});

test('hasMeasurementSetting returns undefined when layer not in config', () => {
  const mockConfig = { layers: {} };
  const source = { settings: ['nonexistent-layer'] };
  const current = { id: 'some-measurement' };
  const result = hasMeasurementSetting(current, source, mockConfig, 'geographic');
  expect(result).toBeUndefined();
});

test('hasMeasurementSetting returns undefined when layer not in requested projection', () => {
  const mockConfig = {
    layers: {
      'terra-aod': {
        id: 'terra-aod',
        layergroup: 'AOD',
        projections: { arctic: {} },
      },
    },
  };
  const source = { settings: ['terra-aod'] };
  const current = { id: 'some-measurement' };
  const result = hasMeasurementSetting(current, source, mockConfig, 'geographic');
  expect(result).toBeUndefined();
});

test('hasMeasurementSetting returns true for orbital-track layer when current id matches', () => {
  const mockConfig = {
    layers: {
      'orbital-track': {
        id: 'orbital-track',
        layergroup: 'Orbital Track',
        projections: { geographic: {} },
      },
    },
  };
  const source = { settings: ['orbital-track'] };
  const current = { id: 'orbital-track' };
  const result = hasMeasurementSetting(current, source, mockConfig, 'geographic');
  expect(result).toBe(true);
});

test('hasMeasurementSetting returns undefined for orbital-track when current id does not match', () => {
  const mockConfig = {
    layers: {
      'orbital-track': {
        id: 'orbital-track',
        layergroup: 'Orbital Track',
        projections: { geographic: {} },
      },
    },
  };
  const source = { settings: ['orbital-track'] };
  const current = { id: 'some-other-measurement' };
  const result = hasMeasurementSetting(current, source, mockConfig, 'geographic');
  expect(result).toBeUndefined();
});

// ─── hasMeasurementSource ─────────────────────────────────────────────────────
test('hasMeasurementSource returns true when at least one source has a valid setting', () => {
  const mockConfig = {
    layers: {
      'terra-aod': {
        id: 'terra-aod',
        layergroup: 'AOD',
        projections: { geographic: {} },
      },
    },
  };
  const current = {
    id: 'aod-measurement',
    sources: {
      MODIS_Terra: { settings: ['terra-aod'] },
    },
  };
  const result = hasMeasurementSource(current, mockConfig, 'geographic');
  expect(result).toBe(true);
});

test('hasMeasurementSource returns undefined when no sources have valid settings', () => {
  const mockConfig = { layers: {} };
  const current = {
    id: 'aod-measurement',
    sources: {
      MODIS_Terra: { settings: ['nonexistent'] },
    },
  };
  const result = hasMeasurementSource(current, mockConfig, 'geographic');
  expect(result).toBeUndefined();
});

// ─── getTitles ────────────────────────────────────────────────────────────────
test('getTitles returns layer title, subtitle, and tags', () => {
  const result = getTitles(config, 'terra-cr', 'geographic');
  expect(result.title).toBeDefined();
  expect(result.subtitle).toBeDefined();
  expect(result.tags).toBeDefined();
});

test('getTitles throws when layerId does not exist in config', () => {
  expect(() => getTitles(config, 'nonexistent-layer', 'geographic')).toThrow();
});

// ─── findEventLayers ──────────────────────────────────────────────────────────
test('findEventLayers returns ids of layers in newLayers not in originalLayers', () => {
  const original = [{ id: 'terra-cr' }, { id: 'aqua-cr' }];
  const next = [{ id: 'terra-cr' }, { id: 'aqua-cr' }, { id: 'modis-fires' }];
  const result = findEventLayers(original, next);
  expect(result).toEqual(['modis-fires']);
});

test('findEventLayers returns empty array when no new layers added', () => {
  const original = [{ id: 'terra-cr' }];
  const next = [{ id: 'terra-cr' }];
  expect(findEventLayers(original, next)).toEqual([]);
});

test('makeGetDescription returns description for a valid layer', () => {
  const getDescription = makeGetDescription();
  const state = getDescriptionState();
  const result = getDescription(state, { layer: { id: 'terra-aod' } });
  expect(result).toBe('aerosol-optical-depth/v3');
});

test('makeGetDescription returns undefined when layerId is not provided', () => {
  const getDescription = makeGetDescription();
  const state = getDescriptionState();
  const result = getDescription(state, { layer: null });
  expect(result).toBeUndefined();
});

test('makeGetDescription returns undefined for Orbital Track layers', () => {
  const getDescription = makeGetDescription();
  const state = getDescriptionState();
  const result = getDescription(state, { layer: { id: 'orbital-track' } });
  expect(result).toBeUndefined();
});

test('makeGetDescription ignores Featured measurements when resolving description', () => {
  const getDescription = makeGetDescription();
  const state = getDescriptionState();
  const result = getDescription(state, { layer: { id: 'terra-aod' } });
  expect(result).not.toBe('featured/aerosol');
  expect(result).toBe('aerosol-optical-depth/v3');
});

test('makeGetDescription returns undefined when layer exists in config but has no matching measurement source', () => {
  const getDescription = makeGetDescription();
  const state = {
    config: {
      layers: {
        'terra-aod': { id: 'terra-aod', layergroup: 'AOD' },
      },
      measurements: {
        'Some Measurement': {
          sources: {
            MODIS_Terra: {
              description: 'some/path',
              settings: ['aqua-aod'],
            },
          },
        },
      },
    },
  };
  const result = getDescription(state, { layer: { id: 'terra-aod' } });
  expect(result).toBeUndefined();
});

test('each makeGetDescription() call creates an independent memoized selector', () => {
  const getDescriptionA = makeGetDescription();
  const getDescriptionB = makeGetDescription();
  const state = getDescriptionState();
  expect(getDescriptionA).not.toBe(getDescriptionB);
  expect(getDescriptionA(state, { layer: { id: 'terra-aod' } }))
    .toBe(getDescriptionB(state, { layer: { id: 'terra-aod' } }));
});

test('returns 1440 (default) when there are no layers', () => {
  const state = getIntervalState([]);
  expect(getSmallestIntervalValue(state)).toBe(1440);
});

test('returns 1440 (default) when no layers have subdaily period', () => {
  const state = getIntervalState([
    { id: 'terra-cr', period: 'daily', dateRanges: [{ dateInterval: '1' }] },
    { id: 'aqua-cr', period: 'monthly', dateRanges: [{ dateInterval: '30' }] },
  ]);
  expect(getSmallestIntervalValue(state)).toBe(1440);
});

test('returns the interval of a single subdaily layer', () => {
  const state = getIntervalState([
    { id: 'viirs-subdaily', period: 'subdaily', dateRanges: [{ dateInterval: '10' }] },
  ]);
  expect(getSmallestIntervalValue(state)).toBe(10);
});

test('returns the smallest interval across multiple subdaily layers', () => {
  const state = getIntervalState([
    { id: 'layer-a', period: 'subdaily', dateRanges: [{ dateInterval: '60' }] },
    { id: 'layer-b', period: 'subdaily', dateRanges: [{ dateInterval: '10' }] },
    { id: 'layer-c', period: 'subdaily', dateRanges: [{ dateInterval: '30' }] },
  ]);
  expect(getSmallestIntervalValue(state)).toBe(10);
});

test('ignores non-subdaily layers when selecting smallest interval', () => {
  const state = getIntervalState([
    { id: 'daily-layer', period: 'daily', dateRanges: [{ dateInterval: '1' }] },
    { id: 'subdaily-layer', period: 'subdaily', dateRanges: [{ dateInterval: '20' }] },
  ]);
  expect(getSmallestIntervalValue(state)).toBe(20);
});

test('returns 1440 when subdaily layer has no dateRanges', () => {
  const state = getIntervalState([
    { id: 'subdaily-no-range', period: 'subdaily' },
  ]);
  expect(getSmallestIntervalValue(state)).toBe(1440);
});

test('returns 1440 when subdaily layer dateRanges is empty', () => {
  const state = getIntervalState([
    { id: 'subdaily-empty-range', period: 'subdaily', dateRanges: [] },
  ]);
  expect(getSmallestIntervalValue(state)).toBe(1440);
});

test('handles string interval values by coercing to number', () => {
  const state = getIntervalState([
    { id: 'layer-a', period: 'subdaily', dateRanges: [{ dateInterval: '5' }] },
  ]);
  const result = getSmallestIntervalValue(state);
  expect(result).toBe(5);
  expect(typeof result).toBe('number');
});

test('does not update smallestDelta when interval is larger than current smallest', () => {
  const state = getIntervalState([
    { id: 'layer-a', period: 'subdaily', dateRanges: [{ dateInterval: '10' }] },
    { id: 'layer-b', period: 'subdaily', dateRanges: [{ dateInterval: '120' }] },
  ]);
  expect(getSmallestIntervalValue(state)).toBe(10);
});

test('returns active layers unchanged when category has no layers defined for projection', () => {
  let activeLayers = addLayer('terra-cr', [], config.layers);
  activeLayers = addLayer('terra-aod', activeLayers, config.layers);
  const state = getEventState(activeLayers, undefined);
  const result = activateLayersForEventCategory(state, 'fires');
  expect(result.map((l) => l.id)).toEqual(activeLayers.map((l) => l.id));
});

test('turns off all current layers before applying event category layers', () => {
  let activeLayers = addLayer('terra-cr', [], config.layers);
  activeLayers = addLayer('terra-aod', activeLayers, config.layers);
  const state = getEventState(activeLayers, [['terra-cr', true]]);
  const result = activateLayersForEventCategory(state, 'fires');
  const terAod = result.find((l) => l.id === 'terra-aod');
  expect(terAod.visible).toBe(false);
});

test('turns on a layer that already exists in the active list', () => {
  let activeLayers = addLayer('terra-cr', [], config.layers);
  activeLayers = addLayer('terra-aod', activeLayers, config.layers);
  const state = getEventState(activeLayers, [['terra-cr', true]]);
  const result = activateLayersForEventCategory(state, 'fires');
  const terraCr = result.find((l) => l.id === 'terra-cr');
  expect(terraCr.visible).toBe(true);
});

test('keeps a layer hidden when category specifies it as not visible', () => {
  let activeLayers = addLayer('terra-cr', [], config.layers);
  activeLayers = addLayer('terra-aod', activeLayers, config.layers);
  const state = getEventState(activeLayers, [['terra-cr', false]]);
  const result = activateLayersForEventCategory(state, 'fires');
  const terraCr = result.find((l) => l.id === 'terra-cr');
  expect(terraCr.visible).toBe(false);
});

test('adds a layer that does not yet exist in the active list', () => {
  const activeLayers = addLayer('terra-cr', [], config.layers);
  const state = getEventState(activeLayers, [['terra-aod', true]]);
  const result = activateLayersForEventCategory(state, 'fires');
  const newLayer = result.find((l) => l.id === 'terra-aod');
  expect(newLayer).toBeDefined();
  expect(newLayer.visible).toBe(true);
});

test('adds a new layer with visible set to false when category specifies hidden', () => {
  const activeLayers = addLayer('terra-cr', [], config.layers);
  const state = getEventState(activeLayers, [['terra-aod', false]]);
  const result = activateLayersForEventCategory(state, 'fires');
  const newLayer = result.find((l) => l.id === 'terra-aod');
  expect(newLayer).toBeDefined();
  expect(newLayer.visible).toBe(false);
});

test('handles multiple category layers — turning on existing and adding new', () => {
  let activeLayers = addLayer('terra-cr', [], config.layers);
  activeLayers = addLayer('aqua-cr', activeLayers, config.layers);
  const state = getEventState(activeLayers, [
    ['terra-cr', true],
    ['terra-aod', true],
  ]);
  const result = activateLayersForEventCategory(state, 'fires');
  expect(result.find((l) => l.id === 'terra-cr').visible).toBe(true);
  expect(result.find((l) => l.id === 'aqua-cr').visible).toBe(false);
  expect(result.find((l) => l.id === 'terra-aod')).toBeDefined();
  expect(result.find((l) => l.id === 'terra-aod').visible).toBe(true);
});

test('returns an array', () => {
  const activeLayers = addLayer('terra-cr', [], config.layers);
  const state = getEventState(activeLayers, [['terra-cr', true]]);
  const result = activateLayersForEventCategory(state, 'fires');
  expect(Array.isArray(result)).toBe(true);
});

test('does not mutate the original active layers array', () => {
  let activeLayers = addLayer('terra-cr', [], config.layers);
  activeLayers = addLayer('terra-aod', activeLayers, config.layers);
  const originalIds = activeLayers.map((l) => l.id);
  const state = getEventState(activeLayers, [['terra-cr', true]]);
  activateLayersForEventCategory(state, 'fires');
  expect(activeLayers.map((l) => l.id)).toEqual(originalIds);
});

test('returns an empty object when no layers are active', () => {
  const state = getZotState({ activeLayers: [], zoom: 5 });
  expect(getZotsForActiveLayers(state)).toEqual({});
});

test('returns an empty object when no zot conditions are met', () => {
  const layer = makeSimpleLayer('terra-aod');
  const state = getZotState({ activeLayers: [layer], zoom: 3 });
  const result = getZotsForActiveLayers(state);
  expect(result['terra-aod']).toBeUndefined();
});

test('includes a layer entry when overZoom is triggered', () => {
  const resolutionCount = 4; // zoomLimit = 3
  const layer = makeZoomableLayer('terra-aod', resolutionCount);
  const sources = makeZoomableSources(resolutionCount);
  const state = getZotState({ activeLayers: [layer], zoom: 5, sources });
  const result = getZotsForActiveLayers(state);
  expect(result['terra-aod']).toBeDefined();
  expect(result['terra-aod'].overZoomValue).toBeGreaterThan(0);
});

test('overZoomValue is calculated as zoom minus zoomLimit rounded to 2 decimals', () => {
  const resolutionCount = 4; // zoomLimit = 3
  const layer = makeZoomableLayer('terra-aod', resolutionCount);
  const sources = makeZoomableSources(resolutionCount);
  const state = getZotState({ activeLayers: [layer], zoom: 5, sources });
  const result = getZotsForActiveLayers(state);
  expect(result['terra-aod'].overZoomValue).toBe(2); // 5 - 3 = 2
});

test('does not include a layer entry when zoom is exactly at the zoomLimit', () => {
  const resolutionCount = 4; // zoomLimit = 3
  const layer = makeZoomableLayer('terra-aod', resolutionCount);
  const sources = makeZoomableSources(resolutionCount);
  const state = getZotState({ activeLayers: [layer], zoom: 3, sources });
  const result = getZotsForActiveLayers(state);
  expect(result['terra-aod']).toBeUndefined();
});

test('includes a layer entry when underZoom is triggered (minZoom > zoom)', () => {
  const layer = makeSimpleLayer('terra-aod', 'geographic', 8);
  const state = getZotState({ activeLayers: [layer], zoom: 4 });
  const result = getZotsForActiveLayers(state);
  expect(result['terra-aod']).toBeDefined();
  expect(result['terra-aod'].underZoomValue).toBeGreaterThan(0);
});

test('underZoomValue is calculated as minZoom minus zoom rounded to 2 decimals', () => {
  const layer = makeSimpleLayer('terra-aod', 'geographic', 8);
  const state = getZotState({ activeLayers: [layer], zoom: 5 });
  const result = getZotsForActiveLayers(state);
  expect(result['terra-aod'].underZoomValue).toBe(3); // 8 - 5 = 3
});

test('does not include a layer entry when underZoomValue is zero', () => {
  const layer = makeSimpleLayer('terra-aod', 'geographic', 5);
  const state = getZotState({ activeLayers: [layer], zoom: 5 });
  const result = getZotsForActiveLayers(state);
  expect(result['terra-aod']).toBeUndefined();
});

test('skips layers that are not available in the current projection', () => {
  const layer = makeSimpleLayer('arctic-layer', 'arctic', 0);
  const state = getZotState({ activeLayers: [layer], zoom: 10 });
  const result = getZotsForActiveLayers(state);
  expect(result['arctic-layer']).toBeUndefined();
});

test('returns entries for multiple layers with independent zot conditions', () => {
  const resolutionCount = 4;
  const overZoomedLayer = makeZoomableLayer('layer-a', resolutionCount, 0);
  const underZoomedLayer = makeSimpleLayer('layer-b', 'geographic', 10);
  const normalLayer = makeSimpleLayer('layer-c', 'geographic', 0);
  const sources = makeZoomableSources(resolutionCount);
  const state = getZotState({
    activeLayers: [overZoomedLayer, underZoomedLayer, normalLayer],
    zoom: 6,
    sources,
  });
  const result = getZotsForActiveLayers(state);
  expect(result['layer-a']).toBeDefined();
  expect(result['layer-b']).toBeDefined();
  expect(result['layer-c']).toBeUndefined();
});

test('returns fallback zoom when layers array is empty', () => {
  expect(getMaxZoomLevelLayerCollection([], 8, 'geographic', {})).toBe(8);
});

test('returns fallback zoom when layer has no matrixSet', () => {
  const layer = makeLayer('layer-a', 'geographic', undefined, 'GIBS:geographic');
  const sources = makeSources('GIBS:geographic', 'EPSG4326_2km', 6);
  expect(getMaxZoomLevelLayerCollection([layer], 8, 'geographic', sources)).toBe(8);
});

test('returns fallback zoom when layer type is vector', () => {
  const layer = makeLayer('layer-a', 'geographic', 'EPSG4326_2km', 'GIBS:geographic', 'vector');
  const sources = makeSources('GIBS:geographic', 'EPSG4326_2km', 6);
  expect(getMaxZoomLevelLayerCollection([layer], 8, 'geographic', sources)).toBe(8);
});

test('returns fallback zoom when resolutions array is missing', () => {
  const layer = makeLayer('layer-a', 'geographic', 'EPSG4326_2km', 'GIBS:geographic');
  const sources = { 'GIBS:geographic': { matrixSets: { EPSG4326_2km: {} } } };
  expect(getMaxZoomLevelLayerCollection([layer], 8, 'geographic', sources)).toBe(8);
});

test('returns fallback zoom when sources is undefined', () => {
  const layer = makeLayer('layer-a', 'geographic', 'EPSG4326_2km', 'GIBS:geographic');
  expect(getMaxZoomLevelLayerCollection([layer], 8, 'geographic', undefined)).toBe(8);
});

test('returns correct zoomLimit for a single qualifying layer', () => {
  const layer = makeLayer('layer-a', 'geographic', 'EPSG4326_2km', 'GIBS:geographic');
  const sources = makeSources('GIBS:geographic', 'EPSG4326_2km', 6); // zoomLimit = 5
  expect(getMaxZoomLevelLayerCollection([layer], 8, 'geographic', sources)).toBe(5);
});

test('returns the smallest zoomLimit across multiple qualifying layers', () => {
  const layerA = makeLayer('layer-a', 'geographic', 'EPSG4326_2km', 'GIBS:geographic');
  const layerB = makeLayer('layer-b', 'geographic', 'EPSG4326_500m', 'GIBS:geographic');
  const sources = {
    'GIBS:geographic': {
      matrixSets: {
        EPSG4326_2km: { resolutions: Array(6).fill(0.5) },   // zoomLimit = 5
        EPSG4326_500m: { resolutions: Array(9).fill(0.25) },  // zoomLimit = 8
      },
    },
  };
  expect(getMaxZoomLevelLayerCollection([layerA, layerB], 10, 'geographic', sources)).toBe(5);
});

test('ignores non-qualifying layers when computing the minimum', () => {
  const qualifyingLayer = makeLayer('layer-a', 'geographic', 'EPSG4326_2km', 'GIBS:geographic');
  const vectorLayer = makeLayer('layer-b', 'geographic', 'EPSG4326_2km', 'GIBS:geographic', 'vector');
  const sources = makeSources('GIBS:geographic', 'EPSG4326_2km', 6); // zoomLimit = 5
  expect(getMaxZoomLevelLayerCollection([qualifyingLayer, vectorLayer], 10, 'geographic', sources)).toBe(5);
});

test('applies zoomOffset of 1 for arctic projection', () => {
  const layer = makeLayer('layer-a', 'arctic', 'EPSG3413_2km', 'GIBS:arctic');
  const sources = makeSources('GIBS:arctic', 'EPSG3413_2km', 6); // zoomLimit = 5 + 1 = 6
  expect(getMaxZoomLevelLayerCollection([layer], 10, 'arctic', sources)).toBe(6);
});

test('applies zoomOffset of 1 for antarctic projection', () => {
  const layer = makeLayer('layer-a', 'antarctic', 'EPSG3031_2km', 'GIBS:antarctic');
  const sources = makeSources('GIBS:antarctic', 'EPSG3031_2km', 6); // zoomLimit = 5 + 1 = 6
  expect(getMaxZoomLevelLayerCollection([layer], 10, 'antarctic', sources)).toBe(6);
});

test('does not apply zoomOffset for geographic projection', () => {
  const layer = makeLayer('layer-a', 'geographic', 'EPSG4326_2km', 'GIBS:geographic');
  const sources = makeSources('GIBS:geographic', 'EPSG4326_2km', 6); // zoomLimit = 5 + 0 = 5
  expect(getMaxZoomLevelLayerCollection([layer], 10, 'geographic', sources)).toBe(5);
});

test('returns fallback zoom when all layers are non-qualifying', () => {
  const layerA = makeLayer('layer-a', 'geographic', undefined, 'GIBS:geographic');
  const layerB = makeLayer('layer-b', 'geographic', 'EPSG4326_2km', 'GIBS:geographic', 'vector');
  const sources = makeSources('GIBS:geographic', 'EPSG4326_2km', 6);
  expect(getMaxZoomLevelLayerCollection([layerA, layerB], 7, 'geographic', sources)).toBe(7);
});

test('returns fallback zoom of 0 when passed 0 and no qualifying layers', () => {
  expect(getMaxZoomLevelLayerCollection([], 0, 'geographic', {})).toBe(0);
});
