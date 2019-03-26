import { CHANGE_PROJECTION } from './constants';
import { assign as lodashAssign } from 'lodash';

export const projectionState = {
  id: 'geographic',
  selected: {}
};

export default function projectionReducer(state = projectionState, action) {
  switch (action.type) {
    case CHANGE_PROJECTION:
      return lodashAssign({}, state, {
        id: action.id,
        selected: action.selected
      });
    default:
      return state;
  }
}
