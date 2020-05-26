import { assign as lodashAssign } from 'lodash';
import { TOGGLE_VECTOR_ALERT, DISABLE_VECTOR_ALERT, ACTIVATE_VECTOR_ALERT } from './constants';
import { hasVectorLayers } from '../layers/util';
import { REMOVE_LAYER } from '../layers/constants';

export const defaultAlertState = {
  isVectorAlertActive: false,
};

export function alertReducer(state = defaultAlertState, action) {
  switch (action.type) {
    case TOGGLE_VECTOR_ALERT:
      return lodashAssign({}, state, {
        isVectorAlertActive: !state.isVectorAlertActive,
      });
    case DISABLE_VECTOR_ALERT:
      return lodashAssign({}, state, {
        isVectorAlertActive: false,
      });
    case ACTIVATE_VECTOR_ALERT:
      return lodashAssign({}, state, {
        isVectorAlertActive: true,
      });
    case REMOVE_LAYER:
      if (!state.isVectorAlertActive) {
        return state;
      } if (!hasVectorLayers(action.layers)) {
        return lodashAssign({}, state, {
          isVectorAlertActive: false,
        });
      }
      return state;

    default:
      return state;
  }
}
