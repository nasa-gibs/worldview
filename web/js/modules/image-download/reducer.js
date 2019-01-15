import { CHANGE_PROJECTION } from './constants';
import { assign as lodashAssign } from 'lodash';
const projectionState = {
  id: 'geographic'
};

export default function projectionReducer(state = projectionState, action) {
  switch (action.type) {
    case CHANGE_PROJECTION:
      return lodashAssign({}, state, {
        id: action.id
      });
    default:
      return state;
  }
}
