import {
  CLEAR_ROTATE,
  CHANGE_CURSOR,
  REFRESH_ROTATE,
  UPDATE_MAP_EXTENT,
  RENDERED,
  UPDATE_MAP_UI,
  FITTED_TO_LEADING_EXTENT,
} from './constants';

export function clearRotate() {
  return {
    type: CLEAR_ROTATE,
  };
}
export function refreshRotation(number) {
  return {
    type: REFRESH_ROTATE,
    rotation: number,
  };
}

export function changeCursor(bool) {
  return {
    type: CHANGE_CURSOR,
    bool,
  };
}

export function updateMapExtent(extent) {
  return {
    type: UPDATE_MAP_EXTENT,
    extent,
  };
}

export function updateRenderedState() {
  return {
    type: RENDERED,
  };
}

export function updateMapUI(ui, rotation) {
  return {
    type: UPDATE_MAP_UI,
    ui,
    rotation,
  };
}

export function fitToLeadingExtent(extent) {
  return {
    type: FITTED_TO_LEADING_EXTENT,
    extent,
  };
}
