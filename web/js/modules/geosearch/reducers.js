import { assign as lodashAssign } from 'lodash';
import {
  CLEAR_COORDINATES,
  SELECT_COORDINATES_TO_FLY,
  TOGGLE_REVERSE_GEOCODE_ACTIVE,
  TOGGLE_SHOW_GEOSEARCH,
  UPDATE_ACTIVE_MARKER,
} from './constants';
import { getLocalStorageCollapseState } from './util';

const localStorageCollapseState = getLocalStorageCollapseState();
const geosearchState = {
  isCoordinateSearchActive: false,
  isExpanded: !localStorageCollapseState,
  coordinates: [],
  activeMarker: null,
};

export default function geosearchReducer(state = geosearchState, action) {
  switch (action.type) {
    case UPDATE_ACTIVE_MARKER:
      return lodashAssign({}, state, {
        activeMarker: action.value,
      });
    case TOGGLE_SHOW_GEOSEARCH:
      return lodashAssign({}, state, {
        isExpanded: action.value,
      });
    case SELECT_COORDINATES_TO_FLY:
      return lodashAssign({}, state, {
        isCoordinateSearchActive: action.value,
        coordinates: action.coordinates,
        activeMarker: action.activeMarker,
      });
    case CLEAR_COORDINATES:
      return lodashAssign({}, state, {
        coordinates: [],
        activeMarker: null,
      });
    case TOGGLE_REVERSE_GEOCODE_ACTIVE:
      return lodashAssign({}, state, {
        isCoordinateSearchActive: action.value,
      });
    default:
      return state;
  }
}
