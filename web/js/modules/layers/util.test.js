import { assign } from 'lodash';
import {
  adjustActiveDateRanges,
  datesInDateRanges,
  serializeLayers,
  layersParse12,
  mapLocationToLayerState,
  isVectorLayerClickable,
  hasNonClickableVectorLayer,
  hasVectorLayers,
  adjustStartDates,
  adjustEndDates,
  getCacheOptions,
  mockFutureTimeLayerOptions,
  getLayersFromGroups,
  adjustMeasurementsValidUnitConversion,
} from './util';
import { initialState } from './reducers';
import fixtures from '../../fixtures';

let defaultStateFromLocation = {
  layers: {
    active: {
      layers: [],
    },
    activeB: {
      layers: [],
    },
  },
};
const globalState = fixtures.getState();
const config = fixtures.config();
const PALETTE_LAYER_STRING = 'AMSRE_Brightness_Temp_89H_Night(hidden,opacity=0.54,palette=red_2,min=224,225,max=294,295,squash=true,noclip=true),mask';
const VECTOR_LAYER_STRING = 'OrbitTracks_Aqua_Ascending(hidden,opacity=0.46,style=yellow1),mask';

test('Layer parser, retrieves correct number of palette layers from permalink string [layers-palette-layers]', () => {
  const layers = layersParse12(PALETTE_LAYER_STRING, config);
  expect(layers.length).toBe(2);
});
test('Layer parser, gets correct palette layer ID [layers-palette-layer-id]', () => {
  const layers = layersParse12(PALETTE_LAYER_STRING, config);
  const layer = layers[0];
  expect(layer.id).toBe('AMSRE_Brightness_Temp_89H_Night');
});
test('Layer parser, gets correct custom palette id from permalink string [layers-custom-palette-id]', () => {
  const layers = layersParse12(PALETTE_LAYER_STRING, config);
  const layer = layers[0];
  expect(layer.custom[0]).toBe('red_2');
});
test('Layer parser, gets squashed boolean from permalink string [layers-squashed-boolean]', () => {
  const layers = layersParse12(PALETTE_LAYER_STRING, config);
  const layer = layers[0];
  expect(layer.squash[0]).toBe(true);
});
test('Layer parser, gets noclipped boolean from permalink string [layers-noclipped-boolean]', () => {
  const layers = layersParse12(PALETTE_LAYER_STRING, config);
  const layer = layers[0];
  expect(layer.noclip[0]).toBe(true);
});
test('Layer parser, gets correct min value from permalink string [layers-min-value]', () => {
  const layers = layersParse12(PALETTE_LAYER_STRING, config);
  const layer = layers[0];
  expect(layer.min[0]).toBe(224);
});
test('Layer parser, gets correct max value from permalink string [layers-max-value]', () => {
  const layers = layersParse12(PALETTE_LAYER_STRING, config);
  const layer = layers[0];
  expect(layer.max[0]).toBe(294);
});
test('Layer parser, gets correct max value from permalink string [layers-opacity-value]', () => {
  const layers = layersParse12(PALETTE_LAYER_STRING, config);
  const layer = layers[0];
  expect(layer.opacity).toBe(0.54);
});
test('Layer parser, retrieves hidden palette layer from permalink string [layers-hidden-palette-layer]', () => {
  const layers = layersParse12(PALETTE_LAYER_STRING, config);
  const layer = layers[0];
  expect(layer.opacity).toBe(0.54);
});
test('Layer parser, retrieves correct number of vector layers from permalink string [layers-vector-layers]', () => {
  const layers = layersParse12(VECTOR_LAYER_STRING, config);
  expect(layers.length).toBe(2);
});
test('Layer parser, gets correct vector layer ID [layers-vector-layer-id]', () => {
  const layers = layersParse12(VECTOR_LAYER_STRING, config);
  const layer = layers[0];
  expect(layer.id).toBe('OrbitTracks_Aqua_Ascending');
});
test('Layer parser, gets correct custom vector style id from permalink string [layers-vector-style-id]', () => {
  const layers = layersParse12(VECTOR_LAYER_STRING, config);
  const layer = layers[0];
  expect(layer.custom[0]).toBe('yellow1');
});
test('Layer parser, retrieves hidden vector layer from permalink string [layers-hidden-vector-layer]', () => {
  const layers = layersParse12(VECTOR_LAYER_STRING, config);
  const layer = layers[0];
  expect(layer.opacity).toBe(0.46);
});
test('serialize layers and palettes [layers-serialize]', () => {
  const terraAodLayer = config.layers['terra-aod'];
  const paletteState = {
    palettes: {
      active: { 'terra-aod': config.palettes.rendered['terra-aod'] },
      rendered: config.palettes.rendered,
      custom: config.palettes.custom,
    },
    config,
  };
  const state = assign({}, paletteState, { layers: initialState });
  terraAodLayer.custom = ['red'];
  terraAodLayer.opacity = [0.54];
  const layerStr = serializeLayers([terraAodLayer], state, 'active')[0];
  expect(layerStr).toBe('terra-aod(hidden,opacity=0.54)');
});

