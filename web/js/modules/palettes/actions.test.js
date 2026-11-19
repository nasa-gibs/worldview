import { TextEncoder, TextDecoder } from 'util';
import configureMockStore from 'redux-mock-store';
import { thunk } from 'redux-thunk';
import { assign, cloneDeep } from 'lodash';
import update from 'immutability-helper';
import {
  requestPalette,
  setThresholdRangeSquashAndNoClip,
  setCustomPalette,
  clearCustomPalette,
  loadedCustomPalettes,
  clearCustoms,
  clearCustomsSnapshot,
  refreshPalettes,
  refreshDisabledClassification,
  setToggledClassification,
} from './actions';
import { addLayer } from '../layers/selectors';
import {
  REQUEST_PALETTE_START,
  REQUEST_PALETTE_SUCCESS,
  REQUEST_PALETTE_FAILURE,
  SET_THRESHOLD_RANGE_SQUASH_AND_NOCLIP,
  SET_CUSTOM,
  CLEAR_CUSTOM,
  SET_DISABLED_CLASSIFICATION,
  LOADED_CUSTOM_PALETTES,
} from './constants';
import fixtures from '../../fixtures';

// jsdom polyfills
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

const middlewares = [thunk];

const state = fixtures.getState();
const config = fixtures.config();
const ERROR_MESSAGE = 'There was an error';

describe('requestPalette action [palettes-actions-request]', () => {
  const mockStore = configureMockStore(middlewares);
  let layers = addLayer('terra-aod', [], config.layers, {}, 0);
  layers = addLayer('aqua-cr', layers, config.layers, {}, 1);
  const stateWithLayers = update(state, {
    layers: { active: { $set: layers } },
  });

  beforeEach(() => {
    fetch.resetMocks();
  });

  test(`test ${requestPalette} action success [palettes-actions-request-success]`, async () => {
    fetch.mockResponse(JSON.stringify({}));
    const store = mockStore(stateWithLayers);
    await store.dispatch(requestPalette('terra-aod'));
    const actions = store.getActions();
    const types = actions.map((a) => a.type);
    expect(types).toContain(REQUEST_PALETTE_START);
    expect(types).toContain(REQUEST_PALETTE_SUCCESS);
  });

  test(`test ${requestPalette} action failure [palettes-actions-request-failure]`, async () => {
    fetch.mockReject(new Error(ERROR_MESSAGE));
    const store = mockStore(stateWithLayers);
    await store.dispatch(requestPalette('terra-aod'));
    const actions = store.getActions();
    const types = actions.map((a) => a.type);
    expect(types).toContain(REQUEST_PALETTE_START);
    expect(types).toContain(REQUEST_PALETTE_FAILURE);
  });
});

