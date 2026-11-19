import configureMockStore from 'redux-mock-store';
import { thunk } from 'redux-thunk';
import * as CONSTANTS from './constants';
import {
  toggleActiveCompareState,
  toggleCompareOnOff,
  setValue,
  changeMode,
} from './actions';
import { INIT_SECOND_LAYER_GROUP, SYNC_SECOND_LAYER_GROUP } from '../layers/constants';
import fixtures from '../../fixtures';
import { INIT_SECOND_DATE, CLEAR_PRELOAD } from '../date/constants';

const middlewares = [thunk];
const state = fixtures.getState();

test('toggleCompareOnOff dispatches two actions [compare-action-toggle-return-actions]', () => {
  const mockStore = configureMockStore(middlewares);
  const store = mockStore(state);
  store.dispatch(toggleCompareOnOff());
  const firstResponse = store.getActions()[0];
  const secondResponse = store.getActions()[1];
  const thirdResponse = store.getActions()[2];

  expect(firstResponse.type).toEqual(INIT_SECOND_LAYER_GROUP);
  expect(secondResponse.type).toEqual(INIT_SECOND_DATE);
  expect(thirdResponse.type).toEqual(CONSTANTS.TOGGLE_ON_OFF);
});

test('toggleCompareOnOff with active=true exits compare mode and snapshots layer IDs [compare-action-toggle-exit]', () => {
  const mockStore = configureMockStore(middlewares);
  const activeState = {
    ...state,
    compare: {
      ...state.compare,
      active: true,
      bStatesInitiated: true,
    },
  };
  const store = mockStore(activeState);
  store.dispatch(toggleCompareOnOff());
  const actions = store.getActions();
  const toggleAction = actions.find((a) => a.type === CONSTANTS.TOGGLE_ON_OFF);

  expect(actions.length).toBe(1);
  expect(toggleAction).toBeDefined();
  expect(toggleAction).toHaveProperty('lastExitALayerIds');
  expect(Array.isArray(toggleAction.lastExitALayerIds)).toBe(true);
});

test('toggleCompareOnOff with bStatesInitiated=true dispatches syncSecondLayerGroup [compare-action-toggle-reentry]', () => {
  const mockStore = configureMockStore(middlewares);
  const lastExitALayerIds = ['layer1', 'layer2'];
  const reentryState = {
    ...state,
    compare: {
      ...state.compare,
      active: false,
      bStatesInitiated: true,
      lastExitALayerIds,
    },
  };
  const store = mockStore(reentryState);
  store.dispatch(toggleCompareOnOff());
  const actions = store.getActions();
  const syncAction = actions.find((a) => a.type === SYNC_SECOND_LAYER_GROUP);
  const toggleAction = actions.find((a) => a.type === CONSTANTS.TOGGLE_ON_OFF);

  expect(syncAction).toBeDefined();
  expect(toggleAction).toBeDefined();
  expect(actions.find((a) => a.type === INIT_SECOND_LAYER_GROUP)).toBeUndefined();
  expect(actions.find((a) => a.type === INIT_SECOND_DATE)).toBeUndefined();
});

test('toggleCompareOnOff with active=false and bStatesInitiated=false does not include lastExitALayerIds in TOGGLE_ON_OFF [compare-action-toggle-no-exit-payload]', () => {
  const mockStore = configureMockStore(middlewares);
  const store = mockStore(state);
  store.dispatch(toggleCompareOnOff());
  const actions = store.getActions();
  const toggleAction = actions.find((a) => a.type === CONSTANTS.TOGGLE_ON_OFF);

  expect(toggleAction).toBeDefined();
  expect(toggleAction).not.toHaveProperty('lastExitALayerIds');
});

test(
  `toggleActiveCompareState returns ${CONSTANTS.CHANGE_STATE} action type [compare-action-toggle]`,
  () => {
    const mockStore = configureMockStore(middlewares);
    const store = mockStore(state);
    store.dispatch(toggleActiveCompareState());
    const firstResponse = store.getActions()[0];
    const secondResponse = store.getActions()[1];
    const expectedFirst = { type: CLEAR_PRELOAD };
    const expectedSecond = { type: CONSTANTS.CHANGE_STATE };
    expect(firstResponse).toEqual(expectedFirst);
    expect(secondResponse).toEqual(expectedSecond);
  },
);

test(
  `setValue returns ${CONSTANTS.CHANGE_VALUE} action type and value [compare-action-set-value]`,
  () => {
    const expectedAction = {
      type: CONSTANTS.CHANGE_VALUE,
      value: 3,
    };
    expect(setValue(3)).toEqual(expectedAction);
  },
);

test('setValue handles zero [compare-action-set-value-zero]', () => {
  expect(setValue(0)).toEqual({ type: CONSTANTS.CHANGE_VALUE, value: 0 });
});

test(
  `changeMode returns ${CONSTANTS.CHANGE_MODE} action type and mode value [compare-action-change-mode]`,
  () => {
    const expectedAction = {
      type: CONSTANTS.CHANGE_MODE,
      mode: 'some-mode',
    };
    expect(changeMode('some-mode')).toEqual(expectedAction);
  },
);

test('changeMode handles different mode strings [compare-action-change-mode-opacity]', () => {
  expect(changeMode('opacity')).toEqual({ type: CONSTANTS.CHANGE_MODE, mode: 'opacity' });
});
