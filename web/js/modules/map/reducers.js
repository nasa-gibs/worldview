import { assign as lodashAssign } from 'lodash';
import { RUNNING_DATA, CLEAR_RUNNING_DATA } from './constants';

const INITIAL_STATE = {
  runningDataObj: {}
};

export default function mapReducer(state = INITIAL_STATE, action) {
  switch (action.type) {
    case RUNNING_DATA:
      return lodashAssign({}, state, {
        runningDataObj: action.payload
      });
    case CLEAR_RUNNING_DATA:
      return lodashAssign({}, state, {
        runningDataObj: {}
      });
    default:
      return state;
  }
}
