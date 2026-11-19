import {
  getLeadingExtent,
  getRotatedExtent,
  mapIsExtentValid,
  getMapParameterSetup,
  promiseImageryForTime,
  promiseImageryForTour,
} from './util';

jest.mock('ol/extent', () => ({
  getForViewAndSize: jest.fn(() => [10, 20, 30, 40]),
}));

jest.mock('ol/layer/Image', () => {
  const MockImageLayer = jest.fn().mockImplementation(() => ({}));
  return MockImageLayer;
});

jest.mock('ol/Map', () => {
  return jest.fn().mockImplementation(() => {
    const layersArray = [];
    const listeners = {};
    const instance = {
      getView: jest.fn(),
      setView: jest.fn(),
      addLayer: jest.fn((layer) => layersArray.push(layer)),
      removeLayer: jest.fn((layer) => {
        const idx = layersArray.indexOf(layer);
        if (idx !== -1) layersArray.splice(idx, 1);
      }),
      getLayers: jest.fn(() => ({ getArray: jest.fn(() => layersArray) })),
      on: jest.fn((event, cb) => { listeners[event] = cb; }),
      un: jest.fn((event) => { delete listeners[event]; }),
      fire: (event) => { if (listeners[event]) listeners[event](); },
      layersArray,
    };
    return instance;
  });
});

jest.mock('../link/util', () => ({
  encode: jest.fn((val) => `encoded:${val}`),
}));

jest.mock('../layers/selectors', () => ({
  getActiveVisibleLayersAtDate: jest.fn(),
}));

jest.mock('../date/util', () => ({
  tryCatchDate: jest.fn((dateString) => new Date(dateString)),
}));

import * as olExtent from 'ol/extent';
import OlMap from 'ol/Map';
import { encode } from '../link/util';
import { getActiveVisibleLayersAtDate } from '../layers/selectors';
import { tryCatchDate } from '../date/util';

function makeMockMap(view) {
  return {
    getView: jest.fn(() => view || {}),
    getSize: jest.fn(() => [800, 600]),
  };
}

function makeBaseState(uiOverrides = {}) {
  const mockChanged = jest.fn();
  const mockView = { changed: mockChanged };
  const mockSelected = { getView: jest.fn(() => mockView) };
  const mockCache = { getItem: jest.fn(() => null) };
  const mockLayerKey = jest.fn(() => 'key');
  const mockCreateLayer = jest.fn();

  const state = {
    map: {
      ui: {
        proj: 'geographic',
        cache: mockCache,
        selected: mockSelected,
        createLayer: mockCreateLayer,
        layerKey: mockLayerKey,
        ...uiOverrides,
      },
    },
  };

  return { state, mockChanged, mockCache, mockSelected, mockCreateLayer, mockLayerKey };
}

function makeTileLayer() {
  return {
    isVector: false,
    setVisible: jest.fn(),
  };
}

function makeLayerGroup(layers, proj = 'arctic') {
  return {
    wv: { proj },
    getLayersArray: jest.fn(() => layers),
  };
}

