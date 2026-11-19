import update from 'immutability-helper';
import { getInitialPaletteState, paletteReducer, defaultPaletteState } from './reducers';
import fixtures from '../../fixtures';
import {
  SET_THRESHOLD_RANGE_SQUASH_AND_NOCLIP,
  CLEAR_CUSTOM,
  SET_CUSTOM,
  REQUEST_PALETTE_START,
  BULK_PALETTE_RENDERING_SUCCESS,
  BULK_PALETTE_PRELOADING_SUCCESS,
  REQUEST_PALETTE_SUCCESS,
  LOADED_CUSTOM_PALETTES,
  SET_DISABLED_CLASSIFICATION,
} from './constants';
import { INIT_SECOND_LAYER_GROUP, SYNC_SECOND_LAYER_GROUP } from '../layers/constants';

const config = fixtures.config();

test('SET_THRESHOLD_RANGE_SQUASH_AND_NOCLIP action updates active palette Object [palettes-reducer-threshold]', () => {
  const initialPaletteState = getInitialPaletteState(config);
  const response = paletteReducer(initialPaletteState, {
    type: SET_THRESHOLD_RANGE_SQUASH_AND_NOCLIP,
    layerId: 'terra-aod',
    groupName: 'active',
    palettes: { 'terra-aod': config.palettes.rendered['terra-aod'] },
  });
  expect(initialPaletteState.active['terra-aod']).toEqual(undefined);
  expect(response.active['terra-aod']).toBeDefined();
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

test('BULK_PALETTE_PRELOADING_SUCCESS action merges tourStoryPalettes [palettes-reducer-bulk-preload]', () => {
  const initialPaletteState = getInitialPaletteState(config);
  const response = paletteReducer(initialPaletteState, {
    type: BULK_PALETTE_PRELOADING_SUCCESS,
    tourStoryPalettes: { 'story-1': 'story-1' },
  });
  expect(initialPaletteState.tourStoryPalettes['story-1']).toBeUndefined();
  expect(response.tourStoryPalettes['story-1']).toEqual('story-1');
});

test('BULK_PALETTE_PRELOADING_SUCCESS action merges with existing tourStoryPalettes [palettes-reducer-bulk-preload-merge]', () => {
  const initialPaletteState = getInitialPaletteState(config);
  const stateWithExisting = update(initialPaletteState, {
    tourStoryPalettes: { $set: { 'story-1': 'story-1' } },
  });
  const response = paletteReducer(stateWithExisting, {
    type: BULK_PALETTE_PRELOADING_SUCCESS,
    tourStoryPalettes: { 'story-2': 'story-2' },
  });
  expect(response.tourStoryPalettes['story-1']).toEqual('story-1');
  expect(response.tourStoryPalettes['story-2']).toEqual('story-2');
});

test('BULK_PALETTE_PRELOADING_SUCCESS action with empty tourStoryPalettes [palettes-reducer-bulk-preload-empty]', () => {
  const initialPaletteState = getInitialPaletteState(config);
  const response = paletteReducer(initialPaletteState, {
    type: BULK_PALETTE_PRELOADING_SUCCESS,
  });
  expect(response.tourStoryPalettes).toEqual({});
});

test('BULK_PALETTE_RENDERING_SUCCESS action with empty rendered [palettes-reducer-bulk-render-empty]', () => {
  const initialPaletteState = getInitialPaletteState(config);
  const response = paletteReducer(initialPaletteState, {
    type: BULK_PALETTE_RENDERING_SUCCESS,
  });
  expect(response.rendered).toBeDefined();
});

test('REQUEST_PALETTE_SUCCESS action removes id from isLoading [palettes-reducer-success-loading]', () => {
  const initialPaletteState = getInitialPaletteState(config);
  const stateWithLoading = update(initialPaletteState, {
    isLoading: { $set: { test: true } },
  });
  const response = paletteReducer(stateWithLoading, {
    type: REQUEST_PALETTE_SUCCESS,
    id: 'test',
    response: 'test-response',
  });
  expect(stateWithLoading.isLoading.test).toBeTruthy();
  expect(response.isLoading.test).toBeUndefined();
});

test('INIT_SECOND_LAYER_GROUP action does not overwrite existing activeB [palettes-reducer-second-layer-group-no-overwrite]', () => {
  const initialPaletteState = getInitialPaletteState(config);
  const previousState = update(initialPaletteState, {
    active: { $set: { 'terra-aod': 'active-value' } },
    activeB: { $set: { 'aqua-cr': 'existing-b-value' } },
  });
  const response = paletteReducer(previousState, {
    type: INIT_SECOND_LAYER_GROUP,
  });
  expect(response.activeB['aqua-cr']).toEqual('existing-b-value');
  expect(response.activeB['terra-aod']).toBeUndefined();
});

test('SYNC_SECOND_LAYER_GROUP action merges active into activeB with B taking precedence [palettes-reducer-sync]', () => {
  const initialPaletteState = getInitialPaletteState(config);
  const previousState = update(initialPaletteState, {
    active: { $set: { 'terra-aod': 'from-a', 'shared-layer': 'a-value' } },
    activeB: { $set: { 'aqua-cr': 'from-b', 'shared-layer': 'b-value' } },
  });
  const response = paletteReducer(previousState, {
    type: SYNC_SECOND_LAYER_GROUP,
  });
  expect(response.activeB['terra-aod']).toEqual('from-a');
  expect(response.activeB['aqua-cr']).toEqual('from-b');
  expect(response.activeB['shared-layer']).toEqual('b-value');
});

test('SYNC_SECOND_LAYER_GROUP action deep clones active and activeB [palettes-reducer-sync-clone]', () => {
  const initialPaletteState = getInitialPaletteState(config);
  const previousState = update(initialPaletteState, {
    active: { $set: { 'terra-aod': { nested: 'value' } } },
    activeB: { $set: {} },
  });
  const response = paletteReducer(previousState, {
    type: SYNC_SECOND_LAYER_GROUP,
  });
  expect(response.activeB['terra-aod']).toEqual({ nested: 'value' });
  expect(response.activeB['terra-aod']).not.toBe(previousState.active['terra-aod']);
});

test('SET_DISABLED_CLASSIFICATION action updates active palette Object [palettes-reducer-disabled-classification]', () => {
  const initialPaletteState = getInitialPaletteState(config);
  const response = paletteReducer(initialPaletteState, {
    type: SET_DISABLED_CLASSIFICATION,
    layerId: 'terra-aod',
    groupName: 'active',
    palettes: { 'terra-aod': config.palettes.rendered['terra-aod'] },
  });
  expect(initialPaletteState.active['terra-aod']).toEqual(undefined);
  expect(response.active['terra-aod']).toBeDefined();
});

test('SET_DISABLED_CLASSIFICATION action updates activeB when groupName is activeB [palettes-reducer-disabled-classification-b]', () => {
  const initialPaletteState = getInitialPaletteState(config);
  const response = paletteReducer(initialPaletteState, {
    type: SET_DISABLED_CLASSIFICATION,
    layerId: 'terra-aod',
    groupName: 'activeB',
    palettes: { 'terra-aod': config.palettes.rendered['terra-aod'] },
  });
  expect(initialPaletteState.activeB['terra-aod']).toEqual(undefined);
  expect(response.activeB['terra-aod']).toBeDefined();
});

test('CLEAR_CUSTOM action with no palettes sets empty object [palettes-reducer-clear-custom-empty]', () => {
  const initialPaletteState = getInitialPaletteState(config);
  const response = paletteReducer(initialPaletteState, {
    type: CLEAR_CUSTOM,
    groupName: 'active',
  });
  expect(response.active).toEqual({});
});

test('SET_CUSTOM action updates activeB when groupName is activeB [palettes-reducer-set-custom-b]', () => {
  const initialPaletteState = getInitialPaletteState(config);
  const response = paletteReducer(initialPaletteState, {
    type: SET_CUSTOM,
    layerId: 'terra-aod',
    groupName: 'activeB',
    palettes: { 'terra-aod': config.palettes.rendered['terra-aod'] },
  });
  expect(initialPaletteState.activeB['terra-aod']).toEqual(undefined);
  expect(response.activeB['terra-aod']).toBeDefined();
});

test('LOADED_CUSTOM_PALETTES action updates custom palettes [palettes-reducer-loaded-custom]', () => {
  const initialPaletteState = getInitialPaletteState(config);
  const newCustom = { 'my-custom': { colors: ['ff0000ff'] } };
  const response = paletteReducer(initialPaletteState, {
    type: LOADED_CUSTOM_PALETTES,
    custom: newCustom,
  });
  expect(response.custom['my-custom']).toEqual({ colors: ['ff0000ff'] });
});

test('LOADED_CUSTOM_PALETTES action with no custom sets empty object [palettes-reducer-loaded-custom-empty]', () => {
  const initialPaletteState = getInitialPaletteState(config);
  const stateWithCustom = update(initialPaletteState, {
    custom: { $set: { 'red-1': config.palettes.custom['red-1'] } },
  });
  const response = paletteReducer(stateWithCustom, {
    type: LOADED_CUSTOM_PALETTES,
  });
  expect(response.custom).toEqual({});
});

test('default case returns existing state unchanged [palettes-reducer-default]', () => {
  const initialPaletteState = getInitialPaletteState(config);
  const response = paletteReducer(initialPaletteState, {
    type: 'UNKNOWN_ACTION_TYPE',
  });
  expect(response).toBe(initialPaletteState);
});

test('paletteReducer uses defaultPaletteState when no state is provided [palettes-reducer-default-state]', () => {
  const response = paletteReducer(undefined, { type: 'UNKNOWN_ACTION_TYPE' });
  expect(response).toEqual(defaultPaletteState);
});

test('getInitialPaletteState returns defaultPaletteState shape when config is empty [palettes-reducer-initial-empty]', () => {
  const response = getInitialPaletteState({});
  expect(response.rendered).toEqual({});
  expect(response.custom).toEqual({});
  expect(response.active).toEqual({});
  expect(response.activeB).toEqual({});
  expect(response.isLoading).toEqual({});
  expect(response.tourStoryPalettes).toEqual({});
});

test('getInitialPaletteState populates rendered and custom from config [palettes-reducer-initial-config]', () => {
  const response = getInitialPaletteState(config);
  expect(response.rendered).toEqual(config.palettes.rendered);
  expect(response.custom).toEqual(config.palettes.custom);
});

test('groupName defaults to active when not provided in action [palettes-reducer-groupname-default]', () => {
  const initialPaletteState = getInitialPaletteState(config);
  const response = paletteReducer(initialPaletteState, {
    type: SET_CUSTOM,
    layerId: 'terra-aod',
    palettes: { 'terra-aod': config.palettes.rendered['terra-aod'] },
  });
  expect(response.active['terra-aod']).toBeDefined();
  expect(response.activeB['terra-aod']).toBeUndefined();
});

test('SET_THRESHOLD_RANGE_SQUASH_AND_NOCLIP action updates activeB when groupName is activeB [palettes-reducer-threshold-b]', () => {
  const initialPaletteState = getInitialPaletteState(config);
  const response = paletteReducer(initialPaletteState, {
    type: SET_THRESHOLD_RANGE_SQUASH_AND_NOCLIP,
    layerId: 'terra-aod',
    groupName: 'activeB',
    palettes: { 'terra-aod': config.palettes.rendered['terra-aod'] },
  });
  expect(initialPaletteState.activeB['terra-aod']).toEqual(undefined);
  expect(response.activeB['terra-aod']).toBeDefined();
});
