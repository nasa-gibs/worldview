import { assign as lodashAssign } from 'lodash';
import { CHANGE_UNITS, USE_GREAT_CIRCLE } from './constants';

const defaultState = {
  units: 'km',
  useGreatCircleMeasurements: false
};

export default function measureReducer(state = defaultState, action) {
  switch (action.type) {
    case CHANGE_UNITS:
      return lodashAssign({}, state, {
        units: action.value
      });
    case USE_GREAT_CIRCLE:
      return lodashAssign({}, state, {
        useGreatCircleMeasurements: action.value
      });
    default:
      return state;
  }
}
