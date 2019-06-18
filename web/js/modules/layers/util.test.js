import {
  serializeLayers,
  layersParse12,
  removeLayer,
  toggleVisibility
} from './util';
import { initialState } from './reducers';
import fixtures from '../../fixtures';
import { assign } from 'lodash';
const config = fixtures.config();
const LAYER_STRING =
  'AMSRE_Brightness_Temp_89H_Night(opacity=0.54,palette=red_2,min=224,225,max=294,295,squash=true)';

test('Layer parser, parses all complex layer attributes correctly', () => {
  const layers = layersParse12(LAYER_STRING, config);
  const layer = layers[0];
  expect(layers.length).toBe(1);
  expect(layer.id).toBe('AMSRE_Brightness_Temp_89H_Night');
  expect(layer.custom[0]).toBe('red_2');
  expect(layer.squash[0]).toBe(true);
  expect(layer.min[0]).toBe(224);
  expect(layer.max[0]).toBe(294);
  expect(layer.opacity).toBe(0.54);
});

test('serialize layers and palettes', () => {
  let terraAodLayer = config.layers['terra-aod'];
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
  let terraCrLayer = config.layers['terra-cr'];
  terraCrLayer.visible = false;
  const layers = [config.layers['terra-aod'], terraCrLayer];
  const newLayers = toggleVisibility('terra-cr', layers);
  expect(newLayers[1].visible).toBe(true);
});
