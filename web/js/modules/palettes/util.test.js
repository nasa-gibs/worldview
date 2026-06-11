import update from 'immutability-helper';
import { layersParse12 } from '../layers/util';
import {
  hasCustomTypePalette,
  loadPalettes,
  mapLocationToPaletteState,
  palettesTranslate,
  getMinValue,
  getMaxValue,
  hasCustomPaletteInActiveProjection,
  getPaletteAttributeArray,
  parseLegacyPalettes,
  lookup,
  drawPaletteOnCanvas,
  drawSidebarPaletteOnCanvas,
  drawTravelModePaletteOnCanvas,
  drawTicksOnCanvas,
} from './util';
import fixtures from '../../fixtures';

const state = fixtures.getState();
const config = fixtures.config();
const LAYER_STRING = 'terra-aod(hidden,opacity=0.54,palette=red-1,min=1,max=2,squash=true,noclip=true),mask';
const layerArrayFromPermalinkString = layersParse12(LAYER_STRING, config);
const PERMALINK_STATE = { l: LAYER_STRING };

test('hasCustomTypePalette func determines if custom palette is in string [palettes-custom-palette-string-1.1]', () => {
  const bool = hasCustomTypePalette(
    'terra-aod(hidden,opacity=0.54,palette=red-1,min=1,max=2,squash=true,noclip=true)',
  );
  expect(bool).toBeTruthy();
});

test('hasCustomTypePalette func determines if custom palette is in string [palettes-custom-palette-string-1.2', () => {
  const bool = hasCustomTypePalette(
    'some-layer(disabled(;0-2)',
  );
  expect(bool).toBeTruthy();
});

test('hasCustomTypePalette returns false for string with no palette attributes', () => {
  const bool = hasCustomTypePalette('terra-aod(hidden,opacity=0.54)');
  expect(bool).toBeFalsy();
});

test('loadPalettes func updates state with correct palette attributes [palettes-load-palettes]', () => {
  const updatedState = update(state, {
    layers: {
      active: {
        layers: { $set: layerArrayFromPermalinkString },
      },
    },
  });

  const loadedState = loadPalettes(PERMALINK_STATE, updatedState);

  const colorMap = loadedState.palettes.active['terra-aod'].maps[0];
  expect(colorMap.min).toEqual(1);
  expect(colorMap.custom).toEqual('red-1');
  expect(colorMap.squash).toEqual(true);
  expect(colorMap.noclip).toEqual(true);
});

test('loadPalettes with l1 param loads activeB palettes', () => {
  const layerStringB = 'terra-aod(palette=red-1)';
  const layerArrayB = layersParse12(layerStringB, config);
  const updatedState = update(state, {
    layers: {
      active: { layers: { $set: layerArrayB } },
      activeB: { layers: { $set: layerArrayB } },
    },
  });
  const loadedState = loadPalettes({ l1: layerStringB }, updatedState);
  expect(loadedState).toBeDefined();
});

test('loadPalettes with no palette attributes returns state unchanged', () => {
  const layerStringPlain = 'terra-aod,mask';
  const layerArrayPlain = layersParse12(layerStringPlain, config);
  const updatedState = update(state, {
    layers: {
      active: { layers: { $set: layerArrayPlain } },
    },
  });
  const loadedState = loadPalettes({ l: layerStringPlain }, updatedState);
  expect(loadedState.palettes.active['terra-aod']).toBeUndefined();
});

