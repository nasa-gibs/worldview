import update from 'immutability-helper';
import { layersParse12 } from '../layers/util';
import {
  hasCustomTypePalette,
  loadPalettes,
  mapLocationToPaletteState,
} from './util';
import fixtures from '../../fixtures';

const state = fixtures.getState();
const config = fixtures.config();
const LAYER_STRING = 'terra-aod(hidden,opacity=0.54,palette=red-1,min=1,max=2,squash=true),mask';
const layerArrayFromPermalinkString = layersParse12(LAYER_STRING, config);
const PERMALINK_STATE = { l: LAYER_STRING };

test('hasCustomTypePalette func determines if custom palette is in string [palettes-custom-palette-string-1.1]', () => {
  const bool = hasCustomTypePalette(
    'terra-aod(hidden,opacity=0.54,palette=red-1,min=1,max=2,squash=true)',
  );
  expect(bool).toBeTruthy();
});

test('hasCustomTypePalette func determines if custom palette is in string [palettes-custom-palette-string-1.2', () => {
  const bool = hasCustomTypePalette(
    'some-layer(disabled(;0-2)',
  );
  expect(bool).toBeTruthy();
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
