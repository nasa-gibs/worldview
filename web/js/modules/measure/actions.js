import {
  MEASURE_DISTANCE,
  MEASURE_AREA,
  CHANGE_UNIT_OF_MEASURE,
  CLEAR_MEASUREMENTS
} from './constants';

export function measureDistance() {
  return {
    type: MEASURE_DISTANCE,
    value: 'distance'
  };
}
export function measureArea() {
  return {
    type: MEASURE_AREA,
    value: 'area'
  };
}
export function changeUnitOfMeasure(unit) {
  return {
    type: CHANGE_UNIT_OF_MEASURE,
    value: unit
  };
}
export function clearMeasurements() {
  return {
    type: CLEAR_MEASUREMENTS
  };
}