describe('getLeadingExtent', () => {
  const minLat = -46.546875;
  const maxLat = 53.015625;

  function makeUTCDate(hour) {
    return new Date(Date.UTC(2020, 0, 1, hour, 0, 0));
  }

  test('hour 0 forces curHour to 23', () => {
    const result = getLeadingExtent(makeUTCDate(0));
    const expectedMinLon = 20.6015625 + 23 * (-200.53125 / 23.0);
    const expectedMaxLon = expectedMinLon + 159.328125;
    expect(result).toEqual([expectedMinLon, minLat, expectedMaxLon, maxLat]);
  });

  test('hour 1 forces curHour to 23', () => {
    const result = getLeadingExtent(makeUTCDate(1));
    const expectedMinLon = 20.6015625 + 23 * (-200.53125 / 23.0);
    const expectedMaxLon = expectedMinLon + 159.328125;
    expect(result).toEqual([expectedMinLon, minLat, expectedMaxLon, maxLat]);
  });

  test('hour 2 forces curHour to 23', () => {
    const result = getLeadingExtent(makeUTCDate(2));
    const expectedMinLon = 20.6015625 + 23 * (-200.53125 / 23.0);
    const expectedMaxLon = expectedMinLon + 159.328125;
    expect(result).toEqual([expectedMinLon, minLat, expectedMaxLon, maxLat]);
  });

  test('hour 3 forces curHour to 0', () => {
    const result = getLeadingExtent(makeUTCDate(3));
    const expectedMinLon = 20.6015625 + 0 * (-200.53125 / 23.0);
    const expectedMaxLon = expectedMinLon + 159.328125;
    expect(result).toEqual([expectedMinLon, minLat, expectedMaxLon, maxLat]);
  });

  test('hour 8 forces curHour to 0', () => {
    const result = getLeadingExtent(makeUTCDate(8));
    const expectedMinLon = 20.6015625 + 0 * (-200.53125 / 23.0);
    const expectedMaxLon = expectedMinLon + 159.328125;
    expect(result).toEqual([expectedMinLon, minLat, expectedMaxLon, maxLat]);
  });

  test('hour 9 uses actual hour', () => {
    const result = getLeadingExtent(makeUTCDate(9));
    const expectedMinLon = 20.6015625 + 9 * (-200.53125 / 23.0);
    const expectedMaxLon = expectedMinLon + 159.328125;
    expect(result).toEqual([expectedMinLon, minLat, expectedMaxLon, maxLat]);
  });

  test('hour 23 uses actual hour', () => {
    const result = getLeadingExtent(makeUTCDate(23));
    const expectedMinLon = 20.6015625 + 23 * (-200.53125 / 23.0);
    const expectedMaxLon = expectedMinLon + 159.328125;
    expect(result).toEqual([expectedMinLon, minLat, expectedMaxLon, maxLat]);
  });

  test('always returns a 4-element array with correct lat bounds', () => {
    const result = getLeadingExtent(makeUTCDate(12));
    expect(result).toHaveLength(4);
    expect(result[1]).toBe(minLat);
    expect(result[3]).toBe(maxLat);
  });
});

describe('getRotatedExtent', () => {
  test('calls getForViewAndSize with correct args and returns result', () => {
    const mockCenter = [0, 0];
    const mockResolution = 2000;
    const mockSize = [800, 600];
    const mockView = {
      getCenter: jest.fn(() => mockCenter),
      getResolution: jest.fn(() => mockResolution),
    };
    const mockMap = {
      getView: jest.fn(() => mockView),
      getSize: jest.fn(() => mockSize),
    };

    const result = getRotatedExtent(mockMap);

    expect(mockMap.getView).toHaveBeenCalled();
    expect(olExtent.getForViewAndSize)
      .toHaveBeenCalledWith(mockCenter, mockResolution, 0, mockSize);
    expect(result).toEqual([10, 20, 30, 40]);
  });
});

describe('mapIsExtentValid', () => {
  test('returns false for undefined input', () => {
    expect(mapIsExtentValid(undefined)).toBe(false);
  });

  test('returns true for valid array extent', () => {
    expect(mapIsExtentValid([10, 20, 30, 40])).toBe(true);
  });

  test('returns false when any value is NaN', () => {
    expect(mapIsExtentValid([10, NaN, 30, 40])).toBe(false);
  });

  test('returns false when all values are NaN', () => {
    expect(mapIsExtentValid([NaN, NaN, NaN, NaN])).toBe(false);
  });

  test('returns true for object with toArray returning valid values', () => {
    const extentObj = { toArray: () => [1, 2, 3, 4] };
    expect(mapIsExtentValid(extentObj)).toBe(true);
  });

  test('returns false for object with toArray returning NaN values', () => {
    const extentObj = { toArray: () => [1, NaN, 3, 4] };
    expect(mapIsExtentValid(extentObj)).toBe(false);
  });

  test('returns true for valid negative values', () => {
    expect(mapIsExtentValid([-180, -90, 180, 90])).toBe(true);
  });

  test('returns true for zero values', () => {
    expect(mapIsExtentValid([0, 0, 0, 0])).toBe(true);
  });
});

