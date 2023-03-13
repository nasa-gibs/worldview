import { assign as lodashAssign } from 'lodash';
import {
  TOGGLE_ON_OFF,
  TOGGLE_AOI_ON_OFF,
  UPDATE_AOI_COORDINATES,
  TOGGLE_AOI_SELECTED_ON_OFF,
  TOGGLE_REQUEST_IN_PROGRESS,
  UPDATE_CHARTING_DATE_SELECTION,
  UPDATE_START_DATE,
  UPDATE_END_DATE,
  UPDATE_ACTIVE_CHART,
  UPDATE_REQUEST_STATUS_MESSAGE,
} from './constants';

export const initialChartingState = {
  active: false,
  activeLayer: undefined,
  aoiActive: false,
  aoiSelected: false,
  aoiCoordinates: [],
  chartRequestInProgress: false,
  requestStatusMessage: '',
  timeSpanSelection: 'range',
  timeSpanStartDate: undefined,
  timeSpanEndDate: undefined,
};
export function chartingReducer(state = initialChartingState, action) {
  switch (action.type) {
    case TOGGLE_ON_OFF:
      if (state.active) {
        // reset to initial charting state
        return lodashAssign({}, state, {
          active: false,
          activeLayer: undefined,
          aoiActive: false,
          aoiCoordinates: null,
          aoiSelected: false,
          chartRequestInProgress: false,
          requestStatusMessage: '',
          timeSpanEndDate: undefined,
          timeSpanSelection: 'range',
          timeSpanStartDate: undefined,
        });
      }
      return lodashAssign({}, state, {
        active: !state.active,
      });
    case TOGGLE_AOI_ON_OFF:
      return lodashAssign({}, state, {
        aoiActive: !state.aoiActive,
      });
    case TOGGLE_REQUEST_IN_PROGRESS:
      return lodashAssign({}, state, {
        chartRequestInProgress: action.status,
      });
    case UPDATE_REQUEST_STATUS_MESSAGE:
      return lodashAssign({}, state, {
        requestStatusMessage: action.message,
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
    case UPDATE_CHARTING_DATE_SELECTION:
      return lodashAssign({}, state, {
        timeSpanSelection: action.buttonClicked,
      });
    case UPDATE_START_DATE:
      return lodashAssign({}, state, {
        timeSpanStartDate: action.date,
      });
    case UPDATE_END_DATE:
      return lodashAssign({}, state, {
        timeSpanEndDate: action.date,
      });
    case UPDATE_ACTIVE_CHART:
      return lodashAssign({}, state, {
        activeLayer: action.layerId,
      });
    default:
      break;
  }
  return state;
}
