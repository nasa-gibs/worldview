import { assign as lodashAssign } from 'lodash';
import {
  CHANGE_STATE,
  TOGGLE_ON_OFF,
  CHANGE_VALUE,
  CHANGE_MODE
} from './constants';
const initialState = {
  active: false,
  isCompareA: true,
  mode: 'swipe',
  value: 50,
  activeString: 'active'
};
export function compareReducer(state = initialState, action) {
  switch (action.type) {
    case CHANGE_STATE:
      const newIsCompareA = !state.isCompareA;
      return lodashAssign({}, state, {
        isCompareA: newIsCompareA,
        activeString: newIsCompareA ? 'active' : 'activeB'
      });
    case TOGGLE_ON_OFF:
      return lodashAssign({}, state, {
        active: !state.active
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
