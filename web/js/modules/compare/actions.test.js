import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import * as CONSTANTS from './constants';
import {
  toggleActiveCompareState,
  toggleCompareOnOff,
  setValue,
  changeMode,
} from './actions';
import { INIT_SECOND_LAYER_GROUP } from '../layers/constants';
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
