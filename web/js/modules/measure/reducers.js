import { assign as lodashAssign } from 'lodash';
import {
  MEASURE_DISTANCE,
  MEASURE_AREA,
  CHANGE_UNIT_OF_MEASURE,
  CLEAR_MEASUREMENTS
} from './constants';

const INITIAL_STATE = {
  distanceMeasurements: [],
  areaMeasurements: []
};

export function measureReducer(state = INITIAL_STATE, action) {
  switch (action.type) {
    case MEASURE_AREA:
      return state;
    case MEASURE_DISTANCE:
      return state;
    case CHANGE_UNIT_OF_MEASURE:
      return state;
    case CLEAR_MEASUREMENTS:
      return lodashAssign({}, state, INITIAL_STATE);
    default:
      return state;
  }
}
