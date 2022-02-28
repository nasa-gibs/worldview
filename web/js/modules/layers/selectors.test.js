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

test('adds base layer', () => {
  let layers = addLayer('terra-cr', {}, [], config.layers, 0);
  layers = addLayer('terra-aod', {}, layers, config.layers, 0);
  layers = addLayer('mask', {}, layers, config.layers, 1);

  const layerList = getLayers(getState(layers), {}).map((x) => x.id);

  expect(layerList).toEqual(['mask', 'terra-cr', 'terra-aod']);
});

test('adds overlay layer', () => {
  let layers = addLayer('terra-cr', {}, [], config.layers, 0);
  layers = addLayer('terra-aod', {}, layers, config.layers, 0);
  layers = addLayer('combo-aod', {}, layers, config.layers, 1);

  const layerList = getLayers(getState(layers), {}).map((x) => x.id);
  expect(layerList).toEqual(['terra-cr', 'combo-aod', 'terra-aod']);
});

test('does not add duplicate layer', () => {
  let layers = addLayer('terra-cr', {}, [], config.layers, 0);
  layers = addLayer('terra-aod', {}, layers, config.layers, 0);
  layers = addLayer('terra-cr', {}, layers, config.layers, 1);

  const layerList = getLayers(getState(layers), {}).map((x) => x.id);
  expect(layerList).toEqual(['terra-cr', 'terra-aod']);
});

test('resets to default layers', () => {
  const layers = resetLayers(
    [
      {
        id: 'terra-cr',
      },
      {
        id: 'terra-aod',
      },
    ],
    config.layers,
  );
  const layerList = getLayers(getState(layers), {}).map((x) => x.id);
  expect(layerList).toEqual(['terra-cr', 'terra-aod']);
});

test('gets layers in reverse', () => {
  let layers = addLayer('terra-cr', {}, [], config.layers);
  layers = addLayer('aqua-cr', {}, layers, config.layers);
  layers = addLayer('terra-aod', {}, layers, config.layers);
  layers = addLayer('aqua-aod', {}, layers, config.layers);

  const layerList = getLayers(getState(layers), { reverse: true }).map(
    (x) => x.id,
  );
  expect(layerList).toEqual(['terra-cr', 'aqua-cr', 'terra-aod', 'aqua-aod']);
});

test('gets base layers', () => {
  let layers = addLayer('terra-cr', {}, [], config.layers);
  layers = addLayer('aqua-cr', {}, layers, config.layers);
  layers = addLayer('terra-aod', {}, layers, config.layers);
  layers = addLayer('aqua-aod', {}, layers, config.layers);
  const layerList = getLayers(
    getState(layers),
    { group: 'baselayers' },
  ).map((x) => x.id);
  expect(layerList).toEqual(['aqua-cr', 'terra-cr']);
});

test('gets overlay layers', () => {
  let layers = addLayer('terra-cr', {}, [], config.layers);
  layers = addLayer('aqua-cr', {}, layers, config.layers);
  layers = addLayer('terra-aod', {}, layers, config.layers);
  layers = addLayer('aqua-aod', {}, layers, config.layers);
  const layerList = getLayers(
    getState(layers),
    { group: 'overlays' },
  ).map((x) => x.id);
  expect(layerList).toEqual(['aqua-aod', 'terra-aod']);
});

test('gets all groups', () => {
  let layers = addLayer('terra-cr', {}, [], config.layers);
  layers = addLayer('aqua-cr', {}, layers, config.layers);
  layers = addLayer('terra-aod', {}, layers, config.layers);
  layers = addLayer('aqua-aod', {}, layers, config.layers);

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
  let layers = addLayer('terra-cr', {}, [], config.layers);
  layers = addLayer('aqua-cr', {}, layers, config.layers);
  layers = addLayer('terra-aod', {}, layers, config.layers);
  layers = addLayer('aqua-aod', {}, layers, config.layers);
  const layerList = getLayers(getState(layers), { renderable: true }).map(
    (x) => x.id,
  );
  expect(layerList).toEqual(['aqua-cr', 'aqua-aod', 'terra-aod']);
});

test('base layer is not obscured by a hidden layer', () => {
  let layers = addLayer('terra-cr', {}, [], config.layers);
  layers = addLayer('aqua-cr', { visible: false }, layers, config.layers);
  layers = addLayer('terra-aod', {}, layers, config.layers);
  layers = addLayer('aqua-aod', {}, layers, config.layers);

  const layerList = getLayers(getState(layers), { renderable: true }).map(
    (x) => x.id,
  );
  expect(layerList).toEqual(['terra-cr', 'aqua-aod', 'terra-aod']);
});

test('layer with zero opacity is not renderable', () => {
  let layers = addLayer('terra-cr', {}, [], config.layers);
  layers = addLayer('aqua-cr', {}, layers, config.layers);
  layers = addLayer('terra-aod', {}, layers, config.layers);
  layers = addLayer('aqua-aod', { opacity: 0 }, layers, config.layers);

  const layerList = getLayers(getState(layers), { renderable: true }).map(
    (x) => x.id,
  );
  expect(layerList).toEqual(['aqua-cr', 'terra-aod']);
});

test('layer outside date range is not renderable', () => {
  let layers = addLayer('terra-cr', {}, [], config.layers);
  layers = addLayer('aqua-cr', {}, layers, config.layers);
  layers = addLayer('terra-aod', {}, layers, config.layers);
  layers = addLayer('aqua-aod', {}, layers, config.layers);
  let state = getState(layers);
  state = update(state, {
    date: { selected: { $set: new Date(Date.UTC(2001, 0, 1)) } },
  });

  const layerList = getLayers(state, { renderable: true }).map((x) => x.id);
  expect(layerList).toEqual(['terra-cr', 'terra-aod']);
});

