import { requestAction } from '../core/actions';

import {
  REQUEST_NOTIFICATIONS,
  SET_NOTIFICATIONS,
  NOTIFICATIONS_SEEN
} from './constants';

export function requestNotifications(location, type) {
  return dispatch => {
    return requestAction(dispatch, REQUEST_NOTIFICATIONS, location);
  };
}
export function setNotifications(array) {
  return {
    type: SET_NOTIFICATIONS,
    array: array
  };
}
export function notificationsSeen() {
  return {
    type: NOTIFICATIONS_SEEN
  };
}
