import {
  UPDATE_ZOOM_LEVEL,
  CUSTOM_INTERVAL_CHANGE,
  INTERVAL_CHANGE
} from './constants';

export function updateZoomLevel(num) {
  return {
    type: UPDATE_ZOOM_LEVEL,
    value: num
  };
}
export function customIntervalChange(value) {
  return {
    type: CUSTOM_INTERVAL_CHANGE,
    value
  };
}
export function intervalChange(value) {
  return {
    type: INTERVAL_CHANGE,
    value
  };
}
