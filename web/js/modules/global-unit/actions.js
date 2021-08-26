import {
  CHANGE_TEMPERATURE_UNIT,
} from './constants';
import safeLocalStorage from '../../util/local-storage';

const { GLOBAL_TEMPERATURE_UNIT } = safeLocalStorage.keys;
// eslint-disable-next-line import/prefer-default-export
export function changeTemperatureUnit(value) {
  if (!value) {
    safeLocalStorage.removeItem(GLOBAL_TEMPERATURE_UNIT);
  } else {
    safeLocalStorage.setItem(GLOBAL_TEMPERATURE_UNIT, value);
  }
  return {
    type: CHANGE_TEMPERATURE_UNIT,
    value,
  };
}
