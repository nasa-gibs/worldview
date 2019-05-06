import { START, UPDATE_SELECTED, EXIT } from './constants';
import { assign as lodashAssign } from 'lodash';

const INITIAL_STATE = {
  selected: '',
  active: false
};

export default function tourReducer(state = INITIAL_STATE, action) {
  switch (action.type) {
    case EXIT:
      return lodashAssign({}, state, {
        selected: '',
        active: false
      });
    case START:
      return lodashAssign({}, state, {
        selected: '',
        active: true
      });
    case UPDATE_SELECTED:
      return lodashAssign({}, state, {
        selected: action.id,
        active: true
      });
    default:
      return state;
  }
}
