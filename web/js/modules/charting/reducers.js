import { assign as lodashAssign } from 'lodash';
import { TOGGLE_ON_OFF } from './constants';

export const initialChartingState = {
  active: false,
  aoiSelected: false,
  aoiCoordinates: [],
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
    default:
      break;
  }
  return state;
}
