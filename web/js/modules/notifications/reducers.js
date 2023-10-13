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
          number: getCount(notificationsByType),
          numberUnseen: getCount(notificationsByType, true),
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
    case OUTAGE_NOTIFICATIONS_SEEN:
      console.log(state);
      const { number, numberOutagesUnseen } = state;
      // console.log('number', number);
      // console.log('numberOutagesUnseen', numberOutagesUnseen);
      const newNumberUnseen = number - numberOutagesUnseen >= 0 ? number - numberOutagesUnseen : 0;
      return {
        ...state,
        numberUnseen: newNumberUnseen,
        numberOutagesUnseen: 0,
      };
    default:
      return state;
  }
}
