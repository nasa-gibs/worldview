import {
  DISABLE_DDV_ZOOM_ALERT,
  DISABLE_DDV_LOCATION_ALERT,
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

export function enableDDVLocationAlert() {
  return {
    type: ACTIVATE_DDV_LOCATION_ALERT,
  };
}

export function disableDDVZoomAlert() {
  return {
    type: DISABLE_DDV_ZOOM_ALERT,
  };
}

export function disableDDVLocationAlert() {
  return {
    type: DISABLE_DDV_LOCATION_ALERT,
  };
}