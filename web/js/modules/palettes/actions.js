import { requestAction } from '../core/actions';
import { REQUEST_PALETTE } from './constants';

export function requestPalette(location, id) {
  return dispatch => {
    return requestAction(
      dispatch,
      REQUEST_PALETTE,
      location,
      'application/json',
      id
    );
  };
}
