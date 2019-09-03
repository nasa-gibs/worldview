import { assign as lodashAssign } from 'lodash';
import { CHANGE_UNITS } from './constants';

const defaultState = {
  units: 'km'
};

export default function measureReducer(state = defaultState, action) {
  switch (action.type) {
    case CHANGE_UNITS:
      return lodashAssign({}, state, {
        units: action.value
      });
    default:
      return state;
  }
}
