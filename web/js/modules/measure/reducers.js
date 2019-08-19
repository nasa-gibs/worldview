import { assign as lodashAssign } from 'lodash';
import {
  MEASURE_DISTANCE,
  MEASURE_AREA,
  ADD_DISTANCE_MEASUREMENT,
  ADD_AREA_MEASUREMENT,
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
    case ADD_DISTANCE_MEASUREMENT:
      return lodashAssign({}, state, {
        distanceMeasurements: action.value
      });
    case ADD_AREA_MEASUREMENT:
      return lodashAssign({}, state, {
        areaMeasurements: action.value
      });
    case CLEAR_MEASUREMENTS:
      return lodashAssign({}, state, INITIAL_STATE);
    default:
      return state;
  }
}
