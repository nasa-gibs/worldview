import { initialCompareState, compareReducer } from './reducers';
import * as CONSTANTS from './constants';

test('CHANGE_STATE update active state and activeString [compare-reducer-change-state]', () => {
  const response = compareReducer(initialCompareState, {
    type: CONSTANTS.CHANGE_STATE,
  });
  expect(initialCompareState.activeString).toEqual('active');
  expect(initialCompareState.isCompareA).toBeTruthy();
  expect(response.activeString).toEqual('activeB');
  expect(response.isCompareA).toBeFalsy();
});

test('CHANGE_STATE toggles back to isCompareA=true and activeString=active [compare-reducer-change-state-back]', () => {
  const stateB = { ...initialCompareState, isCompareA: false, activeString: 'activeB' };
  const response = compareReducer(stateB, { type: CONSTANTS.CHANGE_STATE });
  expect(response.isCompareA).toBeTruthy();
  expect(response.activeString).toEqual('active');
});

test('TOGGLE_ON_OFF toggles compare feature on and off [compare-reducer-toggle]', () => {
  const response = compareReducer(initialCompareState, {
    type: CONSTANTS.TOGGLE_ON_OFF,
  });
  expect(initialCompareState.active).toBeFalsy();
  expect(response.active).toBeTruthy();
});

test('TOGGLE_ON_OFF sets bStatesInitiated to true [compare-reducer-toggle-bstates]', () => {
  const response = compareReducer(initialCompareState, { type: CONSTANTS.TOGGLE_ON_OFF });
  expect(response.bStatesInitiated).toBe(true);
});

test('TOGGLE_ON_OFF when active=true stores lastExitALayerIds from action [compare-reducer-toggle-exit-layers]', () => {
  const activeState = { ...initialCompareState, active: true };
  const layerIds = ['layer1', 'layer2'];
  const response = compareReducer(activeState, {
    type: CONSTANTS.TOGGLE_ON_OFF,
    lastExitALayerIds: layerIds,
  });
  expect(response.active).toBe(false);
  expect(response.lastExitALayerIds).toEqual(layerIds);
});

test('TOGGLE_ON_OFF when active=false does not set lastExitALayerIds [compare-reducer-toggle-no-exit-layers]', () => {
  const response = compareReducer(initialCompareState, {
    type: CONSTANTS.TOGGLE_ON_OFF,
    lastExitALayerIds: ['layer1'],
  });
  expect(response.lastExitALayerIds).toBeUndefined();
});

test('CHANGE_MODE updates mode [compare-reducer-change-mode]', () => {
  const response = compareReducer(initialCompareState, {
    type: CONSTANTS.CHANGE_MODE,
    mode: 'new-mode',
  });
  expect(initialCompareState.mode).toEqual('swipe');
  expect(response.mode).toEqual('new-mode');
});

test('CHANGE_MODE resets value to 50 [compare-reducer-change-mode-resets-value]', () => {
  const stateWithValue = { ...initialCompareState, value: 75 };
  const response = compareReducer(stateWithValue, {
    type: CONSTANTS.CHANGE_MODE,
    mode: 'opacity',
  });
  expect(response.value).toEqual(50);
});

test('CHANGE_VALUE updates value [compare-reducer-change-value]', () => {
  const response = compareReducer(initialCompareState, {
    type: CONSTANTS.CHANGE_VALUE,
    value: 80,
  });
  expect(response.value).toEqual(80);
});

test('CHANGE_VALUE updates value to 0 [compare-reducer-change-value-zero]', () => {
  const response = compareReducer(initialCompareState, {
    type: CONSTANTS.CHANGE_VALUE,
    value: 0,
  });
  expect(response.value).toEqual(0);
});

test('default case returns existing state unchanged [compare-reducer-default]', () => {
  const response = compareReducer(initialCompareState, { type: 'UNKNOWN_ACTION' });
  expect(response).toEqual(initialCompareState);
});

test('compareReducer uses initialCompareState when no state is provided [compare-reducer-default-state]', () => {
  const response = compareReducer(undefined, { type: 'UNKNOWN_ACTION' });
  expect(response).toEqual(initialCompareState);
});
