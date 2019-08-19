import {
  MEASURE_DISTANCE,
  MEASURE_AREA,
  ADD_DISTANCE_MEASUREMENT,
  ADD_AREA_MEASUREMENT,
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
export function addDistanceMeasurement(measurement) {
  return {
    type: ADD_DISTANCE_MEASUREMENT,
    value: measurement
  };
}
export function addAreaMeasurement(measurement) {
  return {
    type: ADD_AREA_MEASUREMENT,
    value: measurement
  };
}
export function clearMeasurements() {
  return {
    type: CLEAR_MEASUREMENTS
  };
}