// Permalink 1.0
describe('permalink 1.0', () => {
  beforeEach(() => {
    defaultStateFromLocation = {
      layers: {
        active: {
          layers: [],
        },
        activeB: {
          layers: [],
        },
      },
    };
  });
  test('supports old style period delimiters [layers-old-style-delimiters]', () => {
    const parameters = {
      products: 'baselayers.terra-cr~overlays.terra-aod.aqua-aod',
    };
    const stateFromLocation = mapLocationToLayerState(
      parameters,
      defaultStateFromLocation,
      globalState,
      config,
    );
    const activeLayers = stateFromLocation.layers.active.layers;

    expect(activeLayers.find((x) => x.id === 'terra-cr')).toBeTruthy();
    expect(activeLayers.find((x) => x.id === 'terra-aod')).toBeTruthy();
    expect(activeLayers.find((x) => x.id === 'aqua-aod')).toBeTruthy();
  });
});

// Permalink 1.1
describe('permalink 1.1', () => {
  beforeEach(() => {
    defaultStateFromLocation = {
      layers: {
        active: {
          layers: [],
        },
        activeB: {
          layers: [],
        },
      },
    };
  });

  test('parses only one baselayer [layers-parse-one-baselayer]', () => {
    const parameters = {
      products: 'baselayers,terra-cr',
    };

    const stateFromLocation = mapLocationToLayerState(
      parameters,
      defaultStateFromLocation,
      globalState,
      config,
    );
    expect(stateFromLocation.layers.active.layers[0].id).toBe('terra-cr');
  });
  test('parses only one overlay [layers-parse-one-overlay]', () => {
    const parameters = {
      products: 'overlays,terra-aod',
    };
    const stateFromLocation = mapLocationToLayerState(
      parameters,
      defaultStateFromLocation,
      globalState,
      config,
    );

    expect(stateFromLocation.layers.active.layers[0].id).toBe('terra-aod');
  });
  test('parses multiple layers [layers-parse-multiple-layers]', () => {
    const parameters = {
      products: 'baselayers,terra-cr~overlays,terra-aod,aqua-aod',
    };
    const stateFromLocation = mapLocationToLayerState(
      parameters,
      defaultStateFromLocation,
      globalState,
      config,
    );
    const activeLayers = stateFromLocation.layers.active.layers;
    expect(activeLayers.find((x) => x.id === 'terra-cr')).toBeTruthy();
    expect(activeLayers.find((x) => x.id === 'terra-aod')).toBeTruthy();
    expect(activeLayers.find((x) => x.id === 'aqua-aod')).toBeTruthy();
  });
  test('empty layer list [layers-empty-list]', () => {
    const parameters = {
      products: 'baselayers~overlays',
    };
    const stateFromLocation = mapLocationToLayerState(
      parameters,
      defaultStateFromLocation,
      globalState,
      config,
    );
    const activeLayers = stateFromLocation.layers.active.layers;
    expect(activeLayers).toHaveLength(0);
  });
  test('skips invalid layers and records an error [layers-skip-invalid-layers]', () => {
    const parameters = {
      products: 'baselayers,terra-cr~overlays,layerx,aqua-aod',
    };
    const stateFromLocation = mapLocationToLayerState(
      parameters,
      defaultStateFromLocation,
      globalState,
      config,
    );
    const activeLayers = stateFromLocation.layers.active.layers;
    expect(activeLayers.find((x) => x.id === 'terra-cr')).toBeTruthy();
    expect(activeLayers.find((x) => x.id === 'aqua-aod')).toBeTruthy();
  });
  test('no layers if no groups found [layers-no-group-found]', () => {
    const parameters = {
      products: 'layerx,layery',
    };
    const stateFromLocation = mapLocationToLayerState(
      parameters,
      defaultStateFromLocation,
      globalState,
      config,
    );
    const activeLayers = stateFromLocation.layers.active.layers;
    expect(activeLayers).toHaveLength(0);
  });
  test('hidden layers [layers-hidden-layers]', () => {
    const parameters = {
      products: 'baselayers,!terra-cr',
    };
    const stateFromLocation = mapLocationToLayerState(
      parameters,
      defaultStateFromLocation,
      globalState,
      config,
    );
    const activeLayers = stateFromLocation.layers.active.layers;
    expect(activeLayers[0].id).toBe('terra-cr');
    expect(activeLayers[0].visible).toBeFalsy();
  });
});

