import {
  CHANGE_UNITS,
  UPDATE_MEASUREMENTS,
  TOGGLE_MEASURE_ACTIVE,
} from './constants';
import { CRS } from '../map/constants';

const defaultState = {
  isActive: false,
  unitOfMeasure: 'km',
  allMeasurements: {
    ...Object.values(CRS)
      .reduce((prev, key) => ({
        ...prev,
        [key]: {},
      }), {}),
  },
};

export default function measureReducer(state = defaultState, action) {
  switch (action.type) {
    case CHANGE_UNITS:
      return {
        ...state,
        unitOfMeasure: action.value,
      };
    case TOGGLE_MEASURE_ACTIVE:
      return {
        ...state,
        isActive: action.value,
      };
    case UPDATE_MEASUREMENTS: {
      const newMeasurementObj = {};
      Object.entries(action.value).forEach(([key, value]) => {
        newMeasurementObj[key] = value;
      });
      return {
        ...state,
        allMeasurements: {
          ...newMeasurementObj,
        },
      };
    }
    default:
      return state;
  }
}
