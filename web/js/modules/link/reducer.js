import { TOGGLE_URL } from './constants';
import { assign as lodashAssign } from 'lodash';

const linkState = {
  shortened: false
};

export default function linkReducer(state = linkState, action) {
  switch (action.type) {
    case TOGGLE_URL:
      return lodashAssign({}, state, {
        shortened: !state.shortened
      });
    default:
      return state;
  }
}