describe('palette threshold/custom/clear actions [palettes-actions-main]', () => {
  const mockStore = configureMockStore(middlewares);
  let layers = addLayer('terra-aod', [], config.layers, {}, 0);
  layers = addLayer('aqua-cr', layers, config.layers, {}, 1);
  const stateWithLayers = update(state, {
    layers: { active: { $set: layers } },
  });

  beforeEach(() => {
    fetch.resetMocks();
  });

  test(`test ${setThresholdRangeSquashAndNoClip} action with min equal to 1`, () => {
    const store = mockStore(stateWithLayers);
    store.dispatch(setThresholdRangeSquashAndNoClip('terra-aod', { min: 1 }, 0, 'active'));
    const response = store.getActions()[0];
    expect(response.type).toEqual(SET_THRESHOLD_RANGE_SQUASH_AND_NOCLIP);
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
    expect(response.palettes['terra-aod'].maps[0].noclip).toEqual(undefined);
    expect(response.palettes['terra-aod'].lookup).toEqual(
      config.palettes.lookups['terra-aod']['min-1'],
    );
  });

  test(`test ${setThresholdRangeSquashAndNoClip} action with squash and max [palettes-actions-threshold-1]`, () => {
    const store = mockStore(stateWithLayers);
    store.dispatch(
      setThresholdRangeSquashAndNoClip('terra-aod', { max: 1, squash: true }, 0, 'active'),
    );
    const response = store.getActions()[0];
    expect(response.type).toEqual(SET_THRESHOLD_RANGE_SQUASH_AND_NOCLIP);
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

  test(`test ${setThresholdRangeSquashAndNoClip} action with noclip and max [palettes-actions-threshold-2]`, () => {
    const store = mockStore(stateWithLayers);
    store.dispatch(
      setThresholdRangeSquashAndNoClip('terra-aod', { max: 1, noclip: true }, 0, 'active'),
    );
    const response = store.getActions()[0];
    expect(response.type).toEqual(SET_THRESHOLD_RANGE_SQUASH_AND_NOCLIP);
    expect(response.props).toEqual({ max: 1, noclip: true });
    expect(response.groupName).toEqual('active');
    expect(response.layerId).toEqual('terra-aod');
    expect(response.activeString).toEqual('active');
    expect(response.palettes['terra-aod'].maps[0].legend.colors).toEqual([
      '00ff00ff',
      'ffff00ff',
      'ff0000ff',
    ]);
    expect(response.palettes['terra-aod'].maps[0].max).toEqual(1);
    expect(response.palettes['terra-aod'].maps[0].noclip).toEqual(true);
    expect(response.palettes['terra-aod'].lookup).toEqual(
      config.palettes.lookups['terra-aod']['max-1-noclipped'],
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
    `test ${clearCustomPalette} action with threshold and squash applied [palettes-actions-clear-custom-threshold-1]`,
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

  test(
    `test ${clearCustomPalette} action with threshold and noclip applied [palettes-actions-clear-custom-threshold-2]`,
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
            noclip: { $set: true },
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
        'ffff00ff',
        'ff0000ff',
      ]);
      expect(response.palettes['terra-aod'].maps[0].max).toEqual(1);
      expect(response.palettes['terra-aod'].maps[0].noclip).toEqual(true);
      expect(response.palettes['terra-aod'].lookup).toEqual(
        config.palettes.lookups['terra-aod']['max-1-noclipped'],
      );
    },
  );
});

describe('loadedCustomPalettes action [palettes-actions-loaded-custom]', () => {
  test('returns correct type and custom payload', () => {
    const customs = { 'red-1': { colors: ['ff0000ff'] } };
    const result = loadedCustomPalettes(customs);
    expect(result.type).toEqual(LOADED_CUSTOM_PALETTES);
    expect(result.custom).toEqual(customs);
  });

  test('returns correct type with empty object', () => {
    const result = loadedCustomPalettes({});
    expect(result.type).toEqual(LOADED_CUSTOM_PALETTES);
    expect(result.custom).toEqual({});
  });
});

describe('setToggledClassification action [palettes-actions-set-toggled-classification]', () => {
  const mockStore = configureMockStore(middlewares);
  let layers = addLayer('terra-aod', [], config.layers, {}, 0);
  layers = addLayer('aqua-cr', layers, config.layers, {}, 1);
  const stateWithLayers = update(state, {
    layers: { active: { $set: layers } },
  });

  test('does not dispatch when layer is not found in active layers', () => {
    const terraAOD = assign({}, config.palettes.rendered['terra-aod']);
    const customState = update(stateWithLayers, {
      palettes: { active: { $set: { 'terra-aod': terraAOD } } },
      layers: { active: { layers: { $set: [] } } },
    });
    const store = mockStore(customState);
    store.dispatch(setToggledClassification('terra-aod', 0, 0, 'active'));
    const actions = store.getActions();
    expect(actions.length).toEqual(0);
  });

  test('dispatches SET_DISABLED_CLASSIFICATION when layer is present in active layers', () => {
    const terraAOD = assign({}, config.palettes.rendered['terra-aod']);
    const layerObj = { id: 'terra-aod', palette: { id: 'terra-aod' } };
    const customState = update(stateWithLayers, {
      palettes: { active: { $set: { 'terra-aod': terraAOD } } },
      layers: { active: { layers: { $set: [layerObj] } } },
    });
    const store = mockStore(customState);
    store.dispatch(setToggledClassification('terra-aod', 0, 0, 'active'));
    const actions = store.getActions();
    expect(actions[0].type).toEqual(SET_DISABLED_CLASSIFICATION);
    expect(actions[0].layerId).toEqual('terra-aod');
    expect(actions[0].groupName).toEqual('active');
    expect(actions[0].activeString).toEqual('active');
    expect(actions[0].props).toBeDefined();
  });
});

describe('refreshDisabledClassification action [palettes-actions-refresh-disabled]', () => {
  const mockStore = configureMockStore(middlewares);
  let layers = addLayer('terra-aod', [], config.layers, {}, 0);
  layers = addLayer('aqua-cr', layers, config.layers, {}, 1);
  const stateWithLayers = update(state, {
    layers: { active: { $set: layers } },
  });

  test('does not dispatch when disabledArray is empty and layerId is not in selector result', () => {
    const store = mockStore(stateWithLayers);
    store.dispatch(refreshDisabledClassification('terra-aod', [], 0, 'active'));
    const actions = store.getActions();
    expect(actions.length).toEqual(0);
  });
});

describe('clearCustoms action [palettes-actions-clear-customs]', () => {
  const mockStore = configureMockStore(middlewares);
  let layers = addLayer('terra-aod', [], config.layers, {}, 0);
  layers = addLayer('aqua-cr', layers, config.layers, {}, 1);
  const stateWithLayers = update(state, {
    layers: { active: { $set: layers } },
  });

  test('dispatches CLEAR_CUSTOM for a layer with a custom palette', () => {
    let terraAOD = assign({}, config.palettes.rendered['terra-aod']);
    terraAOD = update(terraAOD, {
      lookup: { $set: config.palettes.lookups['terra-aod']['red-1'] },
    });
    terraAOD = update(terraAOD, {
      maps: { 0: { custom: { $set: 'red-1' } } },
    });
    const customState = update(stateWithLayers, {
      palettes: { active: { $set: { 'terra-aod': terraAOD } } },
    });
    const store = mockStore(customState);
    store.dispatch(clearCustoms());
    const actions = store.getActions();
    const types = actions.map((a) => a.type);
    expect(types).toContain(CLEAR_CUSTOM);
  });

  test('dispatches SET_THRESHOLD_RANGE_SQUASH_AND_NOCLIP for a layer with max threshold', () => {
    let terraAOD = assign({}, config.palettes.rendered['terra-aod']);
    terraAOD = update(terraAOD, {
      maps: { 0: { max: { $set: 1 } } },
    });
    const customState = update(stateWithLayers, {
      palettes: { active: { $set: { 'terra-aod': terraAOD } } },
    });
    const store = mockStore(customState);
    store.dispatch(clearCustoms());
    const actions = store.getActions();
    const types = actions.map((a) => a.type);
    expect(types).toContain(SET_THRESHOLD_RANGE_SQUASH_AND_NOCLIP);
  });

  test('dispatches SET_DISABLED_CLASSIFICATION for a layer with disabled colormaps when layer is in active layers', () => {
    let terraAOD = assign({}, config.palettes.rendered['terra-aod']);
    terraAOD = update(terraAOD, {
      maps: { 0: { disabled: { $set: [0] } } },
    });
    const layerObj = { id: 'terra-aod', palette: { id: 'terra-aod' } };
    const customState = update(stateWithLayers, {
      palettes: { active: { $set: { 'terra-aod': cloneDeep(terraAOD) } } },
      layers: { active: { layers: { $set: [layerObj] } } },
    });
    const store = mockStore(customState);
    store.dispatch(clearCustoms());
    const actions = store.getActions();
    const types = actions.map((a) => a.type);
    expect(types).toContain(SET_DISABLED_CLASSIFICATION);
  });

  test('does not dispatch SET_DISABLED_CLASSIFICATION when keepDisabledClassification is true', () => {
    let terraAOD = assign({}, config.palettes.rendered['terra-aod']);
    terraAOD = update(terraAOD, {
      maps: { 0: { disabled: { $set: [0] } } },
    });
    const layerObj = { id: 'terra-aod', palette: { id: 'terra-aod' } };
    const customState = update(stateWithLayers, {
      palettes: { active: { $set: { 'terra-aod': cloneDeep(terraAOD) } } },
      layers: { active: { layers: { $set: [layerObj] } } },
    });
    const store = mockStore(customState);
    store.dispatch(clearCustoms(true));
    const actions = store.getActions();
    const types = actions.map((a) => a.type);
    expect(types).not.toContain(SET_DISABLED_CLASSIFICATION);
  });
});

describe('clearCustomsSnapshot action [palettes-actions-clear-customs-snapshot]', () => {
  const mockStore = configureMockStore(middlewares);
  let layers = addLayer('terra-aod', [], config.layers, {}, 0);
  layers = addLayer('aqua-cr', layers, config.layers, {}, 1);
  const stateWithLayers = update(state, {
    layers: { active: { $set: layers } },
  });

  test('does not dispatch SET_DISABLED_CLASSIFICATION for disabled colormaps', () => {
    let terraAOD = assign({}, config.palettes.rendered['terra-aod']);
    terraAOD = update(terraAOD, {
      maps: { 0: { disabled: { $set: [0] } } },
    });
    const layerObj = { id: 'terra-aod', palette: { id: 'terra-aod' } };
    const customState = update(stateWithLayers, {
      palettes: { active: { $set: { 'terra-aod': cloneDeep(terraAOD) } } },
      layers: { active: { layers: { $set: [layerObj] } } },
    });
    const store = mockStore(customState);
    store.dispatch(clearCustomsSnapshot());
    const actions = store.getActions();
    const types = actions.map((a) => a.type);
    expect(types).not.toContain(SET_DISABLED_CLASSIFICATION);
  });

  test('dispatches CLEAR_CUSTOM for a layer with a custom palette', () => {
    let terraAOD = assign({}, config.palettes.rendered['terra-aod']);
    terraAOD = update(terraAOD, {
      lookup: { $set: config.palettes.lookups['terra-aod']['red-1'] },
    });
    terraAOD = update(terraAOD, {
      maps: { 0: { custom: { $set: 'red-1' } } },
    });
    const customState = update(stateWithLayers, {
      palettes: { active: { $set: { 'terra-aod': terraAOD } } },
    });
    const store = mockStore(customState);
    store.dispatch(clearCustomsSnapshot());
    const actions = store.getActions();
    const types = actions.map((a) => a.type);
    expect(types).toContain(CLEAR_CUSTOM);
  });
});

describe('refreshPalettes action [palettes-actions-refresh-palettes]', () => {
  const mockStore = configureMockStore(middlewares);
  let layers = addLayer('terra-aod', [], config.layers, {}, 0);
  layers = addLayer('aqua-cr', layers, config.layers, {}, 1);
  const stateWithLayers = update(state, {
    layers: { active: { $set: layers } },
  });

  test('dispatches SET_CUSTOM for a palette with a custom colormap', () => {
    let terraAOD = assign({}, config.palettes.rendered['terra-aod']);
    terraAOD = update(terraAOD, {
      maps: { 0: { custom: { $set: 'red-1' } } },
    });
    const activePalettes = { 'terra-aod': cloneDeep(terraAOD) };
    const store = mockStore(stateWithLayers);
    store.dispatch(refreshPalettes(activePalettes));
    const actions = store.getActions();
    const types = actions.map((a) => a.type);
    expect(types).toContain(SET_CUSTOM);
  });

  test('dispatches SET_THRESHOLD_RANGE_SQUASH_AND_NOCLIP for palette with max', () => {
    let terraAOD = assign({}, config.palettes.rendered['terra-aod']);
    terraAOD = update(terraAOD, {
      maps: { 0: { max: { $set: 1 } } },
    });
    const activePalettes = { 'terra-aod': cloneDeep(terraAOD) };
    const store = mockStore(stateWithLayers);
    store.dispatch(refreshPalettes(activePalettes));
    const actions = store.getActions();
    const types = actions.map((a) => a.type);
    expect(types).toContain(SET_THRESHOLD_RANGE_SQUASH_AND_NOCLIP);
  });

  test('dispatches SET_THRESHOLD_RANGE_SQUASH_AND_NOCLIP for palette with squash', () => {
    let terraAOD = assign({}, config.palettes.rendered['terra-aod']);
    terraAOD = update(terraAOD, {
      maps: { 0: { squash: { $set: true } } },
    });
    const activePalettes = { 'terra-aod': cloneDeep(terraAOD) };
    const store = mockStore(stateWithLayers);
    store.dispatch(refreshPalettes(activePalettes));
    const actions = store.getActions();
    const types = actions.map((a) => a.type);
    expect(types).toContain(SET_THRESHOLD_RANGE_SQUASH_AND_NOCLIP);
  });

  test('dispatches no actions for a palette with no custom, threshold, or disabled colormaps', () => {
    const terraAOD = assign({}, config.palettes.rendered['terra-aod']);
    const activePalettes = { 'terra-aod': cloneDeep(terraAOD) };
    const store = mockStore(stateWithLayers);
    store.dispatch(refreshPalettes(activePalettes));
    const actions = store.getActions();
    expect(actions.length).toEqual(0);
  });
});
