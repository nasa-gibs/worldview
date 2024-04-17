import { assign as lodashAssign } from 'lodash';
import {
  DISABLE_VECTOR_ZOOM_ALERT,
  ACTIVATE_VECTOR_ZOOM_ALERT,
  DISABLE_VECTOR_EXCEEDED_ALERT,
  ACTIVATE_VECTOR_EXCEEDED_ALERT,
  ACTIVATE_DDV_ZOOM_ALERT,
  ACTIVATE_DDV_LOCATION_ALERT,
  DEACTIVATE_DDV_LOCATION_ALERT,
  DEACTIVATE_DDV_ZOOM_ALERT,
} from './constants';
import { hasVectorLayers } from '../layers/util';
import { REMOVE_LAYER, REMOVE_GROUP } from '../layers/constants';
import { UPDATE_MAP_EXTENT } from '../map/constants';

export const defaultAlertState = {
  isVectorZoomAlertPresent: false,
  isVectorExceededAlertPresent: false,
  isDDVZoomAlertPresent: false,
  isDDVLocationAlertPresent: false,
  ddvZoomAlerts: [],
  ddvLocationAlerts: [],
};

export function alertReducer(state = defaultAlertState, action) {
  switch (action.type) {
    case DISABLE_VECTOR_ZOOM_ALERT:
      return lodashAssign({}, state, {
        isVectorZoomAlertPresent: false,
      });
    case ACTIVATE_VECTOR_ZOOM_ALERT:
      return lodashAssign({}, state, {
        isVectorZoomAlertPresent: true,
      });
    case DISABLE_VECTOR_EXCEEDED_ALERT:
    case UPDATE_MAP_EXTENT:
      return lodashAssign({}, state, {
        isVectorExceededAlertPresent: false,
      });
    case ACTIVATE_VECTOR_EXCEEDED_ALERT:
      return lodashAssign({}, state, {
        isVectorExceededAlertPresent: true,
        isVectorZoomAlertPresent: false,
      });
    case REMOVE_LAYER:
    case REMOVE_GROUP:
      if (!state.isVectorZoomAlertPresent && !state.isVectorExceededAlertPresent) {
        return state;
      } if (!hasVectorLayers(action.layers)) {
        return lodashAssign({}, state, {
          isVectorZoomAlertPresent: false,
          isVectorExceededAlertPresent: false,
        });
      }
      return state;
    case ACTIVATE_DDV_ZOOM_ALERT:
      return lodashAssign({}, state, {
        isDDVZoomAlertPresent: true,
        ddvZoomAlerts: [...state.ddvZoomAlerts, action.title],
      });
    case ACTIVATE_DDV_LOCATION_ALERT:
      return lodashAssign({}, state, {
        isDDVLocationAlertPresent: true,
        ddvLocationAlerts: [...state.ddvLocationAlerts, action.title],
      });
    case DEACTIVATE_DDV_ZOOM_ALERT:
      return lodashAssign({}, state, {
        isDDVZoomAlertPresent: state.ddvZoomAlerts.length > 1,
        ddvZoomAlerts: state.ddvZoomAlerts.filter((title) => title !== action.title),
      });
    case DEACTIVATE_DDV_LOCATION_ALERT:
      return lodashAssign({}, state, {
        isDDVLocationAlertPresent: state.ddvLocationAlerts.length > 1,
        ddvLocationAlerts: state.ddvLocationAlerts.filter((title) => title !== action.title),
      });

    default:
      return state;
  }
}
