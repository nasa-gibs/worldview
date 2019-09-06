import { CHANGE_UNITS, USE_GREAT_CIRCLE, TOGGLE_MEASURE_ACTIVE } from './constants';

export function changeUnits(units) {
  return {
    type: CHANGE_UNITS,
    value: units
  };
}
export function useGreatCircle(value) {
  return {
    type: USE_GREAT_CIRCLE,
    value
  };
}

export function toggleMeasureActive(isActive) {
  return {
    type: TOGGLE_MEASURE_ACTIVE,
    value: isActive
  };
}
