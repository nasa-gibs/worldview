import safeLocalStorage from '../../util/local-storage';
import { CHANGE_TEMPERATURE_UNIT } from './constants';

const { GLOBAL_TEMPERATURE_UNIT } = safeLocalStorage.keys;

export const initialState = {
  globalTemperatureUnit: '',
};

export function getInitialState() {
  const globalTemperatureUnit = safeLocalStorage.getItem(GLOBAL_TEMPERATURE_UNIT);
  return {
    globalTemperatureUnit,
  };
}

export const globalUnitReducer = (state = initialState, action) => {
  switch (action.type) {
    case CHANGE_TEMPERATURE_UNIT:
      return {
        ...state,
        globalTemperatureUnit: action.value,
      };
    default:
      return state;
  }
};
