import { assign as lodashAssign } from 'lodash';
import {
  TOGGLE_INFINITE_WRAP, TOGGLE_OVERVIEW_MAP, TOGGLE_VISIBLE_DATELINES, TOGGLE_DAY_NIGHT_MODE,
} from './constants';

const INITIAL_STATE = {
  isInfinite: false,
  hasOverview: false,
  hasVisibleDatelines: false,
  isNightMode: false,
};

export function settingsReducer(state = INITIAL_STATE, action) {
  switch (action.type) {
    case TOGGLE_INFINITE_WRAP:
      return lodashAssign({}, state, {
        isInfinite: !state.isInfinite,
      });
    case TOGGLE_OVERVIEW_MAP:
      return lodashAssign({}, state, {
        hasOverview: !state.hasOverview,
      });
    case TOGGLE_VISIBLE_DATELINES:
      return lodashAssign({}, state, {
        hasVisibleDatelines: !state.hasVisibleDatelines,
      });
    case TOGGLE_DAY_NIGHT_MODE:
      return lodashAssign({}, state, {
        isNightMode: !state.isNightMode,
      });
    default:
      return state;
  }
}
