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
} from './util';
import { initialState } from './reducers';
import fixtures from '../../fixtures';
import util from '../../util/util';

let defaultStateFromLocation = {
  layers: {
    active: {
      layers: [],
    },
  },
};
const globalState = fixtures.getState();
const config = fixtures.config();

describe('Layer parser 1.2', () => {
  const PALETTE_LAYER_STRING = 'AMSRE_Brightness_Temp_89H_Night(hidden,opacity=0.54,palette=red_2,min=224,225,max=294,295,squash=true),mask';
  const VECTOR_LAYER_STRING = 'OrbitTracks_Aqua_Ascending(hidden,opacity=0.46,style=yellow1),mask';

  test('Layer parser, retrieves correct number of palette layers from permalink string', () => {
    const layers = layersParse12(PALETTE_LAYER_STRING, config);
    expect(layers.length).toBe(2);
  });
  test('Layer parser, gets correct palette layer ID', () => {
    const layers = layersParse12(PALETTE_LAYER_STRING, config);
    const layer = layers[0];
    expect(layer.id).toBe('AMSRE_Brightness_Temp_89H_Night');
  });
  test('Layer parser, gets correct custom palette id from permalink string', () => {
    const layers = layersParse12(PALETTE_LAYER_STRING, config);
    const layer = layers[0];
    expect(layer.custom[0]).toBe('red_2');
  });
  test('Layer parser, gets squashed boolean from permalink string', () => {
    const layers = layersParse12(PALETTE_LAYER_STRING, config);
    const layer = layers[0];
    expect(layer.squash[0]).toBe(true);
  });
  test('Layer parser, gets correct min value from permalink string', () => {
    const layers = layersParse12(PALETTE_LAYER_STRING, config);
    const layer = layers[0];
    expect(layer.min[0]).toBe(224);
  });
  test('Layer parser, gets correct max value from permalink string', () => {
    const layers = layersParse12(PALETTE_LAYER_STRING, config);
    const layer = layers[0];
    expect(layer.max[0]).toBe(294);
  });
  test('Layer parser, gets correct max value from permalink string', () => {
    const layers = layersParse12(PALETTE_LAYER_STRING, config);
    const layer = layers[0];
    expect(layer.opacity).toBe(0.54);
  });
  test('Layer parser, retrieves hidden palette layer from permalink string', () => {
    const layers = layersParse12(PALETTE_LAYER_STRING, config);
    const layer = layers[0];
    expect(layer.opacity).toBe(0.54);
  });
  test('Layer parser, retrieves correct number of vector layers from permalink string', () => {
    const layers = layersParse12(VECTOR_LAYER_STRING, config);
    expect(layers.length).toBe(2);
  });
  test('Layer parser, gets correct vector layer ID', () => {
    const layers = layersParse12(VECTOR_LAYER_STRING, config);
    const layer = layers[0];
    expect(layer.id).toBe('OrbitTracks_Aqua_Ascending');
  });
  test('Layer parser, gets correct custom vector style id from permalink string', () => {
    const layers = layersParse12(VECTOR_LAYER_STRING, config);
    const layer = layers[0];
    expect(layer.custom[0]).toBe('yellow1');
  });
  test('Layer parser, retrieves hidden vector layer from permalink string', () => {
    const layers = layersParse12(VECTOR_LAYER_STRING, config);
    const layer = layers[0];
    expect(layer.opacity).toBe(0.46);
  });
  test('serialize layers and palettes', () => {
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
});

describe('permalink 1.0', () => {
  beforeEach(() => {
    defaultStateFromLocation = {
      layers: {
        active: {
          layers: [],
        },
      },
    };
  });
  test('supports old style period delimiters', () => {
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

describe('permalink 1.1', () => {
  beforeEach(() => {
    defaultStateFromLocation = {
      layers: {
        active: {
          layers: [],
        },
      },
    };
  });

  test('parses only one baselayer', () => {
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
  test('parses only one overlay', () => {
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
  test('parses multiple layers', () => {
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
  test('empty layer list', () => {
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
  test('skips invalid layers and records an error', () => {
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
  test('no layers if no groups found', () => {
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
  test('hidden layers', () => {
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

describe('Date range building', () => {
  beforeEach(() => {
    defaultStateFromLocation = {
      layers: {
        active: {
          layers: [],
        },
      },
    };
  });

  test('active multi-day layers are extending beyond known GC end date using adjustActiveDateRanges', () => {
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

  // test('limited date range returned for layer with single date range and interval', () => {
  //   const parameters = {
  //     products: 'terra-cr',
  //   };
  //   const stateFromLocation = mapLocationToLayerState(
  //     parameters,
  //     defaultStateFromLocation,
  //     globalState,
  //     config,
  //   );
  //   const activeLayers = stateFromLocation.layers.active.layers;
  //   const dates = datesInDateRanges(activeLayers[0], new Date('2020-01-01'));
  //   expect(dates.length).toBe(3);
  // });

  // test('only next date returned (out of range past)', () => {
  //   const parameters = {
  //     products: 'terra-cr',
  //   };

  //   const stateFromLocation = mapLocationToLayerState(
  //     parameters,
  //     defaultStateFromLocation,
  //     globalState,
  //     config,
  //   );
  //   const activeLayers = stateFromLocation.layers.active.layers;
  //   const dates = datesInDateRanges(activeLayers[0], new Date('1990-01-01'));
  //   expect(dates.length).toBe(1);
  // });

  test('no dates returned (out of range future)', () => {
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

  test('date range returned from given start/end date range for layer coverage panel', () => {
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
    const dates = datesInDateRanges(
      activeLayers[0], // def
      new Date('2018-01-01'), // "current" date
      new Date('2017-12-01'), // startDateLimit
      new Date('2018-02-01'), // endDateLimit
      new Date('2020-01-01'), // appNow
    );
    const isFirstDateEqual = dates[0].toISOString() === '2017-12-01T00:00:00.000Z';
    const isLastDateEqual = dates[dates.length - 1].toISOString() === '2018-01-31T00:00:00.000Z';
    expect(dates.length).toBe(62);
    expect(isFirstDateEqual).toBeTruthy();
    expect(isLastDateEqual).toBeTruthy();
  });

  describe('subdaily', () => {
    const parameters = {
      products: 'GOES-East_ABI_GeoColor',
    };
    const stateFromLocation = mapLocationToLayerState(
      parameters,
      defaultStateFromLocation,
      globalState,
      config,
    );
    const activeLayers = stateFromLocation.layers.active.layers;

    test('1 - layer has date ranges with overlap', () => {
      const currentDate = new Date('2022-01-25T00:00:00Z');
      const dates = datesInDateRanges(activeLayers[0], currentDate);
      expect(dates.length).toBe(26);
      expect(dates[0].toISOString()).toEqual('2022-01-25T00:00:00.000Z');
      expect(dates[25].toISOString()).toEqual('2022-01-25T04:10:00.000Z');
    });

    test('2 - layer has a date range that is a single day (same start/end date)', () => {
      const dates = datesInDateRanges(
        activeLayers[0], // def
        new Date('2022-01-24T17:00:00Z'), // "current" date
      );
      const isFirstDateEqual = dates[0].toISOString() === '2022-01-24T17:00:00.000Z';
      expect(dates.length).toBe(1);
      expect(isFirstDateEqual).toBeTruthy();
    });

    test('3 - current datetime falls between two date ranges (not available)', () => {
      const dates = datesInDateRanges(
        activeLayers[0], // def
        new Date('2022-01-25T04:20:00Z'), // "current" date
      );
      expect(dates.length).toBe(0);
    });

    test('4 - current datetime falls on start date of a range', () => {
      const dates = datesInDateRanges(
        activeLayers[0], // def
        new Date('2022-01-25T04:30:00Z'), // "current" date
      );
      expect(dates.length).toBe(52);
      expect(dates[0]).toEqual(new Date('2022-01-25T04:30:00Z'));
      expect(dates[dates.length - 1]).toEqual(new Date('2022-01-25T13:00:00Z'));
    });

    test('5 - current datetime falls on end date of a range', () => {
      const dates = datesInDateRanges(
        activeLayers[0], // def
        new Date('2022-01-25T13:00:00Z'), // "current" date
      );
      expect(dates.length).toBe(52);
      expect(dates[0]).toEqual(new Date('2022-01-25T04:30:00Z'));
      expect(dates[dates.length - 1]).toEqual(new Date('2022-01-25T13:00:00Z'));
    });

    test('6 - current datetime falls after end date of latest range, ongoing layer', () => {
      const appNow = new Date('2022-01-28T00:00:00Z');
      const lastMockRangeEndDate = new Date('2022-01-25T13:00:00Z');
      const dates = datesInDateRanges(
        activeLayers[0], // def
        new Date('2022-01-26T13:20:00Z'), // "current" date
        null,
        null,
        appNow,
      );
      expect(dates.length).toBe(355);
      expect(dates[0]).toEqual(lastMockRangeEndDate);
      expect(dates[dates.length - 1]).toEqual(appNow);
    });

    test('7 - current datetime falls after end date of latest range, inactive layer', () => {
      const appNow = new Date('2022-01-28T00:00:00Z');
      const mockInactiveSubdailyLayer = { ...activeLayers[0], inactive: true };
      const dates = datesInDateRanges(
        mockInactiveSubdailyLayer, // def
        new Date('2022-01-26T13:20:00Z'), // "current" date
        null,
        null,
        appNow,
      );
      expect(dates.length).toBe(0);
    });
  });

  describe('daily', () => {
    const parameters = {
      products: 'terra-cr-2',
    };
    const stateFromLocation = mapLocationToLayerState(
      parameters,
      defaultStateFromLocation,
      globalState,
      config,
    );
    const activeLayers = stateFromLocation.layers.active.layers;

    test('1 - date falls within first of several ranges', () => {
      const currentDate = new Date('2015-01-25');
      const startLimit = new Date('2015-01-24');
      const endLimit = new Date('2015-01-26');
      const dates = datesInDateRanges(activeLayers[0], currentDate, startLimit, endLimit);
      expect(dates.length).toBe(2);
      expect(dates[0]).toEqual(startLimit);
      expect(dates[1]).toEqual(currentDate);
    });

    test('2 - layer has a date range that is a single day (same start/end date)', () => {
      const currentDate = new Date('2020-06-20T05:13:00Z');
      const startLimit = new Date('2020-06-19T05:13:00Z');
      const endLimit = new Date('2020-06-21T05:1300Z');
      const dates = datesInDateRanges(activeLayers[0], currentDate, startLimit, endLimit);
      expect(dates.length).toBe(2);
      expect(dates[0]).toEqual(startLimit);
      expect(dates[1]).toEqual(currentDate);
    });

    test('3 - current datetime falls between two date ranges (not available)', () => {
      const currentDate = new Date('2020-06-10T00:00:00Z');
      const startLimit = new Date('2020-06-09T00:00:00Z');
      const endLimit = new Date('2020-06-11T00:00:00Z');
      const dates = datesInDateRanges(activeLayers[0], currentDate, startLimit, endLimit);
      expect(dates.length).toBe(0);
    });

    test('4 - current datetime falls on start date of a range', () => {
      const currentDate = new Date('2000-02-24T00:00:00Z');
      const startLimit = new Date('2000-02-23T00:00:00Z');
      const endLimit = new Date('2000-02-25T00:00:00Z');
      const dates = datesInDateRanges(activeLayers[0], currentDate, startLimit, endLimit);
      expect(dates.length).toBe(2);
      expect(dates[0]).toEqual(startLimit);
      expect(dates[1]).toEqual(currentDate);
    });

    test('5 - current datetime falls on end date of a range', () => {
      const currentDate = new Date('2020-05-20T00:00:00Z');
      const startLimit = new Date('2020-05-19T00:00:00Z');
      const endLimit = new Date('2020-05-21T00:00:00Z');
      const dates = datesInDateRanges(activeLayers[0], currentDate, startLimit, endLimit);
      expect(dates.length).toBe(2);
      expect(dates[0]).toEqual(startLimit);
      expect(dates[1]).toEqual(currentDate);
    });

    test('6 - current datetime falls after end date of latest range, ongoing layer', () => {
      const currentDate = new Date('2021-05-20T00:00:00Z');
      const startLimit = new Date('2021-05-19T00:00:00Z');
      const endLimit = new Date('2021-05-21T00:00:00Z');
      const appNow = new Date('2022-01-01');
      const dates = datesInDateRanges(activeLayers[0], currentDate, startLimit, endLimit, appNow);
      expect(dates.length).toBe(2);
      expect(dates[0]).toEqual(startLimit);
      expect(dates[1]).toEqual(currentDate);
    });

    test('7 - current datetime falls after end date of latest range, inactive layer', () => {
      const mockInactiveDailyLayer = {
        ...activeLayers[0],
        inactive: true,
      };
      const currentDate = new Date('2021-05-20T00:00:00Z');
      const startLimit = new Date('2021-05-19T00:00:00Z');
      const endLimit = new Date('2021-05-21T00:00:00Z');
      const appNow = new Date('2022-01-01');
      const dates = datesInDateRanges(mockInactiveDailyLayer, currentDate, startLimit, endLimit, appNow);
      expect(dates.length).toBe(0);
    });
  });

  describe('multi-day', () => {
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
    test('1 - date is within a range', () => {
      const currentDate = new Date('2018-01-11T05:00:00Z');
      const startLimit = util.dateAdd(currentDate, 'day', -4);
      const endLimit = util.dateAdd(currentDate, 'day', 4);
      const dates = datesInDateRanges(activeLayers[0], currentDate, startLimit, endLimit);
      expect(dates.length).toBe(91);
      expect(dates[0]).toEqual(new Date('2018-01-01T00:00:00Z'));
      expect(dates[dates.length - 1]).toEqual(new Date('2018-12-27T00:00:00Z'));
    });

    test('3 - current datetime falls between two date ranges (not available)', () => {
      const currentDate = new Date('2018-12-28T01:32:00Z');
      const startLimit = util.dateAdd(currentDate, 'day', -4);
      const endLimit = util.dateAdd(currentDate, 'day', 4);
      const dates = datesInDateRanges(activeLayers[0], currentDate, startLimit, endLimit);
      expect(dates.length).toBe(0);
    });

    test('4 - current datetime falls on start date of a range', () => {
      const currentDate = new Date('2019-01-01T00:00:00Z');
      const startLimit = util.dateAdd(currentDate, 'day', -4);
      const endLimit = util.dateAdd(currentDate, 'day', 4);
      const dates = datesInDateRanges(activeLayers[0], currentDate, startLimit, endLimit);
      expect(dates.length).toBe(91);
      expect(dates[0]).toEqual(currentDate);
      expect(dates[dates.length - 1]).toEqual(new Date('2019-12-27T00:00:00Z'));
    });

    test('5 - current datetime falls on end date of a range', () => {
      const currentDate = new Date('2020-09-25T00:00:00Z');
      const startLimit = util.dateAdd(currentDate, 'day', -4);
      const endLimit = util.dateAdd(currentDate, 'day', 4);
      const dates = datesInDateRanges(activeLayers[0], currentDate, startLimit, endLimit);
      expect(dates.length).toBe(68);
      expect(dates[0]).toEqual(new Date('2020-01-01T00:00:00Z'));
      expect(dates[dates.length - 1]).toEqual(new Date('2020-09-25T00:00:00Z'));
    });

    test('6 - current datetime falls after end date of latest range, ongoing layer', () => {
      const currentDate = new Date('2020-10-08T00:00:00Z');
      const startLimit = util.dateAdd(currentDate, 'day', -4);
      const endLimit = util.dateAdd(currentDate, 'day', 4);
      const appNow = new Date('2021-03-01');
      const dates = datesInDateRanges(activeLayers[0], currentDate, startLimit, endLimit, appNow);
      console.log(dates);
      expect(dates.length).toBe(39);
      expect(dates[0]).toEqual(new Date('2020-09-29T00:00:00.000Z'));
      expect(dates[dates.length - 1]).toEqual(new Date('2021-02-28T00:00:00.000Z'));
    });

    test('7 - current datetime falls after end date of latest range, inactive layer', () => {
      const mockInactiveDailyLayer = {
        ...activeLayers[0],
        inactive: true,
      };
      const currentDate = new Date('2020-09-30T00:00:00Z');
      const startLimit = util.dateAdd(currentDate, 'day', -4);
      const endLimit = util.dateAdd(currentDate, 'day', 4);
      const appNow = new Date('2021-07-01');
      const dates = datesInDateRanges(mockInactiveDailyLayer, currentDate, startLimit, endLimit, appNow);
      expect(dates.length).toBe(0);
    });
  });

  describe('monthly', () => {

  });

  describe('yearly', () => {

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
  test('isVectorLayerClickable func', () => {
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
  test('hasNonClickableVectorLayer func', () => {
    const false1 = hasNonClickableVectorLayer(layers, 0.1, 'geographic');
    const true1 = hasNonClickableVectorLayer(layers, 0.3, 'geographic');

    expect(false1).toBe(false);
    expect(true1).toBe(true);
  });
  test('hasVectorLayers func', () => {
    const false1 = hasVectorLayers([{ type: 'wms', visible: true }], 0.1);
    const false2 = hasVectorLayers([{ type: 'vector', visible: false }], 0.1);
    const true1 = hasVectorLayers(layers);

    expect(false1).toBe(false);
    expect(false2).toBe(false);
    expect(true1).toBe(true);
  });
});
