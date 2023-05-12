import {
  notificationsRequest,
  notificationsReducer,
  notificationReducerState,
} from './reducers';
import * as constants from './constants';
import { defaultRequestState } from '../core/reducers';

describe('notificationsRequest reducer', () => {
  test('should return the initial state', () => {
    expect(notificationsRequest([], {})).toEqual(defaultRequestState);
  });
  test('Should set isLoading to true on Request Start [notifications-reducer-loading]', () => {
    expect(
      notificationsRequest([], {
        type: constants.REQUEST_NOTIFICATIONS_START,
      }),
    ).toEqual({
      isLoading: true,
      error: null,
      response: null,
      type: null,
    });
  });
  test('Should return response upon request success [notifications-reducer-success]', () => {
    expect(
      notificationsRequest([], {
        type: constants.REQUEST_NOTIFICATIONS_SUCCESS,
        response: constants.MOCK_RESPONSE_BODY,
      }),
    ).toEqual({
      isLoading: false,
      error: null,
      response: constants.MOCK_RESPONSE_BODY,
      type: null,
    });
  });
});
describe('notificationsReducer', () => {
  test('should return the initial state [notifications-reducer-initial-state]', () => {
    expect(notificationsReducer(undefined, {})).toEqual(
      notificationReducerState,
    );
  });
  test(
    `${constants.SET_NOTIFICATIONS
    } action type should return object containing sorted mock object [notification-reducer-mock-object]`,
    () => {
      expect(
        notificationsReducer([], {
          type: constants.SET_NOTIFICATIONS,
          array: constants.MOCK_RESPONSE_BODY,
        }),
      ).toEqual({
        number: 1,
        numberUnseen: 1,
        type: 'outage',
        isActive: true,
        object: constants.MOCK_SORTED_NOTIFICATIONS,
      });
    },
  );
  test(
    `${constants.SET_NOTIFICATIONS
    } action type should return object containing sorted mock object [notification-reducer-mock-object-seen]`,
    () => {
      expect(
        notificationsReducer(notificationReducerState, {
          type: constants.NOTIFICATIONS_SEEN,
        }),
      ).toEqual({
        number: null,
        numberUnseen: null,
        type: '',
        isActive: true,
        object: {},
      });
    },
  );
});
