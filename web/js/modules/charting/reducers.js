import { assign as lodashAssign } from 'lodash';
import {
  TOGGLE_ON_OFF, TOGGLE_AOI_ON_OFF, UPDATE_AOI_COORDINATES, TOGGLE_AOI_SELECTED_ON_OFF,
} from './constants';

export const initialChartingState = {
  aoiActive: false,
  aoiSelected: false,
  aoiCoordinates: [],
  chartingActive: false,
  timeSpanSingleDate: true,
  timeSpanStartdate: null,
  timeSpanEndDate: null,
};
export function chartingReducer(state = initialChartingState, action) {
  switch (action.type) {
    case TOGGLE_ON_OFF:
      return lodashAssign({}, state, {
        active: !state.active,
      });
    case TOGGLE_AOI_ON_OFF:
      return lodashAssign({}, state, {
        aoiActive: !state.aoiActive,
      });
    case UPDATE_AOI_COORDINATES:
      // action.extent = the geometry from the drawn AOI box
      return lodashAssign({}, state, {
        aoiCoordinates: action.extent,
      });
    case TOGGLE_AOI_SELECTED_ON_OFF:
      if (action.action != null) {
        return lodashAssign({}, state, {
          aoiSelected: action.action,
        });
      }
      return lodashAssign({}, state, {
        aoiSelected: !state.aoiSelected,
      });

    default:
      break;
  }
  return state;
}
