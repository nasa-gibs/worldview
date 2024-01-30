import { requestReducer } from '../core/reducers';
import {
  getCount,
  separateByType,
  getPriority,
} from './util';
import {
  REQUEST_NOTIFICATIONS,
  SET_NOTIFICATIONS,
  NOTIFICATIONS_SEEN,
  OUTAGE_NOTIFICATIONS_SEEN,
} from './constants';

export const notificationReducerState = {
  number: null,
  numberUnseen: null,
  type: '',
  isActive: false,
  object: {},
};

export function notificationsRequest(state = {}, action) {
  return requestReducer(REQUEST_NOTIFICATIONS, state, action);
}

export function notificationsReducer(state = notificationReducerState, action) {
  switch (action.type) {
    case SET_NOTIFICATIONS:
      if (action.array.length > 0) {
        const notificationsByType = separateByType(action.array);
        const numberOutagesUnseen = notificationsByType.outages.length;
        return {
          ...state,
          total: getCount(notificationsByType),
          number: getCount(notificationsByType),
          numberUnseen: getCount(notificationsByType),
          numberOutagesUnseen,
          type: getPriority(notificationsByType),
          isActive: true,
          object: notificationsByType,
        };
      }
      return state;

    case NOTIFICATIONS_SEEN:
      return {
        ...state,
        numberUnseen: null,
        type: '',
        isActive: true,
      };
    case OUTAGE_NOTIFICATIONS_SEEN: {
      const notificationObj = {
        alerts: state.object.alerts,
        messages: state.object.messages,
        layerNotices: state.object.layerNotices,
        outages: [],
      };
      return {
        ...state,
        numberUnseen: state.number - state.numberOutagesUnseen >= 0
          ? state.number - state.numberOutagesUnseen
          : 0,
        number: state.number - state.numberOutagesUnseen >= 0
          ? state.number - state.numberOutagesUnseen
          : 0,
        numberOutagesUnseen: 0,
        type: getPriority(notificationObj),
      };
    }
    default:
      return state;
  }
}
