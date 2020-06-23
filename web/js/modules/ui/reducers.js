import { assign as lodashAssign } from 'lodash';
import { TOGGLE_DISTRACTION_FREE_MODE } from './constants';

export const uiState = {
  isDistractionFreeModeActive: false,
};

export default function uiReducers(state = uiState, action) {
  switch (action.type) {
    case TOGGLE_DISTRACTION_FREE_MODE:
      return lodashAssign({}, state, {
        isDistractionFreeModeActive: !state.isDistractionFreeModeActive,
      });
    default:
      return state;
  }
}
