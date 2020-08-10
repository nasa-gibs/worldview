import {
  CHANGE_UNITS,
  UPDATE_MEASUREMENTS,
  TOGGLE_MEASURE_ACTIVE,
} from './constants';

const defaultState = {
  isActive: false,
  unitOfMeasure: 'km',
  allMeasurements: {
    'EPSG:3413': {},
    'EPSG:4326': {},
    'EPSG:3031': {},
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
    case UPDATE_MEASUREMENTS:
      return {
        ...state,
        allMeasurements: {
          'EPSG:3413': action.value['EPSG:3413'],
          'EPSG:4326': action.value['EPSG:4326'],
          'EPSG:3031': action.value['EPSG:3031'],
        },
      };
    default:
      return state;
  }
}
