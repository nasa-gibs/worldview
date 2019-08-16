import { assign as lodashAssign } from 'lodash';
import {
  MEASURE_DISTANCE,
  MEASURE_AREA,
  CLEAR_MEASUREMENTS
} from './constants';

const INITIAL_STATE = {
  distanceSketches: [],
  areaSketches: []
};

export default function measureReducer(state = INITIAL_STATE, action) {
  switch (action.type) {
    case MEASURE_DISTANCE:
      return lodashAssign({}, state, {
        distanceSketches: action.sketches
      });
    case MEASURE_AREA:
      return lodashAssign({}, state, {
        areaSketches: action.sketches
      });
    case CLEAR_MEASUREMENTS:
      return lodashAssign({}, state, INITIAL_STATE);
    default:
      return state;
  }
}