test('all layers are visible', () => {
  let layers = addLayer('terra-cr', {}, [], config.layers);
  layers = addLayer('aqua-cr', {}, layers, config.layers);
  layers = addLayer('terra-aod', {}, layers, config.layers);
  layers = addLayer('aqua-aod', {}, layers, config.layers);

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
  let layers = addLayer('terra-cr', {}, [], config.layers);
  layers = addLayer('aqua-cr', {}, layers, config.layers);
  layers = addLayer('terra-aod', {}, layers, config.layers);
  layers = addLayer('aqua-aod', {}, layers, config.layers);
  layers = pushToBottom('aqua-cr', layers);
  const layerList = getLayers(getState(layers), {}).map((x) => x.id);
  expect(layerList).toEqual(['terra-cr', 'aqua-cr', 'aqua-aod', 'terra-aod']);
});

test('move base layer before', () => {
  let layers = addLayer('terra-cr', {}, [], config.layers);
  layers = addLayer('aqua-cr', {}, layers, config.layers);
  layers = addLayer('terra-aod', {}, layers, config.layers);
  layers = addLayer('aqua-aod', {}, layers, config.layers);
  moveBefore('terra-cr', 'aqua-cr', layers);

  const layerList = getLayers(getState(layers), {}).map((x) => x.id);
  expect(layerList).toEqual(['terra-cr', 'aqua-cr', 'aqua-aod', 'terra-aod']);
});

test('move overlay before', () => {
  let layers = addLayer('terra-cr', {}, [], config.layers);
  layers = addLayer('aqua-cr', {}, layers, config.layers);
  layers = addLayer('terra-aod', {}, layers, config.layers);
  layers = addLayer('aqua-aod', {}, layers, config.layers);
  moveBefore('terra-aod', 'aqua-aod', layers);

  const layerList = getLayers(getState(layers), {}).map((x) => x.id);
  expect(layerList).toEqual(['aqua-cr', 'terra-cr', 'terra-aod', 'aqua-aod']);
});

// Date Ranges
function getDateRangesTestState(state) {
  const today = new Date(Date.UTC(2010, 0, 1));
  util.now = () => today;
  const layers = {
    historical_1: {
      id: 'historical_1',
      startDate: '2000-01-01',
      endDate: '2002-01-01',
      group: 'baselayers',
      projections: {
        geographic: {},
      },
    },
    historical_2: {
      id: 'historical_2',
      startDate: '2001-01-01',
      endDate: '2003-01-01',
      group: 'overlays',
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
  let layers = addLayer('terra-cr', {}, [], config.layers);
  layers = addLayer('aqua-cr', {}, layers, config.layers);
  layers = addLayer('terra-aod', {}, layers, config.layers);
  layers = addLayer('aqua-aod', {}, layers, config.layers);
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
    inactive: true,
  };
  layersConfig.end2 = {
    id: 'end1',
    group: 'overlays',
    projections: {
      geographic: {},
    },
    startDate: '1992-01-01',
    endDate: '2007-01-01',
    inactive: true,
  };
  const adjustedConfig = update(config, { layers: { $set: layersConfig } });
  let layers = addLayer('end1', {}, [], layersConfig);
  layers = addLayer('end2', {}, layers, layersConfig);
  const range = dateRange({}, layers, adjustedConfig);

  expect(range.start).toEqual(new Date(Date.UTC(1990, 0, 1)));
  expect(range.end).toEqual(new Date(Date.UTC(2007, 0, 1)));
});

test('date range with one layer', () => {
  let state = getState([]);
  state = getDateRangesTestState(state);
  const layers = addLayer('historical_1', {}, [], state.config.layers);
  const range = dateRange({}, layers, state.config);
  const expectedStartTime = new Date(Date.UTC(2000, 0, 1)).getTime();
  const expectedEndTime = new Date(Date.UTC(2010, 0, 1, 0, 0, 59)).getTime();
  expect(range.start.getTime()).toEqual(expectedStartTime);
  expect(range.end.getTime()).toEqual(expectedEndTime);
});

test('date range with two layers', () => {
  let state = getState([]);
  state = getDateRangesTestState(state);
  let layers = addLayer('historical_1', {}, [], state.config.layers);
  layers = addLayer('historical_2', {}, layers, state.config.layers);
  const range = dateRange({}, layers, state.config);
  const expectedStartTime = new Date(Date.UTC(2000, 0, 1)).getTime();
  const expectedEndTime = new Date(Date.UTC(2010, 0, 1, 0, 0, 59)).getTime();
  expect(range.start.getTime()).toEqual(expectedStartTime);
  expect(range.end.getTime()).toEqual(expectedEndTime);
});

test('end of date range is today if no end date', () => {
  let state = getState([]);
  state = getDateRangesTestState(state);
  const layers = addLayer('active_1', {}, [], state.config.layers);
  const range = dateRange({}, layers, state.config);
  const expectedStartTime = new Date(Date.UTC(2005, 0, 1)).getTime();
  const expectedEndTime = new Date(Date.UTC(2010, 0, 1, 0, 0, 59)).getTime();
  expect(range.start.getTime()).toEqual(expectedStartTime);
  expect(range.end.getTime()).toEqual(expectedEndTime);
});

test('no date range with static', () => {
  let state = getState([]);
  state = getDateRangesTestState(state);
  const layers = addLayer('static', {}, [], state.config.layers);
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
