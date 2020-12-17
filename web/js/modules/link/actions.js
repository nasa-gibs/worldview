import { UPDATE_PERMALINK, REQUEST_SHORT_LINK } from './constants';
import { requestAction } from '../core/actions';

export function updatePermalink(queryString) {
  return {
    type: UPDATE_PERMALINK,
    queryString,
  };
}
export function requestShortLink(location, type, options) {
  return (dispatch) => requestAction(
    dispatch,
    REQUEST_SHORT_LINK,
    location,
    type,
    null, // id
    options,
  );
}
