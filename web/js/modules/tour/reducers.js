
import { assign as lodashAssign } from 'lodash';
import {
  START, UPDATE_SELECTED, END_TOUR, TOUR_KEY_PRESS_CLOSE,
} from './constants';

const INITIAL_STATE = {
  selected: '',
  active: false,
};

export default function reducers(state = INITIAL_STATE, action) {
  switch (action.type) {
    case END_TOUR:
      return lodashAssign({}, state, {
        selected: '',
        active: false,
      });
    case TOUR_KEY_PRESS_CLOSE:
      return lodashAssign({}, state, {
        selected: '',
        active: false,
      });
    case START:
      return lodashAssign({}, state, {
        selected: '',
        active: true,
      });
    case UPDATE_SELECTED:
      return lodashAssign({}, state, {
        selected: action.id,
        active: true,
      });
    default:
      return state;
  }
}
