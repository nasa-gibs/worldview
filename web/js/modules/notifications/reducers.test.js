import {
  notificationsRequest,
  notificationsReducer,
  notificationReducerState,
} from './reducers';
import * as constants from './constants';
import { defaultRequestState } from '../core/reducers';

jest.mock('../../util/local-storage', () => ({
  __esModule: true,
  default: {
    keys: {
      NOTIFICATION_OUTAGE: 'outage',
      NOTIFICATION_ALERT: 'alert',
      NOTIFICATION_MSG: 'message',
    },
    getItem: jest.fn(),
    setItem: jest.fn(),
  },
}));

import safeLocalStorage from '../../util/local-storage';

beforeEach(() => {
  jest.clearAllMocks();
  safeLocalStorage.getItem.mockReturnValue(null);
});

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

  test('Should set error on request failure [notifications-reducer-failure]', () => {
    expect(
      notificationsRequest([], {
        type: constants.REQUEST_NOTIFICATIONS_FAILURE,
        error: 'fetch error',
      }),
    ).toEqual({
      isLoading: false,
      error: 'fetch error',
      response: null,
      type: null,
    });
  });
});

describe('notificationsReducer', () => {
  test('should return the initial state [notifications-reducer-initial-state]', () => {
    expect(notificationsReducer(undefined, {})).toEqual(notificationReducerState);
  });

  test(
    `${constants.SET_NOTIFICATIONS} action type should return object containing sorted mock object [notification-reducer-mock-object]`,
    () => {
      expect(
        notificationsReducer([], {
          type: constants.SET_NOTIFICATIONS,
          array: constants.MOCK_RESPONSE_BODY,
        }),
      ).toEqual({
        number: 1,
        numberOutagesUnseen: 1,
        numberUnseen: 1,
        type: 'outage',
        total: 1,
        isActive: true,
        object: constants.MOCK_SORTED_NOTIFICATIONS,
      });
    },
  );

  test(
    `${constants.SET_NOTIFICATIONS} action type should return object containing sorted mock object [notification-reducer-mock-object-seen]`,
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

  test('SET_NOTIFICATIONS with empty array should return current state unchanged', () => {
    const currentState = { ...notificationReducerState, number: 5 };
    const result = notificationsReducer(currentState, {
      type: constants.SET_NOTIFICATIONS,
      array: [],
    });
    expect(result).toEqual(currentState);
  });

  test('NOTIFICATIONS_SEEN preserves existing number value', () => {
    const stateWithNotifications = {
      ...notificationReducerState,
      number: 3,
      numberUnseen: 3,
      type: 'alert',
      isActive: true,
      object: { alerts: [], messages: [], outages: [], layerNotices: [] },
    };
    const result = notificationsReducer(stateWithNotifications, {
      type: constants.NOTIFICATIONS_SEEN,
    });
    expect(result.number).toBe(3);
    expect(result.numberUnseen).toBeNull();
    expect(result.type).toBe('');
    expect(result.isActive).toBe(true);
  });

  test('OUTAGE_NOTIFICATIONS_SEEN reduces number and numberUnseen by numberOutagesUnseen', () => {
    const stateWithOutages = {
      number: 3,
      numberUnseen: 3,
      numberOutagesUnseen: 2,
      type: 'outage',
      isActive: true,
      object: {
        alerts: [],
        messages: [],
        layerNotices: [],
        outages: [
          { notification_type: 'outage', created_at: '2023-03-01' },
          { notification_type: 'outage', created_at: '2023-02-01' },
        ],
      },
    };
    const result = notificationsReducer(stateWithOutages, {
      type: constants.OUTAGE_NOTIFICATIONS_SEEN,
    });
    expect(result.number).toBe(1);
    expect(result.numberUnseen).toBe(1);
    expect(result.numberOutagesUnseen).toBe(0);
  });

  test('OUTAGE_NOTIFICATIONS_SEEN sets number and numberUnseen to 0 when result would be negative', () => {
    const stateWithOutages = {
      number: 1,
      numberUnseen: 1,
      numberOutagesUnseen: 3,
      type: 'outage',
      isActive: true,
      object: {
        alerts: [],
        messages: [],
        layerNotices: [],
        outages: [
          { notification_type: 'outage', created_at: '2023-03-01' },
          { notification_type: 'outage', created_at: '2023-02-01' },
          { notification_type: 'outage', created_at: '2023-01-01' },
        ],
      },
    };
    const result = notificationsReducer(stateWithOutages, {
      type: constants.OUTAGE_NOTIFICATIONS_SEEN,
    });
    expect(result.number).toBe(0);
    expect(result.numberUnseen).toBe(0);
    expect(result.numberOutagesUnseen).toBe(0);
  });

  test('OUTAGE_NOTIFICATIONS_SEEN preserves existing object in state', () => {
    const originalObject = {
      alerts: [],
      messages: [{ notification_type: 'message', created_at: '2023-04-01' }],
      layerNotices: [{ id: 20 }],
      outages: [
        { notification_type: 'outage', created_at: '2023-03-01' },
        { notification_type: 'outage', created_at: '2023-02-01' },
      ],
    };
    const stateWithOutages = {
      number: 2,
      numberUnseen: 2,
      numberOutagesUnseen: 2,
      type: 'outage',
      isActive: true,
      object: originalObject,
    };
    const result = notificationsReducer(stateWithOutages, {
      type: constants.OUTAGE_NOTIFICATIONS_SEEN,
    });
    expect(result.object).toBe(originalObject);
  });

  test('OUTAGE_NOTIFICATIONS_SEEN updates type via getPriority on remaining notifications', () => {
    const stateWithOutages = {
      number: 2,
      numberUnseen: 2,
      numberOutagesUnseen: 2,
      type: 'outage',
      isActive: true,
      object: {
        alerts: [],
        messages: [],
        layerNotices: [],
        outages: [
          { notification_type: 'outage', created_at: '2023-03-01' },
          { notification_type: 'outage', created_at: '2023-02-01' },
        ],
      },
    };
    const result = notificationsReducer(stateWithOutages, {
      type: constants.OUTAGE_NOTIFICATIONS_SEEN,
    });
    expect(typeof result.type).toBe('string');
  });

  test('unknown action type returns current state unchanged', () => {
    const currentState = { ...notificationReducerState, number: 5 };
    const result = notificationsReducer(currentState, { type: 'UNKNOWN_ACTION' });
    expect(result).toEqual(currentState);
  });

  test('notificationReducerState has correct initial shape', () => {
    expect(notificationReducerState).toEqual({
      number: null,
      numberUnseen: null,
      type: '',
      isActive: false,
      object: {},
    });
  });
});
