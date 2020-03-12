import { CHANGE_UNITS, TOGGLE_MEASURE_ACTIVE } from './constants';

export function changeUnits(units) {
  return {
    type: CHANGE_UNITS,
    value: units,
  };
}
export function toggleMeasureActive(isActive) {
  return {
    type: TOGGLE_MEASURE_ACTIVE,
    value: isActive,
  };
}
