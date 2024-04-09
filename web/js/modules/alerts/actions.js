import {
  ACTIVATE_DDV_ZOOM_ALERT,
  ACTIVATE_DDV_LOCATION_ALERT,
  DEACTIVATE_DDV_LOCATION_ALERT,
  DEACTIVATE_DDV_ZOOM_ALERT,
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

export function disableDDVZoomAlert() {
  return {
    type: DEACTIVATE_DDV_ZOOM_ALERT,
  };
}

export function disableDDVLocationAlert() {
  return {
    type: DEACTIVATE_DDV_LOCATION_ALERT,
  };
}
