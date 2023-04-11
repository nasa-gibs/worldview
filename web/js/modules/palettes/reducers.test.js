import update from 'immutability-helper';
import { getInitialPaletteState, paletteReducer } from './reducers';
import fixtures from '../../fixtures';
import {
  SET_THRESHOLD_RANGE_AND_SQUASH,
  CLEAR_CUSTOM,
  SET_CUSTOM,
  REQUEST_PALETTE_START,
  BULK_PALETTE_RENDERING_SUCCESS,
  REQUEST_PALETTE_SUCCESS,
} from './constants';
import { INIT_SECOND_LAYER_GROUP } from '../layers/constants';

const config = fixtures.config();

test('SET_THRESHOLD_RANGE_AND_SQUASH action updates active palette Object [palettes-reducer-threshold]', () => {
  const initialPaletteState = getInitialPaletteState(config);
  const response = paletteReducer(initialPaletteState, {
    type: SET_THRESHOLD_RANGE_AND_SQUASH,
    layerId: 'terra-aod',
    groupName: 'active',
    palettes: { 'terra-aod': config.palettes.rendered['terra-aod'] },
  });
  expect(initialPaletteState.active['terra-aod']).toEqual(undefined);
  expect(response.active['terra-aod']).toBeDefined();
});

test('CLEAR_CUSTOM action updates active palette Object [palettes-reducer-clear-custom]', () => {
  const initialPaletteState = getInitialPaletteState(config);
  const response = paletteReducer(initialPaletteState, {
    type: CLEAR_CUSTOM,
    layerId: 'terra-aod',
    groupName: 'active',
    palettes: { 'terra-aod': config.palettes.rendered['terra-aod'] },
  });
  expect(initialPaletteState.active['terra-aod']).toEqual(undefined);
  expect(response.active['terra-aod']).toBeDefined();
});
test('SET_CUSTOM action updates active palette Object [palettes-reducer-set-custom]', () => {
  const initialPaletteState = getInitialPaletteState(config);
  const response = paletteReducer(initialPaletteState, {
    type: SET_CUSTOM,
    layerId: 'terra-aod',
    groupName: 'active',
    palettes: { 'terra-aod': config.palettes.rendered['terra-aod'] },
  });
  expect(initialPaletteState.active['terra-aod']).toEqual(undefined);
  expect(response.active['terra-aod']).toBeDefined();
});
test('INIT_SECOND_LAYER_GROUP action updates active palette Object [palettes-reducer-second-layer-group]', () => {
  const initialPaletteState = getInitialPaletteState(config);
  const previousState = update(initialPaletteState, {
    active: { $set: { test: 'tests' } },
  });
  const response = paletteReducer(previousState, {
    type: INIT_SECOND_LAYER_GROUP,
    layerId: 'terra-aod',
    groupName: 'active',
    palettes: { 'terra-aod': config.palettes.rendered['terra-aod'] },
  });
  expect(previousState.activeB.test).toBeUndefined();
  expect(response.activeB.test).toEqual('tests');
});
test('REQUEST_PALETTE_START action updates active palette Object [palettes-reducer-request-palette]', () => {
  const initialPaletteState = getInitialPaletteState(config);
  const response = paletteReducer(initialPaletteState, {
    type: REQUEST_PALETTE_START,
    id: 'test',
  });
  expect(initialPaletteState.isLoading.test).toBeUndefined();
  expect(response.isLoading.test).toBeTruthy();
});
test('REQUEST_PALETTE_SUCCESS action updates active palette Object [palettes-reducer-success]', () => {
  const initialPaletteState = getInitialPaletteState(config);
  const response = paletteReducer(initialPaletteState, {
    type: REQUEST_PALETTE_SUCCESS,
    id: 'test',
    response: 'test-response',
  });
  expect(initialPaletteState.rendered.test).toBeUndefined();
  expect(response.rendered.test).toEqual('test-response');
});

test('BULK_PALETTE_RENDERING_SUCCESS action merges rendered palettes with new palettes from action [palettes-reducer-bulk-render]', () => {
  const initialPaletteState = getInitialPaletteState(config);
  const updatedState = update(initialPaletteState, {
    rendered: { $set: { 'test-1': 'test-1' } },
  });
  const response = paletteReducer(updatedState, {
    type: BULK_PALETTE_RENDERING_SUCCESS,
    id: 'test-2',
    rendered: { 'test-2': 'test-2' },
  });
  expect(updatedState.rendered['test-2']).toBeUndefined();
  expect(updatedState.rendered['test-1']).toEqual('test-1');
  expect(response.rendered['test-2']).toEqual('test-2');
  expect(response.rendered['test-1']).toEqual('test-1');
});