describe('getMapParameterSetup', () => {
  let config;
  let models;
  let errors;
  let parameters;
  let legacyState;

  beforeEach(() => {
    config = { pageLoadTime: new Date(Date.UTC(2020, 0, 1, 12, 0, 0)) };
    models = { map: { load: jest.fn() } };
    errors = [];
    parameters = {};
    legacyState = {};
    encode.mockReturnValue('encodedExtent');
  });

  test('calls models.map.load with legacyState and errors', () => {
    getMapParameterSetup(parameters, config, models, legacyState, errors);
    expect(models.map.load).toHaveBeenCalledWith(legacyState, errors);
  });

  test('returns object with v and r keys', () => {
    const result = getMapParameterSetup(parameters, config, models, legacyState, errors);
    expect(result).toHaveProperty('v');
    expect(result).toHaveProperty('r');
  });

  test('v.stateKey is map.extent', () => {
    const result = getMapParameterSetup(parameters, config, models, legacyState, errors);
    expect(result.v.stateKey).toBe('map.extent');
  });

  test('v.initialState is the leading extent', () => {
    const result = getMapParameterSetup(parameters, config, models, legacyState, errors);
    expect(result.v.initialState).toEqual(getLeadingExtent(config.pageLoadTime));
  });

  test('r.stateKey is map.rotation', () => {
    const result = getMapParameterSetup(parameters, config, models, legacyState, errors);
    expect(result.r.stateKey).toBe('map.rotation');
  });

  test('r.initialState is 0', () => {
    const result = getMapParameterSetup(parameters, config, models, legacyState, errors);
    expect(result.r.initialState).toBe(0);
  });

  describe('v.options.parse', () => {
    test('parses valid extent string and returns float array', () => {
      const result = getMapParameterSetup(parameters, config, models, legacyState, errors);
      expect(result.v.options.parse('10,20,30,40')).toEqual([10, 20, 30, 40]);
    });

    test('returns leadingExtent and pushes error for invalid extent', () => {
      const result = getMapParameterSetup(parameters, config, models, legacyState, errors);
      const parsed = result.v.options.parse('foo,bar,baz,qux');
      expect(parsed).toEqual(getLeadingExtent(config.pageLoadTime));
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Invalid extent');
    });
  });

  describe('v.options.serialize', () => {
    test('returns encoded extent when valid and not equal to leading extent', () => {
      const result = getMapParameterSetup(parameters, config, models, legacyState, errors);
      const currentState = { map: { rotation: 0, leadingExtent: [0, 0, 0, 0] } };
      const serialized = result.v.options.serialize([1, 2, 3, 4], currentState);
      expect(encode).toHaveBeenCalledWith([1, 2, 3, 4]);
      expect(serialized).toBe('encodedExtent');
    });

    test('returns undefined when extent equals leading extent', () => {
      const result = getMapParameterSetup(parameters, config, models, legacyState, errors);
      const leadingExtent = getLeadingExtent(config.pageLoadTime);
      const currentState = { map: { rotation: 0, leadingExtent } };
      expect(result.v.options.serialize(leadingExtent, currentState)).toBeUndefined();
    });

    test('uses getRotatedExtent when rotation is truthy', () => {
      const result = getMapParameterSetup(parameters, config, models, legacyState, errors);
      const mockView = {
        getCenter: jest.fn(() => [0, 0]),
        getResolution: jest.fn(() => 100),
      };
      const mockMap = {
        getView: jest.fn(() => mockView),
        getSize: jest.fn(() => [800, 600]),
      };
      const currentState = {
        map: {
          rotation: 1.0,
          leadingExtent: [0, 0, 0, 0],
          ui: { selected: mockMap },
        },
      };
      result.v.options.serialize([1, 2, 3, 4], currentState);
      expect(olExtent.getForViewAndSize).toHaveBeenCalled();
    });

    test('returns undefined when currentItemState is invalid and leadingExtent matches', () => {
      const result = getMapParameterSetup(parameters, config, models, legacyState, errors);
      const leadingExtent = getLeadingExtent(config.pageLoadTime);
      const currentState = { map: { rotation: 0, leadingExtent } };
      expect(result.v.options.serialize([NaN, NaN, NaN, NaN], currentState)).toBeUndefined();
    });
  });

  describe('r.options.parse', () => {
    test('returns 0 for a numeric string', () => {
      const result = getMapParameterSetup(parameters, config, models, legacyState, errors);
      expect(result.r.options.parse('45')).toBe(0);
    });

    test('returns 0 for another numeric string', () => {
      const result = getMapParameterSetup(parameters, config, models, legacyState, errors);
      expect(result.r.options.parse('180')).toBe(0);
    });

    test('returns NaN when passed NaN directly', () => {
      const result = getMapParameterSetup(parameters, config, models, legacyState, errors);
      expect(result.r.options.parse(NaN)).toBeNaN();
    });
  });

  describe('r.options.serialize', () => {
    test('returns degrees string when rotation is set and proj is not geographic', () => {
      const result = getMapParameterSetup(parameters, config, models, legacyState, errors);
      const currentState = { proj: { selected: { id: 'arctic' } } };
      expect(result.r.options.serialize(Math.PI, currentState)).toBe((180.0).toPrecision(6));
    });

    test('returns undefined when proj is geographic', () => {
      const result = getMapParameterSetup(parameters, config, models, legacyState, errors);
      const currentState = { proj: { selected: { id: 'geographic' } } };
      expect(result.r.options.serialize(Math.PI, currentState)).toBeUndefined();
    });

    test('returns undefined when currentItemState is falsy', () => {
      const result = getMapParameterSetup(parameters, config, models, legacyState, errors);
      const currentState = { proj: { selected: { id: 'arctic' } } };
      expect(result.r.options.serialize(0, currentState)).toBeUndefined();
    });
  });
});

