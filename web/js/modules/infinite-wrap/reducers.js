import { assign as lodashAssign } from 'lodash';
import { TOGGLE } from './constants';

const INITIAL_STATE = {
  active: false,
};

export function infiniteScrollReducer(state = INITIAL_STATE, action) {
  switch (action.type) {
    case TOGGLE:
      return lodashAssign({}, state, {
        active: !state.active,
      });
    default:
      return state;
  }
}
