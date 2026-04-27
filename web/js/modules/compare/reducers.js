import { assign as lodashAssign } from 'lodash';
import {
  CHANGE_STATE,
  TOGGLE_ON_OFF,
  CHANGE_VALUE,
  CHANGE_MODE,
} from './constants';

export const initialCompareState = {
  active: false,
  isCompareA: true,
  mode: 'swipe',
  value: 50,
  activeString: 'active',
  bStatesInitiated: false,
};
export function compareReducer(state = initialCompareState, action) {
  switch (action.type) {
    case CHANGE_STATE: {
      const newIsCompareA = !state.isCompareA;
      return lodashAssign({}, state, {
        isCompareA: newIsCompareA,
        activeString: newIsCompareA ? 'active' : 'activeB',
      });
    }
    case TOGGLE_ON_OFF:
      return lodashAssign({}, state, {
        active: !state.active,
        bStatesInitiated: true,
        // When exiting compare, snapshot A's layer IDs so re-entry SYNC
        // can distinguish "removed by user" from "added after exit".
        ...(state.active && { lastExitALayerIds: action.lastExitALayerIds }),
      });
    case CHANGE_MODE:
      return lodashAssign({}, state, {
        mode: action.mode,
        value: 50,
      });

    case CHANGE_VALUE:
      return lodashAssign({}, state, {
        value: action.value,
      });
    default:
      break;
  }
  return state;
}