describe('promiseImageryForTime', () => {
  beforeEach(() => {
    OlMap.mockClear();
    document.body.innerHTML = '';
  });

  test('returns undefined when map.ui.proj is falsy', async () => {
    const { state } = makeBaseState({ proj: null });
    const result = await promiseImageryForTime(state, new Date(), 'active');
    expect(result).toBeUndefined();
  });

  test('returns date when layers list is empty', async () => {
    const { state, mockChanged } = makeBaseState();
    getActiveVisibleLayersAtDate.mockReturnValue([]);
    const date = new Date('2020-01-01');
    const result = await promiseImageryForTime(state, date, 'active');
    expect(result).toBe(date);
    expect(mockChanged).toHaveBeenCalled();
  });

  test('skips granule layers', async () => {
    const { state, mockCreateLayer } = makeBaseState();
    getActiveVisibleLayersAtDate.mockReturnValue([{ type: 'granule' }]);
    await promiseImageryForTime(state, new Date(), 'active');
    expect(mockCreateLayer).not.toHaveBeenCalled();
  });

  test('skips titiler layers', async () => {
    const { state, mockCreateLayer } = makeBaseState();
    getActiveVisibleLayersAtDate.mockReturnValue([{ type: 'titiler' }]);
    await promiseImageryForTime(state, new Date(), 'active');
    expect(mockCreateLayer).not.toHaveBeenCalled();
  });

  test('uses cached item when available and does not call createLayer', async () => {
    const cachedLayerGroup = { wv: { proj: null } };
    const { state, mockCreateLayer, mockChanged } = makeBaseState();
    state.map.ui.cache.getItem.mockReturnValue(cachedLayerGroup);
    getActiveVisibleLayersAtDate.mockReturnValue([{ type: 'wms' }]);
    await promiseImageryForTime(state, new Date(), 'active');
    expect(mockCreateLayer).not.toHaveBeenCalled();
    expect(mockChanged).toHaveBeenCalled();
  });

  test('calls createLayer when layer is not cached', async () => {
    const layerGroup = { wv: { proj: null } };
    const { state, mockCreateLayer, mockChanged } = makeBaseState();
    mockCreateLayer.mockResolvedValue(layerGroup);
    getActiveVisibleLayersAtDate.mockReturnValue([{ type: 'wms' }]);
    await promiseImageryForTime(state, new Date(), 'active');
    expect(mockCreateLayer).toHaveBeenCalled();
    expect(mockChanged).toHaveBeenCalled();
  });
});