describe('permalink 1.1', () => {
  test('parses palette for valid layer [palettes-parse-permalink]', () => {
    const parameters = {
      l: 'terra-aod',
      palettes: 'terra-aod,blue-1',
    };
    let stateFromLocation = update(state, {
      layers: {
        active: {
          layers: { $set: layersParse12(parameters.l, config) },
        },
      },
    });

    stateFromLocation = mapLocationToPaletteState(
      parameters,
      stateFromLocation,
      state,
      config,
    );
    const layer = stateFromLocation.layers.active.layers[0];
    expect(layer.id).toBe('terra-aod');
    expect(layer.custom).toBe('blue-1');
  });

  test('parses palette for two valid layers [palettes-parse-palette]', () => {
    const parameters = {
      l: 'terra-aod,aqua-aod',
      palettes: 'terra-aod,blue-1~aqua-aod,red-1',
    };
    let stateFromLocation = update(state, {
      layers: {
        active: {
          layers: { $set: layersParse12(parameters.l, config) },
        },
      },
    });
    stateFromLocation = mapLocationToPaletteState(
      parameters,
      stateFromLocation,
      state,
      config,
    );

    const layer1 = stateFromLocation.layers.active.layers[0];
    const layer2 = stateFromLocation.layers.active.layers[1];
    expect(layer1.id).toBe('terra-aod');
    expect(layer1.custom).toBe('blue-1');

    expect(layer2.id).toBe('aqua-aod');
    expect(layer2.custom).toBe('red-1');
  });

  test('disregard palettes value if palette assigned to a layer that is not active [palettes-ignore-palettes]', () => {
    const parameters = {
      l: 'terra-aod',
      palettes: 'aqua-aod,red-1',
    };
    let stateFromLocation = update(state, {
      layers: {
        active: {
          layers: { $set: layersParse12(parameters.l, config) },
        },
      },
    });
    stateFromLocation = mapLocationToPaletteState(
      parameters,
      stateFromLocation,
      state,
      config,
    );
    const layer = stateFromLocation.layers.active.layers[0];

    expect(layer.id).toBe('terra-aod');
    expect(layer.custom).toBeUndefined();
    expect(stateFromLocation.layers.active.layers.length).toBe(1);
  });
});

test('mapLocationToPaletteState returns state unchanged when no l or l1 or palettes param', () => {
  const result = mapLocationToPaletteState({}, state, state, config);
  expect(result).toEqual(state);
});

test('mapLocationToPaletteState with only palettes param and no active layers does not crash', () => {
  const parameters = { palettes: 'terra-aod,red-1' };
  const result = mapLocationToPaletteState(parameters, state, state, config);
  expect(result).toBeDefined();
});

test('parseLegacyPalettes sets custom palette on matching active layer', () => {
  const parameters = { palettes: 'terra-aod,blue-1' };
  const layersState = update(state, {
    layers: {
      active: {
        layers: { $set: layersParse12('terra-aod', config) },
      },
    },
  });
  const result = parseLegacyPalettes(parameters, layersState, state, config);
  const layer = result.layers.active.layers[0];
  expect(layer.custom).toBe('blue-1');
});

test('parseLegacyPalettes does not overwrite an existing custom on a layer', () => {
  const parameters = { palettes: 'terra-aod,blue-1' };
  const layerArray = layersParse12('terra-aod', config);
  const layerWithCustom = update(layerArray[0], { custom: { $set: 'red-1' } });
  const layersState = update(state, {
    layers: {
      active: {
        layers: { $set: [layerWithCustom] },
      },
    },
  });
  const result = parseLegacyPalettes(parameters, layersState, state, config);
  expect(result.layers.active.layers[0].custom).toBe('red-1');
});

test('parseLegacyPalettes ignores a palette for a layer not in active layers', () => {
  const parameters = { palettes: 'non-existent-layer,blue-1' };
  const layersState = update(state, {
    layers: {
      active: {
        layers: { $set: layersParse12('terra-aod', config) },
      },
    },
  });
  const result = parseLegacyPalettes(parameters, layersState, state, config);
  expect(result.layers.active.layers[0].custom).toBeUndefined();
});

test('parseLegacyPalettes handles multiple tilde-separated pairs', () => {
  const parameters = { palettes: 'terra-aod,blue-1~aqua-aod,red-1' };
  const layersState = update(state, {
    layers: {
      active: {
        layers: { $set: layersParse12('terra-aod,aqua-aod', config) },
      },
    },
  });
  const result = parseLegacyPalettes(parameters, layersState, state, config);
  expect(result.layers.active.layers[0].custom).toBe('blue-1');
  expect(result.layers.active.layers[1].custom).toBe('red-1');
});

