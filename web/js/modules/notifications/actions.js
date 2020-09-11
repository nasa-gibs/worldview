import { requestAction } from '../core/actions';
import {
  REQUEST_NOTIFICATIONS,
  SET_NOTIFICATIONS,
  NOTIFICATIONS_SEEN,
} from './constants';
import { getActiveLayers } from '../layers/selectors';

export function requestNotifications(location, type) {
  return (dispatch) => requestAction(dispatch, REQUEST_NOTIFICATIONS, location);
}
export function setNotifications(array) {
  return (dispatch, getState) => {
    const activeLayers = getActiveLayers(getState());
    dispatch({
      type: SET_NOTIFICATIONS,
      array,
      activeLayers,
    });
  };
}
export function notificationsSeen() {
  return {
    type: NOTIFICATIONS_SEEN,
  };
}
