import { assign as lodashAssign } from 'lodash';
import { REQUEST_SHORT_LINK, UPDATE_PERMALINK } from './constants';
import { requestReducer } from '../core/reducers';

export const defaultLinkState = {
  queryString: '',
};

export function shortLink(action, state = {}) {
  return requestReducer(REQUEST_SHORT_LINK, state, action);
}

export function linkReducer(action, state = defaultLinkState) {
  switch (action.type) {
    case UPDATE_PERMALINK:
      return lodashAssign({}, state, {
        queryString: action.queryString || '',
      });
    default:
      return state;
  }
}
