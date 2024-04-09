import {
  ACTIVATE_DDV_ZOOM_ALERT,
  ACTIVATE_DDV_LOCATION_ALERT,
} from './constants';

export function enableDDVZoomAlert(id, title) {
  return {
    type: ACTIVATE_DDV_ZOOM_ALERT,
    id,
    title,
  };
}

export function enableDDVLocationAlert(id, title) {
  return {
    type: ACTIVATE_DDV_LOCATION_ALERT,
    id,
    title,
  };
}