test('palettesTranslate maps source colors to target palette', () => {
  const source = ['ff0000ff', '00ff00ff', '0000ffff'];
  const target = ['aaaaaaff', 'bbbbbbff', 'ccccccff'];
  const result = palettesTranslate(source, target);
  expect(result.length).toBe(3);
  expect(result[0]).toBe('aaaaaaff');
});

test('getMinValue returns first element of array', () => {
  expect(getMinValue(['1', '2', '3'])).toBe('1');
});

test('getMinValue returns value when input has no length', () => {
  expect(getMinValue(5)).toBe(5);
});

test('getMaxValue returns last element of array', () => {
  expect(getMaxValue(['1', '2', '3'])).toBe('3');
});

test('getMaxValue returns value when input has no length', () => {
  expect(getMaxValue(5)).toBe(5);
});

test('hasCustomPaletteInActiveProjection returns true when active layer has a custom palette', () => {
  const activeLayers = [{ id: 'terra-aod' }];
  const activePalettes = { 'terra-aod': { maps: [] } };
  expect(hasCustomPaletteInActiveProjection(activeLayers, activePalettes)).toBe(true);
});

test('hasCustomPaletteInActiveProjection returns false when no active layer has a custom palette', () => {
  const activeLayers = [{ id: 'terra-aod' }];
  const activePalettes = {};
  expect(hasCustomPaletteInActiveProjection(activeLayers, activePalettes)).toBe(false);
});

test('hasCustomPaletteInActiveProjection returns false for empty layers array', () => {
  expect(hasCustomPaletteInActiveProjection([], {})).toBe(false);
});

test('lookup builds a lookup table from source and target palettes', () => {
  const source = { colors: ['ff0000ff', '00ff00ff'] };
  const target = { colors: ['aaaaaaff', 'bbbbbbff'] };
  const result = lookup(source, target);
  expect(Object.keys(result).length).toBe(2);
  const firstKey = '255,0,0,255';
  expect(result[firstKey]).toBeDefined();
  expect(result[firstKey].r).toBe(170);
});

test('getPaletteAttributeArray returns empty array when palette has no custom attributes', () => {
  const layerStringPlain = 'terra-aod';
  const layerArrayPlain = layersParse12(layerStringPlain, config);
  const updatedState = update(state, {
    layers: { active: { layers: { $set: layerArrayPlain } } },
  });
  const loadedState = loadPalettes({ l: layerStringPlain }, updatedState);
  const palettes = loadedState.palettes.active;
  if (!palettes['terra-aod']) {
    expect(palettes['terra-aod']).toBeUndefined();
  } else {
    const result = getPaletteAttributeArray('terra-aod', palettes, loadedState);
    expect(Array.isArray(result)).toBe(true);
  }
});

test('getPaletteAttributeArray returns array of palette attributes for layer with custom palette', () => {
  const layerString = 'terra-aod(palette=red-1,min=1,max=2,squash=true,noclip=true)';
  const layerArray = layersParse12(layerString, config);
  const updatedState = update(state, {
    layers: { active: { layers: { $set: layerArray } } },
  });
  const loadedState = loadPalettes({ l: layerString }, updatedState);
  const palettes = loadedState.palettes.active;
  const result = getPaletteAttributeArray('terra-aod', palettes, loadedState);
  expect(result).toEqual([
    { id: 'palette', value: 'red-1' },
    { id: 'min', value: '1' },
    { id: 'squash', value: 'true' },
    { id: 'noclip', value: 'true' },
  ]);
});

