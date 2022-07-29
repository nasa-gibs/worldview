import {
  CHANGE_TEMPERATURE_UNIT,
  CHANGE_DATELINE_VISIBILITY,
  CHANGE_COORDINATE_FORMAT
} from './constants';
import safeLocalStorage from '../../util/local-storage';

const { GLOBAL_TEMPERATURE_UNIT, ALWAYS_SHOW_DATELINES, COORDINATE_FORMAT } = safeLocalStorage.keys;

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

export function changeDatelineVisibility(value) {
  if (!value) {
    safeLocalStorage.removeItem(ALWAYS_SHOW_DATELINES);
  } else {
    safeLocalStorage.setItem(ALWAYS_SHOW_DATELINES, value);
  }
  return {
    type: CHANGE_DATELINE_VISIBILITY,
    value,
  };
}

export function changeCoordinateFormat(value) {
  if (!value) {
    safeLocalStorage.removeItem(COORDINATE_FORMAT);
  } else {
    safeLocalStorage.setItem(COORDINATE_FORMAT, value);
  }
  return {
    type: CHANGE_COORDINATE_FORMAT,
    value
  };
}