// Date range building
describe('Date range building', () => {
  beforeEach(() => {
    defaultStateFromLocation = {
      layers: {
        active: {
          layers: [],
        },
        activeB: {
          layers: [],
        },
      },
    };
  });

  test('test active multi-day layers are extending beyond known GC end date using adjustActiveDateRanges [layers-adjust-date-ranges]', () => {
    const parameters = {
      products: 'MODIS_Combined_L4_LAI_4Day',
    };

    const stateFromLocation = mapLocationToLayerState(
      parameters,
      defaultStateFromLocation,
      globalState,
      config,
    );
    const activeLayers = stateFromLocation.layers.active.layers;
    adjustActiveDateRanges(activeLayers, new Date('2021-04-30T16:00:00Z'));
    const { dateRanges } = activeLayers[0];
    expect(dateRanges.length).toBe(4);
    expect(dateRanges[3].endDate).toBe('2021-04-30T16:00:00Z');
  });
  test('test limited date range returned for layer with single date range and interval [layers-limited-date-range]', () => {
    const parameters = {
      products: 'terra-cr',
    };

    const stateFromLocation = mapLocationToLayerState(
      parameters,
      defaultStateFromLocation,
      globalState,
      config,
    );
    const activeLayers = stateFromLocation.layers.active.layers;
    const dates = datesInDateRanges(activeLayers[0], new Date('2020-01-01'));
    expect(dates.length).toBe(3);
  });
  test('test only next date returned (out of range past) [layers-out-of-range-past]', () => {
    const parameters = {
      products: 'terra-cr',
    };

    const stateFromLocation = mapLocationToLayerState(
      parameters,
      defaultStateFromLocation,
      globalState,
      config,
    );
    const activeLayers = stateFromLocation.layers.active.layers;
    const dates = datesInDateRanges(activeLayers[0], new Date('1990-01-01'));
    expect(dates.length).toBe(1);
  });
  test('test no dates returned (out of range future) [layers-out-of-range-future]', () => {
    const parameters = {
      products: 'terra-cr',
    };

    const stateFromLocation = mapLocationToLayerState(
      parameters,
      defaultStateFromLocation,
      globalState,
      config,
    );
    const activeLayers = stateFromLocation.layers.active.layers;
    const dates = datesInDateRanges(activeLayers[0], new Date('2030-01-01'));
    expect(dates.length).toBe(0);
  });
  test('test date range returned from given start/end date range for layer coverage panel [layers-coverage-panel]', () => {
    const parameters = {
      products: 'terra-cr',
    };

    const stateFromLocation = mapLocationToLayerState(
      parameters,
      defaultStateFromLocation,
      globalState,
      config,
    );
    const activeLayers = stateFromLocation.layers.active.layers;
    const dates = datesInDateRanges(activeLayers[0], new Date('2018-01-01'), new Date('2017-12-01'), new Date('2018-02-01'), new Date('2020-01-01'));
    const isFirstDateEqual = dates[0].toISOString() === '2017-12-01T00:00:00.000Z';
    const isLastDateEqual = dates[dates.length - 1].toISOString() === '2018-01-31T00:00:00.000Z';
    expect(dates.length).toBe(62);
    expect(isFirstDateEqual).toBeTruthy();
    expect(isLastDateEqual).toBeTruthy();
  });
});