describe('promiseImageryForTour', () => {
  beforeEach(() => {
    OlMap.mockClear();
    document.body.innerHTML = '';
    tryCatchDate.mockImplementation((dateString) => new Date(dateString));
  });

  test('returns early when map.ui.proj is falsy', async () => {
    const { state, mockChanged } = makeBaseState({ proj: null });
    await promiseImageryForTour(state, [], '2020-01-01', 'active');
    expect(mockChanged).not.toHaveBeenCalled();
  });

  test('processes empty layer list and calls changed', async () => {
    const { state, mockChanged } = makeBaseState();
    await promiseImageryForTour(state, [], '2020-01-01', 'active');
    expect(mockChanged).toHaveBeenCalled();
  });

  test('skips granule layers', async () => {
    const { state, mockCreateLayer } = makeBaseState();
    await promiseImageryForTour(state, [{ type: 'granule' }], '2020-01-01', 'active');
    expect(mockCreateLayer).not.toHaveBeenCalled();
  });

  test('skips titiler layers', async () => {
    const { state, mockCreateLayer } = makeBaseState();
    await promiseImageryForTour(state, [{ type: 'titiler' }], '2020-01-01', 'active');
    expect(mockCreateLayer).not.toHaveBeenCalled();
  });

  test('defaults group to active when activeString is undefined', async () => {
    const { state, mockCreateLayer, mockLayerKey } = makeBaseState();
    const layerGroup = { wv: { proj: null } };
    mockCreateLayer.mockResolvedValue(layerGroup);
    await promiseImageryForTour(state, [{ type: 'wms' }], '2020-01-01', undefined);
    expect(mockLayerKey).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ group: 'active' }),
      state,
    );
  });

  test('builds style from layer.custom', async () => {
    const { state, mockCreateLayer, mockLayerKey } = makeBaseState();
    const layerGroup = { wv: { proj: null } };
    mockCreateLayer.mockResolvedValue(layerGroup);
    const layer = { type: 'wms', custom: 'myPalette' };
    await promiseImageryForTour(state, [layer], '2020-01-01', 'active');
    expect(mockLayerKey).toHaveBeenCalledWith(
      layer,
      expect.objectContaining({ style: 'palette=myPalette' }),
      state,
    );
  });

  test('builds style from layer.min', async () => {
    const { state, mockCreateLayer, mockLayerKey } = makeBaseState();
    const layerGroup = { wv: { proj: null } };
    mockCreateLayer.mockResolvedValue(layerGroup);
    const layer = { type: 'wms', min: 0.1 };
    await promiseImageryForTour(state, [layer], '2020-01-01', 'active');
    expect(mockLayerKey).toHaveBeenCalledWith(
      layer,
      expect.objectContaining({ style: 'min=0.1' }),
      state,
    );
  });

  test('builds style from layer.max', async () => {
    const { state, mockCreateLayer, mockLayerKey } = makeBaseState();
    const layerGroup = { wv: { proj: null } };
    mockCreateLayer.mockResolvedValue(layerGroup);
    const layer = { type: 'wms', max: 0.9 };
    await promiseImageryForTour(state, [layer], '2020-01-01', 'active');
    expect(mockLayerKey).toHaveBeenCalledWith(
      layer,
      expect.objectContaining({ style: 'max=0.9' }),
      state,
    );
  });

  test('builds style with squash', async () => {
    const { state, mockCreateLayer, mockLayerKey } = makeBaseState();
    const layerGroup = { wv: { proj: null } };
    mockCreateLayer.mockResolvedValue(layerGroup);
    const layer = { type: 'wms', squash: true };
    await promiseImageryForTour(state, [layer], '2020-01-01', 'active');
    expect(mockLayerKey).toHaveBeenCalledWith(
      layer,
      expect.objectContaining({ style: 'squash' }),
      state,
    );
  });

  test('builds style with noclip', async () => {
    const { state, mockCreateLayer, mockLayerKey } = makeBaseState();
    const layerGroup = { wv: { proj: null } };
    mockCreateLayer.mockResolvedValue(layerGroup);
    const layer = { type: 'wms', noclip: true };
    await promiseImageryForTour(state, [layer], '2020-01-01', 'active');
    expect(mockLayerKey).toHaveBeenCalledWith(
      layer,
      expect.objectContaining({ style: 'noclip' }),
      state,
    );
  });

  test('builds combined style string from all options', async () => {
    const { state, mockCreateLayer, mockLayerKey } = makeBaseState();
    const layerGroup = { wv: { proj: null } };
    mockCreateLayer.mockResolvedValue(layerGroup);
    const layer = { type: 'wms', custom: 'pal', min: 0.1, max: 0.9, squash: true, noclip: true };
    await promiseImageryForTour(state, [layer], '2020-01-01', 'active');
    expect(mockLayerKey).toHaveBeenCalledWith(
      layer,
      expect.objectContaining({ style: 'palette=pal,min=0.1,max=0.9,squash,noclip' }),
      state,
    );
  });

  test('does not set style when no style keys are present', async () => {
    const { state, mockCreateLayer, mockLayerKey } = makeBaseState();
    const layerGroup = { wv: { proj: null } };
    mockCreateLayer.mockResolvedValue(layerGroup);
    const layer = { type: 'wms' };
    await promiseImageryForTour(state, [layer], '2020-01-01', 'active');
    const callArgs = mockLayerKey.mock.calls[0][1];
    expect(callArgs).not.toHaveProperty('style');
  });

  test('uses cached item and does not call createLayer', async () => {
    const { state, mockCreateLayer, mockChanged } = makeBaseState();
    const cachedLayerGroup = { wv: { proj: null } };
    state.map.ui.cache.getItem.mockReturnValue(cachedLayerGroup);
    await promiseImageryForTour(state, [{ type: 'wms' }], '2020-01-01', 'active');
    expect(mockCreateLayer).not.toHaveBeenCalled();
    expect(mockChanged).toHaveBeenCalled();
  });
});

