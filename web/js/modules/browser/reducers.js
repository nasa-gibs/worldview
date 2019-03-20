import { assign as lodashAssign } from 'lodash';
import { SCREEN_RESIZE } from './constants';

// https://stackoverflow.com/a/39670754
const initialState = {
  screenWidth: typeof window === 'object' ? window.innerWidth : null,
  screenHeight: typeof window === 'object' ? window.innerHeight : null
};
export function browserReducer(state = initialState, action) {
  switch (action.type) {
    case SCREEN_RESIZE:
      return lodashAssign({}, state, {
        screenWidth: action.screenWidth,
        screenHeight: action.screenHeight
      });
  }
  return state;
}