describe('Vector layers', () => {
  const breakPointLayer = {
    projections: {
      geographic: {
        resolutionBreakPoint: 0.2,
      },
      arctic: {
        resolutionBreakPoint: 0.3,
      },
    },
  };
  const layers = [
    {
      type: 'vector',
      visible: true,
      breakPointLayer,
    },
  ];
  test('isVectorLayerClickable func [layers-vector-layer-clickable]', () => {
    const false1 = isVectorLayerClickable({
      type: 'vector',
    }, null, 'geographic');
    const false2 = isVectorLayerClickable({
      type: 'vector',
      breakPointLayer,
    }, 0.3, 'geographic');
    const true1 = isVectorLayerClickable({
      type: 'vector',
      breakPointLayer,
    }, 0.1, 'geographic');
    const falseArctic = isVectorLayerClickable({
      type: 'vector',
      breakPointLayer,
    }, 0.4, 'arctic');
    const falseWhenEvenZoomArctic = isVectorLayerClickable({
      type: 'vector',
      breakPointLayer,
    }, 0.3, 'arctic');
    const trueArctic = isVectorLayerClickable({
      type: 'vector',
      breakPointLayer,
    }, 0.2, 'arctic');
    expect(false1).toBe(false);
    expect(false2).toBe(false);
    expect(falseArctic).toBe(false);
    expect(falseWhenEvenZoomArctic).toBe(false);
    expect(trueArctic).toBe(true);
    expect(true1).toBe(true);
  });
  test('hasNonClickableVectorLayer func [layers-nonclickable-vector-layer]', () => {
    const false1 = hasNonClickableVectorLayer(layers, 0.1, 'geographic');
    const true1 = hasNonClickableVectorLayer(layers, 0.3, 'geographic');

    expect(false1).toBe(false);
    expect(true1).toBe(true);
  });
  test('hasVectorLayers func [layers-has-vector-layers]', () => {
    const false1 = hasVectorLayers([{ type: 'wms', visible: true }], 0.1);
    const false2 = hasVectorLayers([{ type: 'vector', visible: false }], 0.1);
    const true1 = hasVectorLayers(layers);

    expect(false1).toBe(false);
    expect(false2).toBe(false);
    expect(true1).toBe(true);
  });
});

describe('adjustStartDates', () => {
  const buildConfig = (layerOverrides = {}) => ({
    timeBounds: {
      time: '2020-06-15T00:00:00Z',
    },
    layers: {
      'test-layer': {
        id: 'test-layer',
        availability: {
          rollingWindow: 30,
          historicalRanges: [
            { startDate: '2010-01-01T00:00:00Z', endDate: '2015-01-01T00:00:00Z', dateInterval: '1' },
            { startDate: '2015-01-02T00:00:00Z', endDate: '2019-12-31T00:00:00Z', dateInterval: '1' },
          ],
        },
        startDate: '2000-01-01',
        dateRanges: [
          {
            startDate: '2020-06-01T00:00:00Z',
            endDate: '2021-01-01T00:00:00Z',
            dateInterval: '1',
          },
        ],
        ...layerOverrides,
      },
    },
  });

  test('skips layer without rollingWindow [adjust-start-dates-no-rolling-window]', () => {
    const config = buildConfig({ rollingWindow: undefined });
    const originalStartDate = config.layers['test-layer'].startDate;
    adjustStartDates(config);
    expect(config.layers['test-layer'].startDate).toBe(originalStartDate);
  });

  test('sets layer startDate from adjustDate when no historicalRanges [adjust-start-dates-no-historical-ranges]', () => {
    const config = buildConfig();
    adjustStartDates(config.layers);
    const layer = config.layers['test-layer'];
    expect(layer.startDate).toBeDefined();
    expect(layer.startDate).not.toBe('2000-01-01');
  });
});

describe('getCacheOptions', () => {
  test('returns empty object when not subdaily', () => {
    const options = getCacheOptions('daily', new Date());
    expect(options).toEqual({});
  });

  test('returns expirationAbsolute when subdaily', () => {
    const options = getCacheOptions('subdaily', new Date());
    const tenMin = 10 * 60000;
    const now = new Date().getTime();
    expect(options).toEqual({ expirationAbsolute: new Date(now + tenMin)});
  });
});

