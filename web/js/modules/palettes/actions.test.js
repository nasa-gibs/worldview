import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fetchMock from 'fetch-mock';
import { assign, cloneDeep } from 'lodash';
import update from 'immutability-helper';
import { TextEncoder, TextDecoder } from 'util';
import {
  requestPalette,
  setThresholdRangeAndSquash,
  setCustomPalette,
  clearCustomPalette,
} from './actions';
import { addLayer } from '../layers/selectors';
import {
  REQUEST_PALETTE_START,
  REQUEST_PALETTE_SUCCESS,
  REQUEST_PALETTE_FAILURE,
  SET_THRESHOLD_RANGE_AND_SQUASH,
  SET_CUSTOM,
  CLEAR_CUSTOM,
} from './constants';
import fixtures from '../../fixtures';

// jsdom polyfills
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

const middlewares = [thunk];

const state = fixtures.getState();
const config = fixtures.config();
const ERROR_MESSAGE = 'There was an error';

describe('Palette terra-aod fetching with requestPalette action [palettes-actions-request-palette]', () => {
  const mockStore = configureMockStore(middlewares);
  afterEach(() => {
    fetchMock.restore();
  });
  const loc = 'config/palettes/terra-aod.json';
  test(`test ${REQUEST_PALETTE_SUCCESS}`, () => {
    fetchMock.getOnce(loc, {
      body: JSON.stringify(config.palettes.rendered['terra-aod']),
      headers: {
        'content-type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
    const expectedActions = [
      { type: REQUEST_PALETTE_START, id: 'terra-aod' },
      {
        type: REQUEST_PALETTE_SUCCESS,
        id: 'terra-aod',
        response: config.palettes.rendered['terra-aod'],
      },
    ];
    const store = mockStore(state);
    return store.dispatch(requestPalette('terra-aod')).then(() => {
      expect(store.getActions()).toEqual(expectedActions);
    });
  });
  test(`Test ${REQUEST_PALETTE_FAILURE} [palettes-actions-failure]`, () => {
    fetchMock.mock(loc, {
      throws: ERROR_MESSAGE,
    });
    const expectedActions = [
      { type: REQUEST_PALETTE_START, id: 'terra-aod' },
      {
        type: REQUEST_PALETTE_FAILURE,
        id: 'terra-aod',
        error: ERROR_MESSAGE,
      },
    ];
    const store = mockStore(state);
    return store.dispatch(requestPalette('terra-aod')).catch(() => {
      expect(store.getActions()).toEqual(expectedActions);
    });
  });
});
describe('Test lookup actions [palettes-actions-lookup]', () => {
  const mockStore = configureMockStore(middlewares);
  let layers = addLayer('terra-aod', {}, [], config.layers, 0);
  layers = addLayer('aqua-cr', {}, layers, config.layers, 1);
  const stateWithLayers = update(state, {
    layers: { active: { $set: layers } },
  });
  afterEach(() => {
    fetchMock.restore();
  });
  test(`test ${setThresholdRangeAndSquash} action with min equal to 1`, () => {
    const store = mockStore(stateWithLayers);
    store.dispatch(setThresholdRangeAndSquash('terra-aod', { min: 1 }, 0, 'active'));
    const response = store.getActions()[0];

    expect(response.type).toEqual(SET_THRESHOLD_RANGE_AND_SQUASH);
    expect(response.props).toEqual({ min: 1 });
    expect(response.groupName).toEqual('active');
    expect(response.layerId).toEqual('terra-aod');
    expect(response.activeString).toEqual('active');
    expect(response.palettes['terra-aod'].maps[0].legend.colors).toEqual([
      '00000000',
      fixtures.yellow,
      fixtures.red,
    ]);
    expect(response.palettes['terra-aod'].maps[0].min).toEqual(1);
    expect(response.palettes['terra-aod'].maps[0].max).toEqual(undefined);
    expect(response.palettes['terra-aod'].maps[0].squash).toEqual(undefined);
    expect(response.palettes['terra-aod'].lookup).toEqual(
      config.palettes.lookups['terra-aod']['min-1'],
    );
  });
  test(`test ${setThresholdRangeAndSquash} action with squash and max [palettes-actions-threshold]`, () => {
    const store = mockStore(stateWithLayers);
    store.dispatch(
      setThresholdRangeAndSquash('terra-aod', { max: 1, squash: true }, 0, 'active'),
    );
    const response = store.getActions()[0];

    expect(response.type).toEqual(SET_THRESHOLD_RANGE_AND_SQUASH);
    expect(response.props).toEqual({ max: 1, squash: true });
    expect(response.groupName).toEqual('active');
    expect(response.layerId).toEqual('terra-aod');
    expect(response.activeString).toEqual('active');
    expect(response.palettes['terra-aod'].maps[0].legend.colors).toEqual([
      '00ff00ff',
      'ff0000ff',
      '00000000',
    ]);
    expect(response.palettes['terra-aod'].maps[0].max).toEqual(1);
    expect(response.palettes['terra-aod'].maps[0].squash).toEqual(true);
    expect(response.palettes['terra-aod'].lookup).toEqual(
      config.palettes.lookups['terra-aod']['max-1-squashed'],
    );
  });
  test(`test ${setCustomPalette} action with red-1 fixture palette [palettes-actions-set-custom]`, () => {
    const expectedLegendColors = config.palettes.custom['red-1'].colors;
    const store = mockStore(stateWithLayers);
    store.dispatch(setCustomPalette('terra-aod', 'red-1', 0, 'active'));
    const response = store.getActions()[0];

    expect(response.type).toEqual(SET_CUSTOM);
    expect(response.paletteId).toEqual('red-1');
    expect(response.groupName).toEqual('active');
    expect(response.layerId).toEqual('terra-aod');
    expect(response.activeString).toEqual('active');
    expect(response.palettes['terra-aod'].maps[0].legend.colors).toEqual(
      expectedLegendColors,
    );
    expect(response.palettes['terra-aod'].maps[0].custom).toEqual('red-1');
    expect(response.palettes['terra-aod'].lookup).toEqual(
      config.palettes.lookups['terra-aod']['red-1'],
    );
  });
  test(`test ${clearCustomPalette} action when no threshold applied [palettes-actions-clear-custom]`, () => {
    let terraAOD = assign({}, config.palettes.rendered['terra-aod']);
    terraAOD = update(terraAOD, {
      lookup: { $set: config.palettes.lookups['terra-aod']['red-1'] },
    });
    terraAOD = update(terraAOD, {
      maps: {
        0: {
          custom: {
            $set: 'red-1',
          },
        },
      },
    });
    terraAOD = update(terraAOD, {
      maps: {
        0: {
          legend: {
            colors: { $set: config.palettes.custom['red-1'].colors },
          },
        },
      },
    });
    const previousPaletteObject = cloneDeep(terraAOD);

    const customPalatteState = update(stateWithLayers, {
      palettes: { active: { $set: { 'terra-aod': terraAOD } } },
    });

    const store = mockStore(customPalatteState);
    store.dispatch(clearCustomPalette('terra-aod', 0, 'active'));
    const response = store.getActions()[0];
    expect(response.type).toEqual(CLEAR_CUSTOM);
    expect(previousPaletteObject.maps[0].custom).toEqual('red-1');
    expect(response.palettes['terra-aod']).toEqual(undefined);
    expect(response.groupName).toEqual('active');
    expect(response.layerId).toEqual('terra-aod');
    expect(response.activeString).toEqual('active');
  });
  test(
    `test ${clearCustomPalette} action with threshold and squash applied [palettes-actions-clear-custom-threshold]`,
    () => {
      let terraAOD = assign({}, config.palettes.rendered['terra-aod']);
      terraAOD = update(terraAOD, {
        lookup: { $set: config.palettes.lookups['terra-aod']['red-1'] },
      });
      terraAOD = update(terraAOD, {
        maps: {
          0: {
            custom: {
              $set: 'red-1',
            },
          },
        },
      });
      terraAOD = update(terraAOD, {
        maps: {
          0: {
            legend: {
              colors: { $set: config.palettes.custom['red-1'].colors },
            },
          },
        },
      });
      terraAOD = update(terraAOD, {
        maps: {
          0: {
            max: { $set: 1 },
          },
        },
      });
      terraAOD = update(terraAOD, {
        maps: {
          0: {
            squash: { $set: true },
          },
        },
      });
      const previousPaletteObject = cloneDeep(terraAOD);

      const customPalatteState = update(stateWithLayers, {
        palettes: { active: { $set: { 'terra-aod': terraAOD } } },
      });

      const store = mockStore(customPalatteState);
      store.dispatch(clearCustomPalette('terra-aod', 0, 'active'));
      const response = store.getActions()[0];
      expect(response.type).toEqual(CLEAR_CUSTOM);
      expect(previousPaletteObject.lookup).toBeDefined();
      expect(response.groupName).toEqual('active');
      expect(response.layerId).toEqual('terra-aod');
      expect(response.activeString).toEqual('active');

      expect(response.palettes['terra-aod'].maps[0].legend.colors).toEqual([
        '00ff00ff',
        'ff0000ff',
        '00000000',
      ]);
      expect(response.palettes['terra-aod'].maps[0].max).toEqual(1);
      expect(response.palettes['terra-aod'].maps[0].squash).toEqual(true);
      expect(response.palettes['terra-aod'].lookup).toEqual(
        config.palettes.lookups['terra-aod']['max-1-squashed'],
      );
    },
  );
});