describe('promiseTileLayer (via promiseImageryForTime)', () => {
  beforeEach(() => {
    OlMap.mockClear();
    document.body.innerHTML = '';
  });

  test('resolves immediately when wv-map container is absent from DOM', async () => {
    const mockMap = makeMockMap();
    const tileLayer = makeTileLayer();
    const layerGroup = makeLayerGroup([tileLayer], 'arctic');
    const { state, mockChanged } = makeBaseState({
      createLayer: jest.fn().mockResolvedValue(layerGroup),
      proj: { arctic: mockMap },
    });

    getActiveVisibleLayersAtDate.mockReturnValue([{ type: 'wms' }]);

    await promiseImageryForTime(state, new Date(), 'active');
    expect(mockChanged).toHaveBeenCalled();
  });

  test('creates preloadMap and resolves after loadend fires', async () => {
    const mapContainer = document.createElement('div');
    mapContainer.setAttribute('id', 'wv-map');
    document.body.appendChild(mapContainer);

    const mockView = {};
    const mockMap = makeMockMap(mockView);
    const tileLayer = makeTileLayer();
    const layerGroup = makeLayerGroup([tileLayer], 'arctic');
    const { state, mockChanged } = makeBaseState({
      createLayer: jest.fn().mockResolvedValue(layerGroup),
      proj: { arctic: mockMap },
    });

    getActiveVisibleLayersAtDate.mockReturnValue([{ type: 'wms' }]);

    const promise = promiseImageryForTime(state, new Date(), 'active');

    await Promise.resolve();
    await Promise.resolve();

    const instance = OlMap.mock.results[0]?.value;
    if (instance?.fire) instance.fire('loadend');

    await promise;

    expect(OlMap).toHaveBeenCalled();
    expect(mockChanged).toHaveBeenCalled();
  });

  test('skips promiseTileLayer for vector layers', async () => {
    const mapContainer = document.createElement('div');
    mapContainer.setAttribute('id', 'wv-map');
    document.body.appendChild(mapContainer);

    const mockMap = makeMockMap();
    const vectorLayer = { isVector: true, setVisible: jest.fn() };
    const layerGroup = makeLayerGroup([vectorLayer], 'arctic');
    const { state, mockChanged } = makeBaseState({
      createLayer: jest.fn().mockResolvedValue(layerGroup),
      proj: { arctic: mockMap },
    });

    getActiveVisibleLayersAtDate.mockReturnValue([{ type: 'wms' }]);

    await promiseImageryForTime(state, new Date(), 'active');

    expect(vectorLayer.setVisible).not.toHaveBeenCalled();
    expect(mockChanged).toHaveBeenCalled();
  });
});
