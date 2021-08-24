import { assign as lodashAssign } from 'lodash';
import {
  DISABLE_VECTOR_ZOOM_ALERT,
  ACTIVATE_VECTOR_ZOOM_ALERT,
  DISABLE_VECTOR_EXCEEDED_ALERT,
  ACTIVATE_VECTOR_EXCEEDED_ALERT,
} from './constants';
import { hasVectorLayers } from '../layers/util';
import { REMOVE_LAYER, REMOVE_GROUP } from '../layers/constants';
import { UPDATE_MAP_EXTENT } from '../map/constants';

export const defaultAlertState = {
  isVectorZoomAlertPresent: false,
  isVectorExceededAlertPresent: false,
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

    default:
      return state;
  }
}
