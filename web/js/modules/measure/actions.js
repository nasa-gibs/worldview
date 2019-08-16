import {
  MEASURE_DISTANCE,
  MEASURE_AREA,
  CLEAR_MEASUREMENTS
} from './constants';

export function measureDistance() {
  return {
    type: MEASURE_DISTANCE
  };
}
export function measureArea() {
  return {
    type: MEASURE_AREA
  };
}
export function clearMeasurements() {
  return {
    type: CLEAR_MEASUREMENTS
  };
}
