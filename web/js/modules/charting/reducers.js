import { assign as lodashAssign } from 'lodash';
import { TOGGLE_ON_OFF } from './constants';

export const initialChartingState = {
  active: true,
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
