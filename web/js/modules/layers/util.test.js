import {
  serializeLayers,
  layersParse12,
  removeLayer,
  toggleVisibility,
  mapLocationToLayerState
} from './util';
import { initialState } from './reducers';
import fixtures from '../../fixtures';
import { assign } from 'lodash';
let defaultStateFromLocation = {
  layers: {
    active: []
  }
};
const globalState = fixtures.getState();
const config = fixtures.config();
const PALETTE_LAYER_STRING =
  'AMSRE_Brightness_Temp_89H_Night(hidden,opacity=0.54,palette=red_2,min=224,225,max=294,295,squash=true),mask';
const VECTOR_LAYER_STRING =
  'OrbitTracks_Aqua_Ascending(hidden,opacity=0.46,style=yellow1),mask';

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
      custom: config.palettes.custom
    },
    config
  };
  const state = assign({}, paletteState, { layers: initialState });
  terraAodLayer.custom = ['red'];
  terraAodLayer.opacity = [0.54];
  const layerStr = serializeLayers([terraAodLayer], state, 'active')[0];
  expect(layerStr).toBe('terra-aod(hidden,opacity=0.54)');
});

test('removeLayer util function', () => {
  const layers = [config.layers['terra-cr'], config.layers['terra-aod']];
  const newLayers = removeLayer('terra-cr', layers);
  expect(newLayers.length).toBe(1);
  expect(newLayers[0].id).toBe('terra-aod');
});

test('toggleVisibility util function', () => {
  const terraCrLayer = config.layers['terra-cr'];
  terraCrLayer.visible = false;
  const layers = [config.layers['terra-aod'], terraCrLayer];
  const newLayers = toggleVisibility('terra-cr', layers);
  expect(newLayers[1].visible).toBe(true);
});
describe('permalink 1.0', () => {
  beforeEach(() => {
    defaultStateFromLocation = {
      layers: {
        active: []
      }
    };
  });
  test('supports old style period delimiters', () => {
    const parameters = {
      products: 'baselayers.terra-cr~overlays.terra-aod.aqua-aod'
    };
    const stateFromLocation = mapLocationToLayerState(
      parameters,
      defaultStateFromLocation,
      globalState,
      config
    );
    const activeLayers = stateFromLocation.layers.active;

    expect(activeLayers.find(x => x.id === 'terra-cr')).toBeTruthy();
    expect(activeLayers.find(x => x.id === 'terra-aod')).toBeTruthy();
    expect(activeLayers.find(x => x.id === 'aqua-aod')).toBeTruthy();
  });
});

describe('permalink 1.1', () => {
  beforeEach(() => {
    defaultStateFromLocation = {
      layers: {
        active: []
      }
    };
  });

  test('parses only one baselayer', () => {
    const parameters = {
      products: 'baselayers,terra-cr'
    };

    const stateFromLocation = mapLocationToLayerState(
      parameters,
      defaultStateFromLocation,
      globalState,
      config
    );
    expect(stateFromLocation.layers.active[0].id).toBe('terra-cr');
  });
  test('parses only one overlay', () => {
    const parameters = {
      products: 'overlays,terra-aod'
    };
    const stateFromLocation = mapLocationToLayerState(
      parameters,
      defaultStateFromLocation,
      globalState,
      config
    );

    expect(stateFromLocation.layers.active[0].id).toBe('terra-aod');
  });
  test('parses multiple layers', () => {
    const parameters = {
      products: 'baselayers,terra-cr~overlays,terra-aod,aqua-aod'
    };
    const stateFromLocation = mapLocationToLayerState(
      parameters,
      defaultStateFromLocation,
      globalState,
      config
    );
    const activeLayers = stateFromLocation.layers.active;
    expect(activeLayers.find(x => x.id === 'terra-cr')).toBeTruthy();
    expect(activeLayers.find(x => x.id === 'terra-aod')).toBeTruthy();
    expect(activeLayers.find(x => x.id === 'aqua-aod')).toBeTruthy();
  });
  test('empty layer list', () => {
    const parameters = {
      products: 'baselayers~overlays'
    };
    const stateFromLocation = mapLocationToLayerState(
      parameters,
      defaultStateFromLocation,
      globalState,
      config
    );
    const activeLayers = stateFromLocation.layers.active;
    expect(activeLayers).toHaveLength(0);
  });
  test('skips invalid layers and records an error', () => {
    const parameters = {
      products: 'baselayers,terra-cr~overlays,layerx,aqua-aod'
    };
    const stateFromLocation = mapLocationToLayerState(
      parameters,
      defaultStateFromLocation,
      globalState,
      config
    );
    const activeLayers = stateFromLocation.layers.active;
    expect(activeLayers.find(x => x.id === 'terra-cr')).toBeTruthy();
    expect(activeLayers.find(x => x.id === 'aqua-aod')).toBeTruthy();
  });
  test('no layers if no groups found', () => {
    const parameters = {
      products: 'layerx,layery'
    };
    const stateFromLocation = mapLocationToLayerState(
      parameters,
      defaultStateFromLocation,
      globalState,
      config
    );
    const activeLayers = stateFromLocation.layers.active;
    expect(activeLayers).toHaveLength(0);
  });
  test('hidden layers', () => {
    const parameters = {
      products: 'baselayers,!terra-cr'
    };
    const stateFromLocation = mapLocationToLayerState(
      parameters,
      defaultStateFromLocation,
      globalState,
      config
    );
    const activeLayers = stateFromLocation.layers.active;
    expect(activeLayers[0].id).toBe('terra-cr');
    expect(activeLayers[0].visible).toBeFalsy();
  });
});