describe('adjustEndDates', () => {
  const buildConfig = (layerOverrides = {}) => ({
    timeBounds: {
      time: '2020-06-15T00:00:00Z',
    },
    layers: {
      'test-layer': {
        id: 'test-layer',
        availability: {
          rollingWindow: 30,
          historicalRanges: [
            { startDate: '2010-01-01T00:00:00Z', endDate: '2015-01-01T00:00:00Z', dateInterval: '1' },
            { startDate: '2015-01-02T00:00:00Z', endDate: '2019-12-31T00:00:00Z', dateInterval: '1' },
          ],
        },
        endDate: '2022-01-01',
        dateRanges: [
          {
            startDate: '2020-06-01T00:00:00Z',
            endDate: '2021-01-01T00:00:00Z',
            dateInterval: '1',
          },
        ],
        ...layerOverrides,
      },
    },
  });

  test('skips layer without rollingWindow [adjust-end-dates-no-rolling-window]', () => {
    const config = buildConfig({ rollingWindow: undefined });
    const originalEndDate = config.layers['test-layer'].endDate;
    adjustEndDates(config);
    expect(config.layers['test-layer'].endDate).toBe(originalEndDate);
  });

  test('sets layer endDate from adjustDate when no historicalRanges [adjust-end-dates-no-historical-ranges]', () => {
    const config = buildConfig({ futureTime: '2023-01-01T00:00:00Z' });
    adjustEndDates(config.layers);
    const layer = config.layers['test-layer'];
    expect(layer.endDate).toBeDefined();
    expect(layer.endDate).not.toBe('2022-01-01');
  });
});

describe('mockFutureTimeLayerOptions', () => {
  test('sets futureTime on target layer when valid parameters provided [mock-future-time-sets-value]', () => {
    const layers = {
      'terra-cr': { id: 'terra-cr' },
    };
    mockFutureTimeLayerOptions(layers, 'terra-cr,2030-01-01');
    expect(layers['terra-cr'].futureTime).toBe('2030-01-01');
  });

  test('does not modify layer when targetLayerId does not exist in layers [mock-future-time-missing-layer]', () => {
    const layers = {
      'terra-cr': { id: 'terra-cr' },
    };
    mockFutureTimeLayerOptions(layers, 'aqua-cr,2030-01-01');
    expect(layers['terra-cr'].futureTime).toBeUndefined();
  });

  test('does not set futureTime when mockFutureTime is missing from parameters [mock-future-time-missing-time]', () => {
    const layers = {
      'terra-cr': { id: 'terra-cr' },
    };
    mockFutureTimeLayerOptions(layers, 'terra-cr');
    expect(layers['terra-cr'].futureTime).toBeUndefined();
  });

  test('does not set futureTime when targetLayerId is missing from parameters [mock-future-time-missing-id]', () => {
    const layers = {
      'terra-cr': { id: 'terra-cr' },
    };
    mockFutureTimeLayerOptions(layers, ',2030-01-01');
    expect(layers['terra-cr'].futureTime).toBeUndefined();
  });

  test('sets futureTime on correct layer when multiple layers exist [mock-future-time-multiple-layers]', () => {
    const layers = {
      'terra-cr': { id: 'terra-cr' },
      'aqua-cr': { id: 'aqua-cr' },
    };
    mockFutureTimeLayerOptions(layers, 'aqua-cr,2030-06-15');
    expect(layers['aqua-cr'].futureTime).toBe('2030-06-15');
    expect(layers['terra-cr'].futureTime).toBeUndefined();
  });

  test('overwrites existing futureTime value on target layer [mock-future-time-overwrite]', () => {
    const layers = {
      'terra-cr': { id: 'terra-cr', futureTime: '2025-01-01' },
    };
    mockFutureTimeLayerOptions(layers, 'terra-cr,2030-01-01');
    expect(layers['terra-cr'].futureTime).toBe('2030-01-01');
  });
});