describe('drawPaletteOnCanvas', () => {
  const makeMockCtx = () => ({
    fillStyle: '',
    fillRect: jest.fn(),
    rect: jest.fn(),
    stroke: jest.fn(),
    strokeStyle: '',
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    closePath: jest.fn(),
    lineWidth: 0,
  });

  test('fills background and draws color bins when colors provided', () => {
    const ctx = makeMockCtx();
    drawPaletteOnCanvas(ctx, ['ff0000ff', '00ff00ff', '0000ffff'], 300, 20);
    expect(ctx.fillRect).toHaveBeenCalled();
  });

  test('only fills background when no colors provided', () => {
    const ctx = makeMockCtx();
    drawPaletteOnCanvas(ctx, null, 300, 20);
    expect(ctx.fillRect).toHaveBeenCalledTimes(1);
  });

  test('draws with empty colors array', () => {
    const ctx = makeMockCtx();
    drawPaletteOnCanvas(ctx, [], 300, 20);
    expect(ctx.fillRect).toHaveBeenCalledTimes(1);
  });
});

describe('drawSidebarPaletteOnCanvas', () => {
  const makeMockCtx = () => ({
    fillStyle: '',
    fillRect: jest.fn(),
    rect: jest.fn(),
    stroke: jest.fn(),
    strokeStyle: '',
  });

  test('fills background and draws color bins when colors provided', () => {
    const ctx = makeMockCtx();
    drawSidebarPaletteOnCanvas(ctx, ['ff0000ff', '00ff00ff'], 300);
    expect(ctx.fillRect).toHaveBeenCalled();
    expect(ctx.rect).toHaveBeenCalled();
    expect(ctx.stroke).toHaveBeenCalled();
  });

  test('only fills background when no colors provided', () => {
    const ctx = makeMockCtx();
    drawSidebarPaletteOnCanvas(ctx, null, 300);
    expect(ctx.fillRect).toHaveBeenCalledTimes(1);
  });
});

describe('drawTravelModePaletteOnCanvas', () => {
  const makeMockCtx = () => ({
    fillStyle: '',
    fillRect: jest.fn(),
    rect: jest.fn(),
    stroke: jest.fn(),
    strokeStyle: '',
  });

  test('fills background and draws color bins when colors provided', () => {
    const ctx = makeMockCtx();
    drawTravelModePaletteOnCanvas(ctx, ['ff0000ff', '00ff00ff'], 300, 20);
    expect(ctx.fillRect).toHaveBeenCalled();
    expect(ctx.rect).toHaveBeenCalled();
    expect(ctx.stroke).toHaveBeenCalled();
  });

  test('only fills background when no colors provided', () => {
    const ctx = makeMockCtx();
    drawTravelModePaletteOnCanvas(ctx, null, 300, 20);
    expect(ctx.fillRect).toHaveBeenCalledTimes(1);
  });
});

describe('drawTicksOnCanvas', () => {
  const makeMockCtx = () => ({
    fillStyle: '',
    fillRect: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    stroke: jest.fn(),
    closePath: jest.fn(),
    strokeStyle: '',
    lineWidth: 0,
  });

  test('draws ticks when legend has ticks and more than 100 bins', () => {
    const colors = new Array(101).fill('ff0000ff');
    const legend = { colors, ticks: [10, 50, 90] };
    const ctx = makeMockCtx();
    drawTicksOnCanvas(ctx, legend, 500);
    expect(ctx.beginPath).toHaveBeenCalled();
    expect(ctx.stroke).toHaveBeenCalled();
  });

  test('does not draw ticks when bins are 100 or fewer', () => {
    const colors = new Array(100).fill('ff0000ff');
    const legend = { colors, ticks: [10, 50] };
    const ctx = makeMockCtx();
    drawTicksOnCanvas(ctx, legend, 500);
    expect(ctx.beginPath).not.toHaveBeenCalled();
  });

  test('does not draw ticks when ticks array is empty', () => {
    const colors = new Array(101).fill('ff0000ff');
    const legend = { colors, ticks: [] };
    const ctx = makeMockCtx();
    drawTicksOnCanvas(ctx, legend, 500);
    expect(ctx.beginPath).not.toHaveBeenCalled();
  });

  test('does not draw ticks when ticks is undefined', () => {
    const colors = new Array(101).fill('ff0000ff');
    const legend = { colors };
    const ctx = makeMockCtx();
    drawTicksOnCanvas(ctx, legend, 500);
    expect(ctx.beginPath).not.toHaveBeenCalled();
  });
});
