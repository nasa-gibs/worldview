import {
  CHANGE_UNITS,
  UPDATE_MEASUREMENTS,
  TOGGLE_MEASURE_ACTIVE,
} from './constants';

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

export function updateMeasurements(allMeasurements) {
  return {
    type: UPDATE_MEASUREMENTS,
    value: allMeasurements,
  };
}