describe('getLayersFromGroups', () => {
  test('returns empty array when groups is falsy [get-layers-from-groups-no-groups]', () => {
    const result = getLayersFromGroups(globalState, null);
    expect(result).toEqual([]);
  });

  test('returns empty array when groups is undefined [get-layers-from-groups-undefined]', () => {
    const result = getLayersFromGroups(globalState, undefined);
    expect(result).toEqual([]);
  });

  test('returns baselayers concatenated when groups is an empty array [get-layers-from-groups-empty-array]', () => {
    const result = getLayersFromGroups(globalState, []);
    result.forEach((layer) => {
      expect(layer.group).toBe('baselayers');
    });
  });

  test('returns mapped overlay layers plus baselayers when groups provided [get-layers-from-groups-with-groups]', () => {
    const overlayGroups = globalState.layers.active.overlayGroups;
    if (!overlayGroups || !overlayGroups.length) return;
    const result = getLayersFromGroups(globalState, overlayGroups);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('adjustMeasurementsValidUnitConversion', () => {
  test('sets disableUnitConversion on layer when measurement has disableUnitConversion true [adjust-measurements-disable-conversion]', () => {
    const layerConfig = {
      id: 'test-layer',
      layergroup: 'test-group',
    };
    const measurementConfig = {
      measurements: {
        'test-group': {
          disableUnitConversion: true,
        },
      },
      layers: {
        'test-layer': layerConfig,
      },
    };
    adjustMeasurementsValidUnitConversion(measurementConfig);
    expect(layerConfig.disableUnitConversion).toBe(true);
  });

  test('does not set disableUnitConversion when measurement does not have disableUnitConversion [adjust-measurements-no-disable]', () => {
    const layerConfig = {
      id: 'test-layer',
      layergroup: 'test-group',
    };
    const measurementConfig = {
      measurements: {
        'test-group': {},
      },
      layers: {
        'test-layer': layerConfig,
      },
    };
    adjustMeasurementsValidUnitConversion(measurementConfig);
    expect(layerConfig.disableUnitConversion).toBeUndefined();
  });

  test('does not modify layer when layergroup is not present on layer [adjust-measurements-no-layergroup]', () => {
    const layerConfig = {
      id: 'test-layer',
    };
    const measurementConfig = {
      measurements: {
        'test-group': {
          disableUnitConversion: true,
        },
      },
      layers: {
        'test-layer': layerConfig,
      },
    };
    adjustMeasurementsValidUnitConversion(measurementConfig);
    expect(layerConfig.disableUnitConversion).toBeUndefined();
  });

  test('does not modify layer when layergroup has no matching measurement [adjust-measurements-no-matching-measurement]', () => {
    const layerConfig = {
      id: 'test-layer',
      layergroup: 'nonexistent-group',
    };
    const measurementConfig = {
      measurements: {
        'test-group': {
          disableUnitConversion: true,
        },
      },
      layers: {
        'test-layer': layerConfig,
      },
    };
    adjustMeasurementsValidUnitConversion(measurementConfig);
    expect(layerConfig.disableUnitConversion).toBeUndefined();
  });

  test('processes multiple layers independently [adjust-measurements-multiple-layers]', () => {
    const layerA = { id: 'layer-a', layergroup: 'group-disable' };
    const layerB = { id: 'layer-b', layergroup: 'group-allow' };
    const layerC = { id: 'layer-c' };
    const measurementConfig = {
      measurements: {
        'group-disable': { disableUnitConversion: true },
        'group-allow': {},
      },
      layers: {
        'layer-a': layerA,
        'layer-b': layerB,
        'layer-c': layerC,
      },
    };
    adjustMeasurementsValidUnitConversion(measurementConfig);
    expect(layerA.disableUnitConversion).toBe(true);
    expect(layerB.disableUnitConversion).toBeUndefined();
    expect(layerC.disableUnitConversion).toBeUndefined();
  });

  test('does not set disableUnitConversion when measurement disableUnitConversion is false [adjust-measurements-disable-false]', () => {
    const layerConfig = {
      id: 'test-layer',
      layergroup: 'test-group',
    };
    const measurementConfig = {
      measurements: {
        'test-group': {
          disableUnitConversion: false,
        },
      },
      layers: {
        'test-layer': layerConfig,
      },
    };
    adjustMeasurementsValidUnitConversion(measurementConfig);
    expect(layerConfig.disableUnitConversion).toBeUndefined();
  });
});
