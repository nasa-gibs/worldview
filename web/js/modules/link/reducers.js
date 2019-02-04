import { UPDATE_PERMALINK, REQUEST_SHORT_LINK } from './constants';
import { requestReducer } from '../core/reducers';
import { assign as lodashAssign } from 'lodash';

const linkState = {
  permalink: ''
};

export function shortLink(state = {}, action) {
  return requestReducer(REQUEST_SHORT_LINK, state, action);
}

export function linkReducer(state = linkState, action) {
  switch (action.type) {
    case UPDATE_PERMALINK:
      return lodashAssign({}, state, {
        queryString: action.queryString
      });
    default:
      return state;
  }
}
