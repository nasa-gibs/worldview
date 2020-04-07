import { assign as lodashAssign } from 'lodash';
import { TOGGLE_INFINITE_WRAP, TOGGLE_OVERVIEW_MAP } from './constants';

const INITIAL_STATE = {
  isInfinite: false,
  hasOverview: false,
};

export function settingsReducer(state = INITIAL_STATE, action) {
  switch (action.type) {
    case TOGGLE_INFINITE_WRAP:
      return lodashAssign({}, state, {
        isInfinite: !state.active,
      });
    case TOGGLE_OVERVIEW_MAP:
      return lodashAssign({}, state, {
        hasOverview: !state.active,
      });
    default:
      return state;
  }
}
