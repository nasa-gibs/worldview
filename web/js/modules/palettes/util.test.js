import update from 'immutability-helper';
import { layersParse12 } from '../layers/util';
import { hasCustomTypePalette, loadPalettes } from './util';
import util from '../../util/util';
import fixtures from '../../fixtures';
const state = fixtures.getState();
const config = fixtures.config();
const LAYER_STRING =
  'terra-aod(hidden,opacity=0.54,palette=red-1,min=1,max=2,squash=true),mask';
const layerArrayFromPermalinkString = layersParse12(LAYER_STRING, config);
const PERMALINK_STATE = { l: LAYER_STRING };

test('hasCustomTypePalette func determines if custom palette is in string', () => {
  const bool = hasCustomTypePalette(
    'terra-aod(hidden,opacity=0.54,palette=red-1,min=1,max=2,squash=true)'
  );
  expect(bool).toBeTruthy();
});
test('loadPalettes func updates state with correct palette attributes', () => {
  util.browser = jest.fn(() => {
    return {
      webWorkers: true,
      ie: false,
      cors: true
    };
  })();
  const updatedState = update(state, {
    layers: { active: { $set: layerArrayFromPermalinkString } }
  });

  const loadedState = loadPalettes(PERMALINK_STATE, updatedState);

  const colorMap = loadedState.palettes.active['terra-aod'].maps[0];
  expect(colorMap.min).toEqual(1);
  expect(colorMap.custom).toEqual('red-1');
  expect(colorMap.squash).toEqual(true);
});
