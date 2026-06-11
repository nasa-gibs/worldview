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

test('TOGGLE_ON_OFF toggles compare feature on and off [compare-reducer-toggle]', () => {
  const response = compareReducer(initialCompareState, {
    type: CONSTANTS.TOGGLE_ON_OFF,
  });
  expect(initialCompareState.active).toBeFalsy();
  expect(response.active).toBeTruthy();
});

test('CHANGE_MODE updates mode [compare-reducer-change-mode]', () => {
  const response = compareReducer(initialCompareState, {
    type: CONSTANTS.CHANGE_MODE,
    mode: 'new-mode',
  });
  expect(initialCompareState.mode).toEqual('swipe');
  expect(response.mode).toEqual('new-mode');
});
