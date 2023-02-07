import { assign as lodashAssign } from 'lodash';
import { TOGGLE_ON_OFF, TOGGLE_AOI_ON_OFF } from './constants';

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
    default:
      break;
  }
  return state;
}
