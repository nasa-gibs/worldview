import { assign as lodashAssign } from 'lodash';
import { CHANGE_UNITS, TOGGLE_MEASURE_ACTIVE } from './constants';

const defaultState = {
  isActive: false,
  unitOfMeasure: 'km',
};

export default function measureReducer(state = defaultState, action) {
  switch (action.type) {
    case CHANGE_UNITS:
      return lodashAssign({}, state, {
        unitOfMeasure: action.value,
      });
    case TOGGLE_MEASURE_ACTIVE:
      return lodashAssign({}, state, {
        isActive: action.value,
      });
    default:
      return state;
  }
}
