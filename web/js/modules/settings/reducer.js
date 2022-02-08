import safeLocalStorage from '../../util/local-storage';
import { CHANGE_TEMPERATURE_UNIT, CHANGE_DATELINE_VISIBILITY } from './constants';

const { GLOBAL_TEMPERATURE_UNIT, ALWAYS_SHOW_DATELINES } = safeLocalStorage.keys;

export const initialState = {
  globalTemperatureUnit: '',
  alwaysShowDatelines: false,

};

export function getInitialState() {
  return {
    globalTemperatureUnit: safeLocalStorage.getItem(GLOBAL_TEMPERATURE_UNIT),
    alwaysShowDatelines: safeLocalStorage.getItem(ALWAYS_SHOW_DATELINES),
  };
}

export const settingsReducer = (state = initialState, action) => {
  switch (action.type) {
    case CHANGE_TEMPERATURE_UNIT:
      return {
        ...state,
        globalTemperatureUnit: action.value,
      };
    case CHANGE_DATELINE_VISIBILITY: {
      return {
        ...state,
        alwaysShowDatelines: !state.alwaysShowDatelines,
      };
    }
    default:
      return state;
  }
};
