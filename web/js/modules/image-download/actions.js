import {
  UPDATE_BOUNDARIES,
  UPDATE_FILE_TYPE,
  UPDATE_RESOLUTION,
  UPDATE_WORLDFILE,
} from './constants';

export function updateBoundaries(obj) {
  return {
    type: UPDATE_BOUNDARIES,
    boundaries: obj,
  };
}
export function onPanelChange(type, value) {
  let actionType = UPDATE_FILE_TYPE;
  if (type === 'resolution') {
    actionType = UPDATE_RESOLUTION;
  } else if (type === 'worldfile') {
    actionType = UPDATE_WORLDFILE;
  }
  return {
    type: actionType,
    value,
  };
}
