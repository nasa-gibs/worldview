import { UPDATE_PERMALINK, REQUEST_SHORT_LINK } from './constants';
import { requestAction } from '../core/actions';

export function updatePermalink(queryString) {
  return {
    type: UPDATE_PERMALINK,
    queryString: queryString
  };
}
export function requestShortLink(location, type, signal) {
  return dispatch => {
    return requestAction(dispatch, REQUEST_SHORT_LINK, location, type, signal);
  };
}
