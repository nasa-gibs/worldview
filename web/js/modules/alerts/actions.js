import {
  ACTIVATE_DDV_ZOOM_ALERT,
  ACTIVATE_DDV_LOCATION_ALERT,
  DEACTIVATE_DDV_LOCATION_ALERT,
  DEACTIVATE_DDV_ZOOM_ALERT,
} from './constants';

export function enableDDVZoomAlert(title) {
  return {
    type: ACTIVATE_DDV_ZOOM_ALERT,
    title,
  };
}

export function enableDDVLocationAlert(title) {
  return {
    type: ACTIVATE_DDV_LOCATION_ALERT,
    title,
  };
}

export function disableDDVZoomAlert(title) {
  return {
    type: DEACTIVATE_DDV_ZOOM_ALERT,
    title,
  };
}

export function disableDDVLocationAlert(title) {
  return {
    type: DEACTIVATE_DDV_LOCATION_ALERT,
    title,
  };
}
