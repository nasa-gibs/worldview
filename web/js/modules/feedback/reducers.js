import { assign as lodashAssign } from 'lodash';
import { INIT_FEEDBACK } from './constants';

const feedbackState = {
  isInitiated: false,
};

export default function feedbackReducer(action, state = feedbackState) {
  switch (action.type) {
    case INIT_FEEDBACK:
      return lodashAssign({}, state, {
        isInitiated: true,
      });
    default:
      return state;
  }
}
