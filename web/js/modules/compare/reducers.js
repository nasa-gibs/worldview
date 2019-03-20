import { assign as lodashAssign } from 'lodash';
import {
  CHANGE_STATE,
  TOGGLE,
  ACTIVATE,
  DEACTIVATE,
  CHANGE_VALUE,
  CHANGE_MODE
} from './constants';
const initialState = {
  active: false,
  isActiveA: true,
  mode: 'swipe',
  value: 50
};
export function compareReducer(state = initialState, action) {
  switch (action.type) {
    case CHANGE_STATE:
      return lodashAssign({}, state, {
        isActiveA: action.stateStr === 'A'
      });
    case TOGGLE:
      return lodashAssign({}, state, {
        active: !state.active
      });
    case ACTIVATE:
      return lodashAssign({}, state, {
        active: true
      });
    case DEACTIVATE:
      return lodashAssign({}, state, {
        active: false
      });
    case CHANGE_MODE:
      return lodashAssign({}, state, {
        mode: action.mode,
        value: 50
      });
    case CHANGE_VALUE:
      return lodashAssign({}, state, {
        value: action.value
      });
  }
  return state;
}
